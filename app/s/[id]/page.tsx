"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import AvatarCircle from "@/components/AvatarCircle";
import BrandLockup from "@/components/BrandLockup";
import PageShell from "@/components/PageShell";
import { usePlay } from "@/hooks/PlayProvider";
import { useAuth } from "@/hooks/useAuth";
import { copyText, loadShare, shareUrl, type ShareRecord } from "@/lib/share";
import { SITE_TAGLINE } from "@/lib/site";
import { trackEvent } from "@/lib/analytics";
import ShareSheet from "@/components/ShareSheet";

export default function SharePage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const auth = useAuth();
  const play = usePlay();
  const [share, setShare] = useState<ShareRecord | null>(null);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);
  const [sharing, setSharing] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!params.id) return;
    loadShare(params.id)
      .then((loaded) => {
        setShare(loaded);
        if (!loaded) setError("이 공유 링크를 찾지 못했습니다.");
      })
      .catch((err: unknown) => {
        setError(err instanceof Error ? err.message : "공유를 불러오지 못했습니다.");
      })
      .finally(() => setReady(true));
  }, [params.id]);

  const snapshot = share?.snapshot;
  const worldPreview = snapshot?.worldSetting.trim().slice(0, 280);

  async function copyLink() {
    if (!share) return;
    await copyText(shareUrl(share.id));
    trackEvent("share_copy");
    setCopied(true);
    window.setTimeout(() => setCopied(false), 2000);
  }

  function startStory() {
    if (!snapshot) return;
    play.openFromShare(snapshot);
    trackEvent("share_start", { character: snapshot.character.name });
    router.push("/setup");
  }

  return (
    <PageShell>
      <main className="paper-card login-card mt-8 px-7 py-10">
        <BrandLockup />
        <p className="login-kicker">{SITE_TAGLINE}</p>
        {!ready ? (
          <p className="mono-readout mt-8 text-sm text-[var(--ink-dim)]">불러오는 중…</p>
        ) : error || !snapshot ? (
          <p className="alert-error mt-8">{error || "공유를 찾지 못했습니다."}</p>
        ) : (
          <>
            <h1 className="mt-4 text-3xl font-semibold tracking-tight">{share.title}</h1>
            <p className="mt-2 text-sm text-[var(--ink-dim)]">
              설정만 공유된 이야기입니다. 대화는 들어 있지 않습니다.
            </p>
            <div className="mt-6 flex items-center gap-4">
              <AvatarCircle
                src={snapshot.character.photo}
                name={snapshot.character.name}
                size="lg"
              />
              <div className="min-w-0">
                <p className="font-semibold">{snapshot.character.name}</p>
                {snapshot.character.oneLiner ? (
                  <p className="mt-1 text-sm text-[var(--ink-dim)]">
                    {snapshot.character.oneLiner}
                  </p>
                ) : null}
              </div>
            </div>
            {worldPreview ? (
              <p className="mt-5 text-sm leading-relaxed text-[var(--ink-soft)]">
                {worldPreview}
                {snapshot.worldSetting.trim().length > 280 ? "…" : ""}
              </p>
            ) : null}
            <div className="mt-8 flex flex-wrap gap-2">
              {auth.user ? (
                <button type="button" className="btn-primary" onClick={startStory}>
                  이 이야기로 시작
                </button>
              ) : (
                <button
                  type="button"
                  className="btn-primary"
                  onClick={auth.signInWithGoogle}
                  disabled={auth.busy || !auth.enabled}
                >
                  {auth.busy ? "연결 중…" : "Google로 시작하기"}
                </button>
              )}
              <button
                type="button"
                className="btn-secondary"
                onClick={() => setSharing(true)}
              >
                공유
              </button>
              <button type="button" className="btn-quiet" onClick={() => void copyLink()}>
                {copied ? "복사됨" : "링크 복사"}
              </button>
            </div>
            {auth.error ? <p className="alert-error mt-4">{auth.error}</p> : null}
            {sharing && share ? (
              <ShareSheet
                url={shareUrl(share.id)}
                title={`${share.title} · 이어롤`}
                text={snapshot.character.oneLiner.trim() || SITE_TAGLINE}
                onClose={() => setSharing(false)}
              />
            ) : null}
          </>
        )}
      </main>
    </PageShell>
  );
}
