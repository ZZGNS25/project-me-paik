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
import { useCloudSync, usePlay } from "@/hooks/PlayProvider";
import { useAuth } from "@/hooks/useAuth";
import { useStartFresh } from "@/hooks/useStartFresh";
import { deletePlayFromCloud } from "@/lib/cloud";
import { COMPRESS_EVERY_TURNS } from "@/lib/constants";
import { requestGenerate, requestGenerateStream } from "@/lib/geminiClient";
import { recountTurns } from "@/lib/memory";
import { takePendingMessage } from "@/lib/pending";
import { storyTitle } from "@/lib/storyTitle";
import type { ChatMessage, PlayState } from "@/lib/types";

function ChatBody() {
  const router = useRouter();
  const play = usePlay();
  const cloud = useCloudSync();
  const auth = useAuth();
  const [draft, setDraft] = useState("");
  const [busy, setBusy] = useState<"chat" | null>(null);
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
  const pendingSent = useRef(false);
  const sending = useRef(false);
  const quietCompress = useRef(false);
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

    try {
      const reply = await requestGenerateStream(state, text, setStreamingReply);
      play.appendTurn(text, reply);
      setPendingUser("");
      setStreamingReply("");
    } catch (err) {
      setDraft(text);
      setPendingUser("");
      setStreamingReply("");
      setError(err instanceof Error ? err.message : "응답을 받지 못했습니다.");
    } finally {
      sending.current = false;
      setBusy(null);
    }
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

  function regenerate(userMessageId: string) {
    const run = () => {
      const rewound = play.rewindForRegen(userMessageId);
      if (rewound) void sendMessage(rewound.text, rewound.state);
    };
    if (!laterTurnsWillDrop(userMessageId)) {
      run();
      return;
    }
    confirm.ask({
      message: "이 뒤의 대화가 사라지고 답을 다시 씁니다.",
      confirmLabel: "다시 쓰기",
      danger: true,
      run,
    });
  }

  function pinTurn(user: ChatMessage, model?: ChatMessage) {
    play.pinTurn(user, model);
    setPinnedFlash(true);
    window.setTimeout(() => setPinnedFlash(false), 1600);
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
            />
          </div>
          <button
            type="button"
            className="btn-quiet"
            onClick={() => setMenuOpen(true)}
          >
            메뉴
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
          onRegenerate={regenerate}
          onPinTurn={pinTurn}
          onPickMe={openPersonaPicker}
        />

        <div className="composer-dock">
          <div className="mx-auto w-full max-w-2xl">
            {error ? <p className="alert-error mb-3">{error}</p> : null}
            <div className="composer-tools">
              <button
                type="button"
                className="me-chip"
                onClick={openPersonaPicker}
                title="이 이야기의 나"
              >
                <AvatarCircle
                  src={play.state.userPersona.photo}
                  name={meName}
                  size="sm"
                />
                <span className="me-chip-who">나</span>
                <span className="me-chip-name">
                  {play.state.userPersona.name.trim() || "프로필 고르기"}
                </span>
              </button>
              <button
                type="button"
                className="btn-quiet"
                disabled={Boolean(busy) || compressing || play.state.shortTermBuffer.length === 0}
                onClick={() => void compressMemory()}
              >
                {compressing ? "압축 중…" : "압축"}
              </button>
              <button
                type="button"
                className="btn-quiet"
                disabled={Boolean(busy) || !hasTurns}
                onClick={pinLastTurn}
              >
                {pinnedFlash ? "고정됨" : "고정"}
              </button>
            </div>
            <Composer
              value={draft}
              onChange={setDraft}
              onSubmit={() => void sendMessage()}
              disabled={Boolean(busy)}
              placeholder="@나: 내 말  ·  @이름: 그 인물 말"
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
            editDisabled={Boolean(busy) || !hasTurns}
            deleteLastDisabled={Boolean(busy) || !hasTurns}
            compressing={compressing}
            pinLabel={pinnedFlash ? "고정됨" : "고정"}
            pinDisabled={Boolean(busy) || !hasTurns}
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
            onEditLast={() => {
              const text = play.popLastUserMessage();
              if (text) setDraft(text);
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
            onPick={(id) => {
              play.applyPersona(id);
              setPickingPersona(false);
            }}
            onEdit={(id) => goProfile(id)}
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
