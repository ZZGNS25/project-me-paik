"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import AuthButton from "@/components/AuthButton";
import ChatLog from "@/components/ChatLog";
import MemoryPanel from "@/components/MemoryPanel";
import PageShell from "@/components/PageShell";
import { useAuth } from "@/hooks/useAuth";
import { usePlayState } from "@/hooks/usePlayState";
import { savePlayToCloud } from "@/lib/cloud";
import { generateGeminiText } from "@/lib/gemini";
import { buildChatPrompt, buildSummaryPrompt } from "@/lib/prompt";

export default function ChatPage() {
  const router = useRouter();
  const play = usePlayState();
  const auth = useAuth();
  const [draft, setDraft] = useState("");
  const [busy, setBusy] = useState<"chat" | "summary" | "cloud" | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!play.ready) return;
    if (!play.state.apiKey) {
      router.replace("/");
      return;
    }
    if (!play.state.character.name) {
      router.replace("/setup");
    }
  }, [play.ready, play.state.apiKey, play.state.character.name, router]);

  if (!play.ready) {
    return (
      <PageShell wide>
        <p className="mono-readout text-sm text-[var(--ink-dim)]">불러오는 중…</p>
      </PageShell>
    );
  }

  async function sendMessage() {
    const text = draft.trim();
    if (!text || busy) return;

    setBusy("chat");
    setError("");
    setDraft("");

    try {
      const reply = await generateGeminiText(
        play.state.apiKey,
        buildChatPrompt(play.state, text),
      );
      play.appendTurn(text, reply);
    } catch (err) {
      setDraft(text);
      setError(err instanceof Error ? err.message : "응답을 받지 못했습니다.");
    } finally {
      setBusy(null);
    }
  }

  async function compressMemory() {
    if (busy || play.state.shortTermBuffer.length === 0) return;
    setBusy("summary");
    setError("");

    try {
      const summary = await generateGeminiText(
        play.state.apiKey,
        buildSummaryPrompt(play.state),
      );
      play.applySummary(summary);
    } catch (err) {
      setError(err instanceof Error ? err.message : "요약을 만들지 못했습니다.");
    } finally {
      setBusy(null);
    }
  }

  async function saveCloud() {
    if (!auth.user) {
      setError("클라우드 저장은 Google 로그인 후 사용할 수 있습니다.");
      return;
    }

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
    <PageShell wide>
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="label-caps">이어롤</p>
          <h1 className="text-2xl font-semibold">
            {play.state.character.name || "채팅"}
          </h1>
        </div>
        <div className="flex flex-wrap items-center gap-4">
          <AuthButton />
          <button
            type="button"
            className="ghost-link"
            onClick={saveCloud}
            disabled={busy === "cloud"}
          >
            {busy === "cloud" ? "저장 중…" : "클라우드 저장"}
          </button>
          <Link href="/setup" className="ghost-link">
            설정
          </Link>
        </div>
      </div>

      <div className="grid min-h-[70vh] gap-4 lg:grid-cols-[20rem_1fr]">
        <MemoryPanel
          state={play.state}
          onSummaryChange={play.setStorySummary}
          onCompress={compressMemory}
          compressing={busy === "summary"}
        />

        <section className="paper-panel flex min-h-[28rem] flex-col">
          <ChatLog messages={play.state.chatLog} />
          {error ? <p className="alert-error mx-4 mb-3">{error}</p> : null}
          <form
            className="flex gap-3 border-t border-[var(--line)] p-4"
            onSubmit={(event) => {
              event.preventDefault();
              void sendMessage();
            }}
          >
            <textarea
              className="field-input mt-0 min-h-[3rem] flex-1"
              rows={2}
              placeholder="대사나 행동을 입력하세요"
              value={draft}
              disabled={Boolean(busy)}
              onChange={(event) => setDraft(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter" && !event.shiftKey) {
                  event.preventDefault();
                  void sendMessage();
                }
              }}
            />
            <button
              type="submit"
              className="btn-primary self-end"
              disabled={Boolean(busy) || !draft.trim()}
            >
              {busy === "chat" ? "응답 중" : "전송"}
            </button>
          </form>
        </section>
      </div>
    </PageShell>
  );
}
