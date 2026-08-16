"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import AppFrame from "@/components/AppFrame";
import ChatLog from "@/components/ChatLog";
import ProfileCard from "@/components/ProfileCard";
import Composer from "@/components/Composer";
import StoryExtrasPanel from "@/components/StoryExtrasPanel";
import PageShell from "@/components/PageShell";
import { useCloudSync, usePlay } from "@/hooks/PlayProvider";
import { useAuth } from "@/hooks/useAuth";
import { requestGenerateStream } from "@/lib/geminiClient";
import { takePendingMessage } from "@/lib/pending";
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
  const [pendingUser, setPendingUser] = useState("");
  const [streamingReply, setStreamingReply] = useState("");
  const pendingSent = useRef(false);
  const sending = useRef(false);

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

  function confirmLaterTurns(fromId: string) {
    const index = play.state.chatLog.findIndex((item) => item.id === fromId);
    return index >= 0 && index < play.state.chatLog.length - 2
      ? window.confirm("이 뒤의 대화가 사라집니다. 계속할까요?")
      : true;
  }

  function truncateFrom(messageId: string) {
    if (!confirmLaterTurns(messageId)) return;
    play.truncateFrom(messageId);
  }

  function regenerate(userMessageId: string) {
    if (!confirmLaterTurns(userMessageId)) return;
    const rewound = play.rewindForRegen(userMessageId);
    if (rewound) void sendMessage(rewound.text, rewound.state);
  }

  function pinTurn(user: ChatMessage, model?: ChatMessage) {
    play.pinTurn(user, model);
  }

  const listening = busy === "chat";
  const cloudLabel =
    cloud.status === "saving"
      ? "저장 중…"
      : cloud.status === "error"
        ? "저장 실패"
        : cloud.status === "saved"
          ? "저장됨"
          : "자동 저장";

  return (
    <AppFrame>
      <div className="chat-shell">
        <div className="chat-topbar">
          <div className="min-w-0">
            <ProfileCard
              name={play.state.character.name || "채팅"}
              photo={play.state.character.photo}
              status={listening ? "듣는 중" : "대기 중"}
              statusIdle={!listening}
            />
          </div>
          <div className="flex shrink-0 items-center gap-1">
            <button
              type="button"
              className="btn-quiet"
              onClick={() => setExtrasOpen((open) => !open)}
            >
              {extrasOpen ? "닫기" : "인물 추가"}
            </button>
            <button
              type="button"
              className={cloud.status === "error" ? "btn-danger" : "btn-quiet"}
              onClick={() => void cloud.saveNow()}
              disabled={cloud.status === "saving"}
              title={cloud.error || "이야기가 바뀌면 클라우드에 자동으로 남깁니다."}
            >
              {cloudLabel}
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
          messages={play.state.chatLog}
          prologue={play.state.prologue}
          characterPhoto={play.state.character.photo}
          characterName={play.state.character.name}
          userPhoto={play.state.userPersona.photo}
          userName={play.state.userPersona.name}
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
                  onClick={play.deleteLastTurn}
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
