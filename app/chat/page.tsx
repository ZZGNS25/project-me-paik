"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import AppFrame from "@/components/AppFrame";
import ChatLog from "@/components/ChatLog";
import ProfileCard from "@/components/ProfileCard";
import Composer from "@/components/Composer";
import StoryExtrasPanel from "@/components/StoryExtrasPanel";
import PersonaPicker from "@/components/PersonaPicker";
import ContinueSheet from "@/components/ContinueSheet";
import ChatMenu from "@/components/ChatMenu";
import PageShell from "@/components/PageShell";
import { useConfirm } from "@/components/ConfirmDialog";
import AvatarCircle from "@/components/AvatarCircle";
import Icon from "@/components/Icon";
import { useCloudSync, usePlay } from "@/hooks/PlayProvider";
import { useAuth } from "@/hooks/useAuth";
import { useStartFresh } from "@/hooks/useStartFresh";
import { deletePlayFromCloud } from "@/lib/cloud";
import { COMPRESS_EVERY_TURNS } from "@/lib/constants";
import {
  GenerateStoppedError,
  isAbortError,
  requestGenerate,
  requestGenerateStream,
} from "@/lib/geminiClient";
import { recountTurns } from "@/lib/memory";
import { takePendingMessage } from "@/lib/pending";
import { STORY_PERSONA_EDIT } from "@/lib/persona";
import { storyTitle } from "@/lib/storyTitle";
import { downloadTranscript } from "@/lib/transcript";
import type { ChatMessage, PlayState } from "@/lib/types";

function cleanSuggest(raw: string) {
  return raw
    .replace(/^```[\w]*\s*/, "")
    .replace(/\s*```$/, "")
    .trim()
    .slice(0, 2000);
}

