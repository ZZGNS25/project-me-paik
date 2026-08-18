"use client";

import AvatarCircle from "@/components/AvatarCircle";
import BrandLockup from "@/components/BrandLockup";
import { WORLD_PRESETS } from "@/lib/presets";
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
        <h1>이야기가 끊기지 않게</h1>
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
      <div className="login-cast">
        {WORLD_PRESETS.map((preset) => (
          <div key={preset.id} className="login-cast-item">
            <AvatarCircle
              src={preset.character.photo}
              name={preset.character.name}
              size="lg"
              zoom={false}
            />
            <p className="login-cast-name">{preset.character.name}</p>
          </div>
        ))}
        <div className="login-cast-item is-blank" title="직접 만들기">
          <span className="login-cast-slot" aria-hidden="true">
            <svg viewBox="0 0 24 24" fill="none">
              <path
                d="M8 6.2h6.1L16.4 8.6v9.2H8V6.2Z"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinejoin="round"
              />
              <path
                d="M14.1 6.2V8.6h2.3"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinejoin="round"
              />
              <path
                d="M12.2 11.4v3.6M10.4 13.2h3.6"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
              />
            </svg>
          </span>
          <p className="login-cast-name">직접</p>
        </div>
      </div>
    </main>
  );
}
