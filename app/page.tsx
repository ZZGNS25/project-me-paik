"use client";

import { useRouter } from "next/navigation";
import PageShell from "@/components/PageShell";
import { useAuth } from "@/hooks/useAuth";
import { usePlayState } from "@/hooks/usePlayState";

export default function HomePage() {
  const router = useRouter();
  const auth = useAuth();
  const { state, ready } = usePlayState();

  if (!auth.ready || !ready) {
    return (
      <PageShell>
        <p className="mono-readout text-sm text-[var(--ink-dim)]">불러오는 중…</p>
      </PageShell>
    );
  }

  const canContinue = Boolean(state.character.name);

  return (
    <PageShell>
      <main className="paper-card mt-10 px-7 py-10">
        <span className="gemini-mark text-sm font-semibold text-white">이</span>
        <p className="label-caps mt-5">이어 + Role</p>
        <h1 className="mt-3 text-4xl font-semibold tracking-tight">이어롤</h1>
        <p className="mt-4 text-base leading-relaxed text-[var(--ink-soft)]">
          길게 놀아도 캐릭터 설정이 이어지는 개인용 스토리 롤플 채팅.
          Google로 들어오면 바로 시작할 수 있습니다.
        </p>

        {!auth.enabled ? (
          <p className="alert-error mt-8">
            Supabase 환경 변수가 없어 로그인할 수 없습니다.
          </p>
        ) : !auth.user ? (
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
        ) : (
          <>
            <p className="mt-8 text-sm text-[var(--ink-soft)]">{auth.user.email}</p>
            <button
              type="button"
              className="btn-primary mt-4 w-full"
              onClick={() => router.push("/setup")}
            >
              설정 작성하기
            </button>
            {canContinue ? (
              <button
                type="button"
                className="btn-secondary mt-3 w-full"
                onClick={() => router.push("/chat")}
              >
                이어서 하기 · {state.character.name}
              </button>
            ) : null}
            <button
              type="button"
              className="ghost-link mt-5 block w-full text-center"
              onClick={auth.signOut}
              disabled={auth.busy}
            >
              로그아웃
            </button>
          </>
        )}
      </main>
    </PageShell>
  );
}
