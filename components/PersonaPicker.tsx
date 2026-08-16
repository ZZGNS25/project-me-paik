"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import PersonaList from "@/components/PersonaList";
import type { SavedPersona } from "@/lib/types";

type PersonaPickerProps = {
  personas: SavedPersona[];
  selectedId?: string | null;
  copy?: string;
  skipLabel?: string;
  manageLabel?: string;
  onPick: (id: string) => void;
  onSkip?: () => void;
  onManage?: () => void;
  onCancel: () => void;
};

export default function PersonaPicker({
  personas,
  selectedId,
  copy = "이 이야기에서 나는 누구인가요?",
  skipLabel,
  manageLabel = "프로필 목록",
  onPick,
  onSkip,
  onManage,
  onCancel,
}: PersonaPickerProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") onCancel();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onCancel]);

  if (!mounted) return null;

  return createPortal(
    <div
      className="confirm-layer"
      role="dialog"
      aria-modal="true"
      aria-label="유저 프로필 고르기"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onCancel();
      }}
    >
      <div className="confirm-card persona-picker">
        <p className="label-caps">나</p>
        <p className="confirm-copy">{copy}</p>
        <div className="mt-4">
          <PersonaList
            personas={personas}
            activeId={selectedId}
            onPick={onPick}
          />
        </div>
        <div className="confirm-actions">
          <button type="button" className="btn-quiet" onClick={onCancel}>
            취소
          </button>
          {onManage ? (
            <button type="button" className="btn-quiet" onClick={onManage}>
              {personas.length === 0 ? "프로필 만들기" : manageLabel}
            </button>
          ) : null}
          {onSkip && skipLabel ? (
            <button type="button" className="btn-quiet" onClick={onSkip}>
              {skipLabel}
            </button>
          ) : null}
        </div>
      </div>
    </div>,
    document.body,
  );
}
