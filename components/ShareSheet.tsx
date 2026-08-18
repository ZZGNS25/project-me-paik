"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { useOverlayLeave } from "@/hooks/useOverlayLeave";
import {
  canShareToApps,
  copyText,
  shareDestinations,
  shareToApps,
} from "@/lib/share";
import { trackEvent } from "@/lib/analytics";

type ShareSheetProps = {
  url: string;
  title: string;
  text: string;
  onClose: () => void;
};

export default function ShareSheet({ url, title, text, onClose }: ShareSheetProps) {
  const [mounted, setMounted] = useState(false);
  const [copied, setCopied] = useState(false);
  const { leaveClass, dismiss } = useOverlayLeave();
  const nativeShare = canShareToApps();
  const destinations = shareDestinations(url, text);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") dismiss(onClose);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [dismiss, onClose]);

  async function copyLink() {
    await copyText(url);
    trackEvent("share_copy");
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1600);
  }

  async function sendToApps() {
    const result = await shareToApps({ title, text, url });
    if (result.status === "shared") {
      trackEvent("share_native");
      dismiss(onClose);
    }
  }

  if (!mounted) return null;

  return createPortal(
    <div
      className={`confirm-layer ${leaveClass}`}
      role="dialog"
      aria-modal="true"
      aria-label="공유"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) dismiss(onClose);
      }}
    >
      <div className="confirm-card share-sheet">
        <p className="label-caps">공유</p>
        <p className="confirm-copy">캐릭터와 세계관 링크입니다. 대화는 들어가지 않습니다.</p>
        <p className="share-url">{url}</p>
        <div className="share-grid">
          {nativeShare ? (
            <button type="button" className="share-item" onClick={() => void sendToApps()}>
              다른 앱
            </button>
          ) : null}
          <button type="button" className="share-item" onClick={() => void copyLink()}>
            {copied ? "복사됨" : "링크 복사"}
          </button>
          {destinations.map((item) => (
            <a
              key={item.id}
              className="share-item"
              href={item.href}
              target="_blank"
              rel="noreferrer"
              onClick={() => trackEvent("share_out", { dest: item.id })}
            >
              {item.label}
            </a>
          ))}
        </div>
        <div className="confirm-actions">
          <button type="button" className="btn-quiet" onClick={() => dismiss(onClose)}>
            닫기
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}
