"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import AppFrame from "@/components/AppFrame";
import ChatLog from "@/components/ChatLog";
import ProfileCard from "@/components/ProfileCard";
import Composer from "@/components/Composer";
import StoryExtrasPanel from "@/components/StoryExtrasPanel";
import PersonaPicker from "@/components/PersonaPicker";
import PageShell from "@/components/PageShell";
import { useConfirm } from "@/components/ConfirmDialog";
import ShareButton from "@/components/ShareButton";
import { useCloudSync, usePlay } from "@/hooks/PlayProvider";
import { useAuth } from "@/hooks/useAuth";
import { useStartFresh } from "@/hooks/useStartFresh";
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
          <div className="flex shrink-0 flex-wrap items-center justify-end gap-1">
            <button
              type="button"
              className="btn-quiet"
              onClick={() => void saveChat()}
              disabled={cloud.status === "saving"}
              title={cloud.error || "지금 대화를 저장합니다"}
            >
              {cloud.status === "saving"
                ? "저장 중…"
                : cloud.status === "error"
                  ? "저장 실패"
                  : savedFlash
                    ? "저장됨"
                    : "저장"}
            </button>
            <ShareButton />
            <button
              type="button"
              className="btn-quiet"
              onClick={fresh.startChat}
            >
              새로
            </button>
            <button
              type="button"
              className="btn-quiet"
              title="이 이야기의 나"
              onClick={() => {
                if (play.personas.length === 0) {
                  router.push("/?view=profiles");
                  return;
                }
                setPickingPersona(true);
              }}
            >
              나
            </button>
            <button
              type="button"
              className="btn-quiet"
              onClick={() => setExtrasOpen((open) => !open)}
            >
              {extrasOpen ? "닫기" : "인물 추가"}
            </button>
          </div>
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
        />

        <div className="composer-dock">
          <div className="mx-auto w-full max-w-2xl">
            {error ? <p className="alert-error mb-3">{error}</p> : null}
            {play.state.chatLog.length > 0 && !pendingUser && !streamingReply ? (
              <div className="chat-actions">
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
                  disabled={Boolean(busy)}
                  onClick={pinLastTurn}
                >
                  {pinnedFlash ? "고정됨" : "고정"}
                </button>
                <button
                  type="button"
                  className="btn-quiet"
                  disabled={Boolean(busy)}
                  onClick={() => {
                    const text = play.popLastUserMessage();
                    if (text) setDraft(text);
                  }}
                >
                  마지막 말 수정
                </button>
                <button
                  type="button"
                  className="btn-danger"
                  disabled={Boolean(busy)}
                  onClick={() =>
                    confirm.ask({
                      message: "마지막 턴을 지울까요?",
                      confirmLabel: "삭제",
                      danger: true,
                      run: play.deleteLastTurn,
                    })
                  }
                >
                  마지막 턴 삭제
                </button>
              </div>
            ) : null}
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
        {pickingPersona ? (
          <PersonaPicker
            personas={play.personas}
            selectedId={current?.personaId}
            copy="다음 대사부터 이 이야기의 나가 바뀝니다. 지난 장면은 그대로입니다."
            onPick={(id) => {
              play.applyPersona(id);
              setPickingPersona(false);
            }}
            onCancel={() => setPickingPersona(false)}
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
