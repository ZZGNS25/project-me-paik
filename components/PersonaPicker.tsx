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
  onPick: (id: string) => void;
  onEdit?: (id: string) => void;
  onAdd?: () => void;
  onSkip?: () => void;
  onCancel: () => void;
};

export default function PersonaPicker({
  personas,
  selectedId,
  copy,
  skipLabel,
  onPick,
  onEdit,
  onAdd,
  onSkip,
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
      aria-label="내 대화 프로필"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onCancel();
      }}
    >
      <div className="confirm-card persona-picker">
        <p className="label-caps">내 대화 프로필</p>
        {copy ? <p className="confirm-copy">{copy}</p> : null}
        <div className="mt-4">
          <PersonaList
            personas={personas}
            activeId={selectedId}
            onPick={onPick}
            onEdit={onEdit}
            onAdd={onAdd}
          />
        </div>
        <div className="confirm-actions">
          <button type="button" className="btn-quiet" onClick={onCancel}>
            닫기
          </button>
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
