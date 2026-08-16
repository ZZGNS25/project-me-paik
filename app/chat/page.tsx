"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import AppFrame from "@/components/AppFrame";
import ChatLog from "@/components/ChatLog";
import ProfileCard from "@/components/ProfileCard";
import Composer from "@/components/Composer";
import StoryExtrasPanel from "@/components/StoryExtrasPanel";
import PageShell from "@/components/PageShell";
import { useAuth } from "@/hooks/useAuth";
import { usePlayState } from "@/hooks/usePlayState";
import { savePlayToCloud } from "@/lib/cloud";
import { requestGenerateStream } from "@/lib/geminiClient";
import { takePendingMessage } from "@/lib/pending";

function ChatBody() {
  const router = useRouter();
  const play = usePlayState();
  const auth = useAuth();
  const [draft, setDraft] = useState("");
  const [busy, setBusy] = useState<"chat" | "cloud" | null>(null);
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

  async function sendMessage(text = draft.trim()) {
    if (!text || sending.current) return;

    sending.current = true;
    setBusy("chat");
    setError("");
    setDraft("");
    setPendingUser(text);
    setStreamingReply("");

    try {
      const reply = await requestGenerateStream(play.state, text, setStreamingReply);
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

  async function saveCloud() {
    if (!auth.user) return;
    setBusy("cloud");
    setError("");
    try {
      const id = await savePlayToCloud(auth.user.id, play.state);
      play.setCloudSessionId(id);
    } catch (err) {
      setError(err instanceof Error ? err.message : "클라우드 저장에 실패했습니다.");
    } finally {
      setBusy(null);
    }
  }

  return (
    <AppFrame>
      <div className="flex h-full flex-col">
        <div className="flex items-center justify-between px-6 py-4">
          <ProfileCard
            name={play.state.character.name || "채팅"}
            oneLiner={play.state.character.oneLiner}
            photo={play.state.character.photo}
          />
          <div className="flex items-center gap-3">
            <button
              type="button"
              className="ghost-link"
              onClick={() => setExtrasOpen((open) => !open)}
            >
              {extrasOpen ? "닫기" : "인물·설정 추가"}
            </button>
            <button
              type="button"
              className="ghost-link"
              onClick={saveCloud}
              disabled={busy === "cloud"}
            >
              {busy === "cloud" ? "저장 중…" : "클라우드 저장"}
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
          onEditLast={
            busy
              ? undefined
              : () => {
                  const text = play.popLastUserMessage();
                  if (text) setDraft(text);
                }
          }
          onDeleteLast={busy ? undefined : play.deleteLastTurn}
        />

        <div className="mx-auto w-full max-w-3xl px-4 pb-6">
          {error ? <p className="alert-error mb-3">{error}</p> : null}
          <Composer
            value={draft}
            onChange={setDraft}
            onSubmit={() => void sendMessage()}
            disabled={Boolean(busy)}
            placeholder="@:나레이션  @이름:대사  *행동*"
          />
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
