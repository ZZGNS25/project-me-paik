"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import AppFrame from "@/components/AppFrame";
import ChatLog from "@/components/ChatLog";
import Composer from "@/components/Composer";
import PageShell from "@/components/PageShell";
import { useAuth } from "@/hooks/useAuth";
import { usePlayState } from "@/hooks/usePlayState";
import { savePlayToCloud } from "@/lib/cloud";
import { requestGenerate } from "@/lib/geminiClient";
import { takePendingMessage } from "@/lib/pending";

function ChatBody() {
  const router = useRouter();
  const play = usePlayState();
  const auth = useAuth();
  const [draft, setDraft] = useState("");
  const [busy, setBusy] = useState<"chat" | "cloud" | null>(null);
  const [error, setError] = useState("");
  const pendingSent = useRef(false);

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
    if (!text || busy) return;

    setBusy("chat");
    setError("");
    setDraft("");

    try {
      const reply = await requestGenerate("chat", play.state, text);
      play.appendTurn(text, reply);
    } catch (err) {
      setDraft(text);
      setError(err instanceof Error ? err.message : "응답을 받지 못했습니다.");
    } finally {
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
          <div>
            <p className="label-caps">이어롤</p>
            <h1 className="text-xl font-semibold">
              {play.state.character.name || "채팅"}
            </h1>
          </div>
          <button
            type="button"
            className="ghost-link"
            onClick={saveCloud}
            disabled={busy === "cloud"}
          >
            {busy === "cloud" ? "저장 중…" : "클라우드 저장"}
          </button>
        </div>

        <ChatLog messages={play.state.chatLog} />

        <div className="mx-auto w-full max-w-3xl px-4 pb-6">
          {error ? <p className="alert-error mb-3">{error}</p> : null}
          <Composer
            value={draft}
            onChange={setDraft}
            onSubmit={() => void sendMessage()}
            disabled={Boolean(busy)}
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
