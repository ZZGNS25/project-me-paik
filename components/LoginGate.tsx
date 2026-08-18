"use client";

import BrandLockup from "@/components/BrandLockup";
import { SITE_TAGLINE } from "@/lib/site";

type LoginGateProps = {
  busy?: boolean;
  error?: string;
  enabled: boolean;
  onGoogle: () => void;
};

export default function LoginGate({
  busy = false,
  error,
  enabled,
  onGoogle,
}: LoginGateProps) {
  return (
    <main className="login-stage paper-card">
      <div className="login-copy">
        <BrandLockup layout="row" />
        <h1>이야기가 끊기지 않게.</h1>
        <p className="login-lead">{SITE_TAGLINE}</p>
        {!enabled ? (
          <p className="alert-error">
            Supabase 환경 변수가 없어 로그인할 수 없습니다.
          </p>
        ) : (
          <>
            <button
              type="button"
              className="btn-primary login-cta"
              onClick={onGoogle}
              disabled={busy}
            >
              {busy ? "연결 중…" : "Google로 시작하기"}
            </button>
            {error ? <p className="alert-error">{error}</p> : null}
          </>
        )}
      </div>
    </main>
  );
}
