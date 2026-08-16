"use client";

import { useAuth } from "@/hooks/useAuth";

export default function AuthButton() {
  const auth = useAuth();

  if (!auth.enabled) {
    return (
      <p className="text-xs text-[var(--ink-dim)]">
        로컬 저장만 사용 중 · 클라우드 로그인은 환경 변수 설정 후
      </p>
    );
  }

  if (!auth.ready) {
    return <p className="mono-readout text-xs text-[var(--ink-dim)]">AUTH…</p>;
  }

  if (auth.user) {
    return (
      <div className="flex items-center gap-3">
        <span className="max-w-[10rem] truncate text-xs text-[var(--ink-soft)]">
          {auth.user.email}
        </span>
        <button
          type="button"
          className="btn-quiet"
          onClick={auth.signOut}
          disabled={auth.busy}
        >
          로그아웃
        </button>
      </div>
    );
  }

  return (
    <div className="text-right">
      <button
        type="button"
        className="btn-primary"
        onClick={auth.signInWithGoogle}
        disabled={auth.busy}
      >
        {auth.busy ? "연결 중…" : "Google로 시작하기"}
      </button>
      {auth.error ? <p className="alert-error mt-2">{auth.error}</p> : null}
    </div>
  );
}
