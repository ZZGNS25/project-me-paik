"use client";

import { useState } from "react";
import BrandLockup from "@/components/BrandLockup";
import { SITE_TAGLINE } from "@/lib/site";

type LoginGateProps = {
  busy?: boolean;
  error?: string;
  enabled: boolean;
  onGoogle: () => void;
  onGuest: () => void;
};

export default function LoginGate({
  busy = false,
  error,
  enabled,
  onGoogle,
  onGuest,
}: LoginGateProps) {
  const [guestWarning, setGuestWarning] = useState(false);

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
            <div className="login-actions">
              <button
                type="button"
                className="btn-primary login-cta"
                onClick={onGoogle}
                disabled={busy}
              >
                Google로 시작하기
              </button>
              <button
                type="button"
                className="btn-secondary login-cta"
                onClick={() => setGuestWarning(true)}
                disabled={busy}
              >
                Guest로 로그인
              </button>
            </div>
            {guestWarning ? (
              <div className="login-guest-warning" role="alert">
                <p>
                  Guest로 시작하면 이야기가 이 브라우저 세션에만 남습니다. 브라우저를
                  닫으면 모든 기록이 사라집니다.
                </p>
                <div className="login-guest-warning-actions">
                  <button
                    type="button"
                    className="btn-quiet"
                    onClick={() => setGuestWarning(false)}
                    disabled={busy}
                  >
                    취소
                  </button>
                  <button
                    type="button"
                    className="btn-primary"
                    onClick={onGuest}
                    disabled={busy}
                  >
                    {busy ? "연결 중…" : "Guest로 계속"}
                  </button>
                </div>
              </div>
            ) : null}
            {error ? <p className="alert-error">{error}</p> : null}
          </>
        )}
      </div>
    </main>
  );
}
