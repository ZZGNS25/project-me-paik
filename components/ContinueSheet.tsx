"use client";

import { useEffect } from "react";
import { createPortal } from "react-dom";
import ProfileCard from "@/components/ProfileCard";
import { storyTitle } from "@/lib/storyTitle";
import type { SettingRecord } from "@/lib/types";

type ContinueSheetProps = {
  stories: SettingRecord[];
  currentId?: string | null;
  onPick: (id: string) => void;
  onClose: () => void;
};

export default function ContinueSheet({
  stories,
  currentId,
  onPick,
  onClose,
}: ContinueSheetProps) {
  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  if (typeof document === "undefined") return null;

  return createPortal(
    <div
      className="confirm-layer"
      role="dialog"
      aria-modal="true"
      aria-label="이어하기"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div className="confirm-card persona-picker">
        <p className="label-caps">이어하기</p>
        <p className="confirm-copy">남긴 대화를 골라 그 장면부터 잇습니다.</p>
        {stories.length === 0 ? (
          <p className="mt-4 text-sm text-[var(--ink-dim)]">아직 남긴 대화가 없습니다.</p>
        ) : (
          <ul className="mt-4 space-y-2">
            {stories.map((item) => (
              <li key={item.id}>
                <button
                  type="button"
                  className={`continue-pick ${item.id === currentId ? "is-active" : ""}`}
                  onClick={() => onPick(item.id)}
                >
                  <ProfileCard
                    name={storyTitle(item)}
                    oneLiner={item.character.oneLiner}
                    photo={item.character.photo}
                    meta={`${item.turnCount}턴`}
                  />
                </button>
              </li>
            ))}
          </ul>
        )}
        <div className="confirm-actions">
          <button type="button" className="btn-quiet" onClick={onClose}>
            닫기
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}
