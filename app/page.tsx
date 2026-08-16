"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import AppFrame from "@/components/AppFrame";
import Composer from "@/components/Composer";
import GuidePanel from "@/components/GuidePanel";
import HistoryPanel from "@/components/HistoryPanel";
import PageShell from "@/components/PageShell";
import { useAuth } from "@/hooks/useAuth";
import { usePlayState } from "@/hooks/usePlayState";
import { setPendingMessage } from "@/lib/pending";

function HomeBody() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const auth = useAuth();
  const { state, ready } = usePlayState();
  const [draft, setDraft] = useState("");
  const view = searchParams.get("view");

  if (!auth.ready || !ready) {
    return (
      <PageShell>
        <p className="mono-readout text-sm text-[var(--ink-dim)]">불러오는 중…</p>
      </PageShell>
    );
  }

  if (!auth.enabled || !auth.user) {
    return (
      <PageShell>
        <main className="paper-card mt-10 px-7 py-10">
          <span className="gemini-mark text-sm font-semibold text-white">이</span>
          <p className="label-caps mt-5">이어 + Role</p>
          <h1 className="mt-3 text-4xl font-semibold tracking-tight">이어롤</h1>
          <p className="mt-4 text-base leading-relaxed text-[var(--ink-soft)]">
            길게 놀아도 캐릭터 설정이 이어지는 개인용 스토리 롤플 채팅.
          </p>
          {!auth.enabled ? (
            <p className="alert-error mt-8">
              Supabase 환경 변수가 없어 로그인할 수 없습니다.
            </p>
          ) : (
            <>
              <button
                type="button"
                className="btn-primary mt-8 w-full"
                onClick={auth.signInWithGoogle}
                disabled={auth.busy}
              >
                {auth.busy ? "연결 중…" : "Google로 시작하기"}
              </button>
              {auth.error ? <p className="alert-error mt-4">{auth.error}</p> : null}
            </>
          )}
        </main>
      </PageShell>
    );
  }

  function submitHome() {
    const text = draft.trim();
    if (!text) return;
    if (!state.character.name) {
      router.push("/setup");
      return;
    }
    setPendingMessage(text);
    router.push("/chat");
  }

  return (
    <AppFrame>
      {view === "guide" ? (
        <GuidePanel />
      ) : view === "history" ? (
        <HistoryPanel />
      ) : (
        <div className="flex h-full flex-col items-center justify-center px-6">
          <span className="gemini-mark text-sm font-semibold text-white">이</span>
          <h1 className="mt-6 text-center text-3xl font-semibold tracking-tight sm:text-4xl">
            {state.character.name
              ? `${state.character.name}과 이야기를 이어볼까요?`
              : "오늘은 어떤 이야기를 시작할까요?"}
          </h1>
          <p className="mt-3 max-w-md text-center text-sm text-[var(--ink-dim)]">
            {state.character.name
              ? "아래 칸에 대사나 행동을 적으면 바로 이어집니다."
              : "왼쪽 설정에서 캐릭터를 먼저 적어 주세요."}
          </p>
          <div className="mt-10 w-full max-w-2xl">
            <Composer
              value={draft}
              onChange={setDraft}
              onSubmit={submitHome}
              placeholder={
                state.character.name
                  ? "캐릭터에게 말을 걸어 보세요"
                  : "설정을 먼저 작성해 주세요"
              }
            />
          </div>
        </div>
      )}
    </AppFrame>
  );
}

export default function HomePage() {
  return (
    <Suspense
      fallback={
        <PageShell>
          <p className="mono-readout text-sm text-[var(--ink-dim)]">불러오는 중…</p>
        </PageShell>
      }
    >
      <HomeBody />
    </Suspense>
  );
}