function ChatBody() {
  const router = useRouter();
  const play = usePlay();
  const cloud = useCloudSync();
  const auth = useAuth();
  const [draft, setDraft] = useState("");
  const [busy, setBusy] = useState<"chat" | "suggest" | null>(null);
  const [error, setError] = useState("");
  const [extrasOpen, setExtrasOpen] = useState(false);
  const [pickingPersona, setPickingPersona] = useState(false);
  const [continuing, setContinuing] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [pendingUser, setPendingUser] = useState("");
  const [streamingReply, setStreamingReply] = useState("");
  const [compressing, setCompressing] = useState(false);
  const [savedFlash, setSavedFlash] = useState(false);
  const [pinnedFlash, setPinnedFlash] = useState(false);
  const [pinFlashId, setPinFlashId] = useState<string | null>(null);
  const pendingSent = useRef(false);
  const sending = useRef(false);
  const quietCompress = useRef(false);
  const abortRef = useRef<AbortController | null>(null);
  const pinTimer = useRef(0);
  const confirm = useConfirm();
  const fresh = useStartFresh();

  useEffect(() => {
    if (!play.ready || !auth.ready) return;
    if (!auth.user) {
      router.replace("/");
      return;
    }
    if (!play.state.character.name) {
      router.replace("/setup");
    }
  }, [play.ready, auth.ready, auth.user, play.state.character.name, router]);

  useEffect(() => {
    if (!play.ready || !auth.user || pendingSent.current) return;
    const pending = takePendingMessage();
    if (!pending) return;
    pendingSent.current = true;
    void sendMessage(pending);
  }, [play.ready, auth.user]);

  useEffect(() => {
    return () => window.clearTimeout(pinTimer.current);
  }, []);

  useEffect(() => {
    if (!play.ready || busy || quietCompress.current) return;
    if (recountTurns(play.state.shortTermBuffer) < COMPRESS_EVERY_TURNS) return;
    quietCompress.current = true;
    const closedTurns = recountTurns(play.state.shortTermBuffer);
    void requestGenerate("summary", play.state)
      .then((summary) => play.applySummary(summary, closedTurns))
      .catch(() => undefined)
      .finally(() => {
        quietCompress.current = false;
      });
  }, [play.ready, busy, play.state.turnCount, play.state.shortTermBuffer.length]);

  if (!play.ready || !auth.ready) {
    return (
      <PageShell>
        <p className="mono-readout text-sm text-[var(--ink-dim)]">불러오는 중…</p>
      </PageShell>
    );
  }

  async function sendMessage(text = draft.trim(), state: PlayState = play.state) {
    if (!text || sending.current) return;

    sending.current = true;
    setBusy("chat");
    setError("");
    setDraft("");
    setPendingUser(text);
    setStreamingReply("");
    const ac = new AbortController();
    abortRef.current = ac;

    try {
      const reply = await requestGenerateStream(
        state,
        text,
        setStreamingReply,
        ac.signal,
      );
      play.appendTurn(text, reply);
      setPendingUser("");
      setStreamingReply("");
    } catch (err) {
      setPendingUser("");
      setStreamingReply("");
      if (err instanceof GenerateStoppedError) {
        if (err.partial) {
          play.appendTurn(text, err.partial);
        } else {
          setDraft(text);
        }
      } else {
        setDraft(text);
        setError(err instanceof Error ? err.message : "응답을 받지 못했습니다.");
      }
    } finally {
      abortRef.current = null;
      sending.current = false;
      setBusy(null);
    }
  }

  function stopGenerate() {
    abortRef.current?.abort();
  }

  function laterTurnsWillDrop(fromId: string) {
    const index = play.state.chatLog.findIndex((item) => item.id === fromId);
    return index >= 0 && index < play.state.chatLog.length - 2;
  }

  function truncateFrom(messageId: string) {
    if (!laterTurnsWillDrop(messageId)) {
      play.truncateFrom(messageId);
      return;
    }
    confirm.ask({
      message: "이 뒤의 대화가 사라집니다.",
      confirmLabel: "삭제",
      danger: true,
      run: () => play.truncateFrom(messageId),
    });
  }

  function regenerate(userMessageId: string, textOverride?: string, asResend = false) {
    const run = () => {
      const rewound = play.rewindForRegen(userMessageId);
      if (rewound) void sendMessage(textOverride ?? rewound.text, rewound.state);
    };
    if (!laterTurnsWillDrop(userMessageId)) {
      run();
      return;
    }
    confirm.ask({
      message: asResend
        ? "지금 적힌 내 말을 기준으로 상대의 답을 다시 받습니다. 이 뒤의 대화는 사라집니다."
        : "내 말은 그대로 두고, 상대의 답만 다시 생성합니다. 이 뒤의 대화는 사라집니다.",
      confirmLabel: asResend ? "이 말로 다시" : "다시 생성",
      danger: true,
      run,
    });
  }

  async function suggestMyLine() {
    if (sending.current) return;
    sending.current = true;
    setBusy("suggest");
    setError("");
    const ac = new AbortController();
    abortRef.current = ac;
    try {
      const text = cleanSuggest(
        await requestGenerate("suggest", play.state, draft, ac.signal),
      );
      if (ac.signal.aborted) return;
      if (!text) throw new Error("내 말을 만들지 못했습니다.");
      setDraft(text);
    } catch (err) {
      if (isAbortError(err) || err instanceof GenerateStoppedError) return;
      setError(err instanceof Error ? err.message : "내 말을 만들지 못했습니다.");
    } finally {
      abortRef.current = null;
      sending.current = false;
      setBusy(null);
    }
  }

  function pinTurn(user: ChatMessage, model?: ChatMessage) {
    play.pinTurn(user, model);
    setPinnedFlash(true);
    setPinFlashId(user.id);
    window.clearTimeout(pinTimer.current);
    pinTimer.current = window.setTimeout(() => {
      setPinnedFlash(false);
      setPinFlashId(null);
    }, 1600);
  }

  async function saveChat() {
    await cloud.saveNow();
    if (cloud.status !== "error") {
      setSavedFlash(true);
      window.setTimeout(() => setSavedFlash(false), 1600);
    }
  }

  async function compressMemory() {
    if (compressing || play.state.shortTermBuffer.length === 0) return;
    setCompressing(true);
    try {
      const closedTurns = recountTurns(play.state.shortTermBuffer);
      const summary = await requestGenerate("summary", play.state);
      play.applySummary(summary, closedTurns);
    } catch (err) {
      setError(err instanceof Error ? err.message : "요약을 만들지 못했습니다.");
    } finally {
      setCompressing(false);
    }
  }

  function pinLastTurn() {
    const log = play.state.chatLog;
    if (log.length === 0) return;
    const last = log[log.length - 1];
    const prev = log[log.length - 2];
    if (last.role === "model" && prev?.role === "user") {
      pinTurn(prev, last);
      return;
    }
    pinTurn(last);
  }

  const listening = busy === "chat";
  const current = play.settings.find((item) => item.id === play.currentSettingId);
  const headerName = current
    ? storyTitle(current)
    : play.state.character.name || "채팅";
  const meName = play.state.userPersona.name.trim() || "나";
  const hasTurns = play.state.chatLog.length > 0;

  function openPersonaPicker() {
    setMenuOpen(false);
    setPickingPersona(true);
  }

  function goProfile(editId?: string) {
    setPickingPersona(false);
    const query = editId
      ? `/?view=profiles&from=chat&edit=${editId}`
      : "/?view=profiles&from=chat";
    router.push(query);
  }

  const savedStories = play.settings
    .filter((item) => item.chatLog.length > 0)
    .slice()
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));

  return (
    <AppFrame>
      <div className="chat-shell">
        <div className="chat-topbar">
          <div className="min-w-0">
            <ProfileCard
              name={headerName}
              photo={play.state.character.photo}
              status={listening ? "듣는 중" : "대기 중"}
              statusIdle={!listening}
              onOpen={() => {
                if (!play.currentSettingId) return;
                router.push(
                  `/setup?id=${encodeURIComponent(play.currentSettingId)}&from=chat`,
                );
              }}
            />
          </div>
          <button
            type="button"
            className="icon-btn"
            aria-label="메뉴"
            onClick={() => setMenuOpen(true)}
          >
            <Icon name="menu" />
          </button>
        </div>

        {extrasOpen ? (
          <StoryExtrasPanel
            worldSetting={play.state.worldSetting}
            castNotes={play.state.castNotes}
            onWorldChange={play.setWorldSetting}
            onAddCast={play.addCastNote}
            onUpdateCast={play.updateCastNote}
            onRemoveCast={play.removeCastNote}
          />
        ) : null}

        <ChatLog
          key={play.currentSettingId}
          messages={play.state.chatLog}
          prologue={play.state.prologue}
          characterPhoto={play.state.character.photo}
          characterName={play.state.character.name}
          userPhoto={play.state.userPersona.photo}
          userName={play.state.userPersona.name}
          castNotes={play.state.castNotes}
          pendingUserText={pendingUser}
          streamingText={streamingReply}
          actionsDisabled={Boolean(busy)}
          onTruncateFrom={truncateFrom}
          onResend={(id, text) => regenerate(id, text, true)}
          onRegenerate={(id) => regenerate(id)}
          onPinTurn={pinTurn}
          onEditMessage={(id, content) => play.updateMessage(id, content)}
          onPickMe={openPersonaPicker}
          pinFlashId={pinFlashId}
        />

        <div className="composer-dock">
          <div className="mx-auto w-full max-w-4xl">
            {error ? <p className="alert-error mb-3">{error}</p> : null}
            <div className="composer-tools">
              <div className="me-chip">
                <AvatarCircle
                  src={play.state.userPersona.photo}
                  name={meName}
                  size="sm"
                />
                <button
                  type="button"
                  className="me-chip-hit"
                  onClick={openPersonaPicker}
                  title="이 이야기의 나"
                >
                  <span className="me-chip-name">
                    {play.state.userPersona.name.trim() || "나"}
                  </span>
                </button>
              </div>
              <button
                type="button"
                className="icon-btn"
                disabled={Boolean(busy)}
                onClick={() => void suggestMyLine()}
                aria-label={busy === "suggest" ? "쓰는 중" : "대신 쓰기"}
                title="대신 쓰기"
              >
                <Icon name="suggest" />
              </button>
              <button
                type="button"
                className="icon-btn"
                disabled={Boolean(busy) || compressing || play.state.shortTermBuffer.length === 0}
                onClick={() => void compressMemory()}
                aria-label={compressing ? "압축 중" : "압축"}
                title="압축"
              >
                <Icon name="compress" />
              </button>
              <button
                type="button"
                className={`icon-btn ${pinnedFlash ? "is-on" : ""}`}
                disabled={Boolean(busy) || !hasTurns}
                onClick={pinLastTurn}
                aria-label={pinnedFlash ? "고정됨" : "고정"}
                title={pinnedFlash ? "고정됨" : "고정"}
              >
                <Icon name="pin" />
              </button>
            </div>
            <Composer
              value={draft}
              onChange={setDraft}
              onSubmit={() => void sendMessage()}
              onStop={busy ? stopGenerate : undefined}
              disabled={busy === "suggest"}
              placeholder={
                busy === "suggest"
                  ? "맥락에 맞게 쓰는 중…"
                  : "@나: 내 말  ·  @이름: 그 인물 말"
              }
            />
            <p className="composer-hint">@: 장면 · @나: 내 말 · @이름: 그 인물 · *행동*</p>
          </div>
        </div>
        {confirm.dialog}
        {fresh.dialog}
        {menuOpen ? (
          <ChatMenu
            profileName={meName}
            saveLabel={
              cloud.status === "saving"
                ? "저장 중…"
                : cloud.status === "error"
                  ? "저장 실패"
                  : savedFlash
                    ? "저장됨"
                    : ""
            }
            saveDisabled={cloud.status === "saving"}
            extrasOpen={extrasOpen}
            deleteLastDisabled={Boolean(busy) || !hasTurns}
            compressing={compressing}
            pinLabel={pinnedFlash ? "고정됨" : "고정"}
            pinDisabled={Boolean(busy) || !hasTurns}
            downloadDisabled={!current}
            compressDisabled={
              Boolean(busy) || compressing || play.state.shortTermBuffer.length === 0
            }
            onPickProfile={openPersonaPicker}
            onSave={() => {
              void saveChat();
            }}
            onFresh={() => {
              setMenuOpen(false);
              fresh.startChat();
            }}
            onContinue={() => {
              setMenuOpen(false);
              setContinuing(true);
            }}
            onDownload={() => {
              if (current) downloadTranscript(current);
              setMenuOpen(false);
            }}
            onExtras={() => {
              setExtrasOpen((open) => !open);
              setMenuOpen(false);
            }}
            onCompress={() => {
              setMenuOpen(false);
              void compressMemory();
            }}
            onPin={() => {
              pinLastTurn();
              setMenuOpen(false);
            }}
            onDeleteLast={() => {
              setMenuOpen(false);
              confirm.ask({
                message: "마지막 턴을 지울까요?",
                confirmLabel: "삭제",
                danger: true,
                run: play.deleteLastTurn,
              });
            }}
            onDeleteStory={() => {
              setMenuOpen(false);
              confirm.ask({
                message: "이 이야기를 지울까요? 세계와 대화가 함께 사라집니다.",
                confirmLabel: "삭제",
                danger: true,
                run: async () => {
                  const sessionId = play.state.cloudSessionId;
                  const id = play.currentSettingId;
                  if (sessionId) {
                    await deletePlayFromCloud(sessionId).catch(() => undefined);
                  }
                  play.deleteSetting(id);
                  router.push("/");
                },
              });
            }}
            onClose={() => setMenuOpen(false)}
          />
        ) : null}
        {pickingPersona ? (
          <PersonaPicker
            personas={play.personas}
            selectedId={current?.personaId}
            current={play.state.userPersona}
            onPick={(id) => {
              play.applyPersona(id);
              setPickingPersona(false);
            }}
            onEdit={(id) => goProfile(id)}
            onEditCurrent={() => goProfile(STORY_PERSONA_EDIT)}
            onAdd={() => goProfile()}
            onCancel={() => setPickingPersona(false)}
          />
        ) : null}
        {continuing ? (
          <ContinueSheet
            stories={savedStories}
            currentId={play.currentSettingId}
            onPick={(id) => {
              play.selectSetting(id);
              setContinuing(false);
              router.push("/chat");
            }}
            onClose={() => setContinuing(false)}
          />
        ) : null}
      </div>
    </AppFrame>
  );
}

export default function ChatPage() {
  return (
    <Suspense
      fallback={
        <PageShell>
          <p className="mono-readout text-sm text-[var(--ink-dim)]">불러오는 중…</p>
        </PageShell>
      }
    >
      <ChatBody />
    </Suspense>
  );
}
