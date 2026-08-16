"use client";

import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { usePlay } from "@/hooks/PlayProvider";
import { copyText, shareUrl, upsertShare } from "@/lib/share";
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
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState("");
  const current = play.settings.find((item) => item.id === play.currentSettingId);
  const canShare = Boolean(auth.user && current?.character.name.trim());

  async function share() {
    if (!auth.user || !current) return;
    setBusy(true);
    setError("");
    try {
      const id = await upsertShare(auth.user.id, current);
      play.setShareId(id);
      await copyText(shareUrl(id));
      trackEvent("share", { character: current.character.name });
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "공유하지 못했습니다.");
    } finally {
      setBusy(false);
    }
  }

  const label = busy ? "만드는 중…" : copied ? "복사됨" : "공유";

  if (align === "row") {
    return (
      <>
        <button
          type="button"
          className="sheet-row"
          disabled={!canShare || busy}
          onClick={() => void share()}
        >
          <span>
            <span className="sheet-row-title">공유</span>
            <span className="sheet-row-hint">캐릭터와 세계관 링크. 대화는 빠집니다.</span>
          </span>
          <span className="sheet-row-value">
            {busy ? "만드는 중…" : copied ? "복사됨" : ""}
          </span>
        </button>
        {error ? <p className="sheet-row-error">{error}</p> : null}
      </>
    );
  }

  return (
    <span className="inline-flex flex-col items-end">
      <button
        type="button"
        className={className}
        disabled={!canShare || busy}
        title={canShare ? "설정 링크를 복사합니다. 대화는 들어가지 않습니다." : "로그인과 캐릭터 이름이 필요합니다."}
        onClick={() => void share()}
      >
        {label}
      </button>
      {error ? <span className="mt-1 text-xs text-[var(--danger)]">{error}</span> : null}
    </span>
  );
}
