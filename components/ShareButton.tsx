"use client";

import { useState } from "react";
import ShareSheet from "@/components/ShareSheet";
import { useAuth } from "@/hooks/useAuth";
import { usePlay } from "@/hooks/PlayProvider";
import { shareUrl, upsertShare } from "@/lib/share";
import { SITE_TAGLINE } from "@/lib/site";
import { trackEvent } from "@/lib/analytics";

export default function ShareButton({
  className = "btn-quiet",
  align = "button",
}: {
  className?: string;
  align?: "button" | "row";
}) {
  const auth = useAuth();
  const play = usePlay();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [payload, setPayload] = useState<{
    url: string;
    title: string;
    text: string;
  } | null>(null);
  const current = play.settings.find((item) => item.id === play.currentSettingId);
  const canShare = Boolean(
    auth.user && !auth.isGuest && current?.character.name.trim(),
  );

  async function openShare() {
    if (!auth.user || !current) return;
    setBusy(true);
    setError("");
    try {
      const id = await upsertShare(auth.user.id, current);
      play.setShareId(id);
      const url = shareUrl(id);
      const title = current.character.name.trim() || "이어롤";
      trackEvent("share", { character: title });
      setPayload({
        url,
        title: `${title} · 이어롤`,
        text: current.character.oneLiner.trim() || SITE_TAGLINE,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "공유하지 못했습니다.");
    } finally {
      setBusy(false);
    }
  }

  const label = busy ? "만드는 중…" : "공유";

  return (
    <>
      {align === "row" ? (
        <>
          <button
            type="button"
            className="sheet-row"
            disabled={!canShare || busy}
            onClick={() => void openShare()}
          >
            <span>
              <span className="sheet-row-title">공유</span>
              <span className="sheet-row-hint">캐릭터와 세계관 링크. 대화는 빠집니다.</span>
            </span>
            <span className="sheet-row-value">{busy ? "만드는 중…" : ""}</span>
          </button>
          {error ? <p className="sheet-row-error">{error}</p> : null}
        </>
      ) : (
        <span className="inline-flex flex-col items-end">
          <button
            type="button"
            className={className}
            disabled={!canShare || busy}
            title={
              canShare
                ? "설정 링크를 보냅니다. 대화는 들어가지 않습니다."
                : auth.isGuest
                  ? "Guest는 공유할 수 없습니다. 브라우저를 닫으면 기록이 사라집니다."
                  : "로그인과 캐릭터 이름이 필요합니다."
            }
            onClick={() => void openShare()}
          >
            {label}
          </button>
          {error ? <span className="mt-1 text-xs text-[var(--danger)]">{error}</span> : null}
        </span>
      )}
      {payload ? (
        <ShareSheet
          url={payload.url}
          title={payload.title}
          text={payload.text}
          onClose={() => setPayload(null)}
        />
      ) : null}
    </>
  );
}
