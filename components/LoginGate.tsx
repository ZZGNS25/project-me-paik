"use client";

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
    <main className="login-stage">
      <div className="login-copy">
        <BrandLockup layout="row" />
        <p className="login-kicker">{SITE_TAGLINE}</p>
        <h1>이야기가 끊기지 않게</h1>
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
      <div className="login-faces">
        {WORLD_PRESETS.map((preset) => (
          <article key={preset.id} className="login-face">
            <div className="login-face-photo">
              {preset.character.photo ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={preset.character.photo} alt="" />
              ) : (
                <span>{preset.character.name.slice(0, 1)}</span>
              )}
            </div>
            <div className="login-face-meta">
              <p className="login-face-label">{preset.label}</p>
              <p className="login-face-name">{preset.character.name}</p>
              <p className="login-face-line">{preset.character.oneLiner}</p>
            </div>
          </article>
        ))}
      </div>
    </main>
  );
}
