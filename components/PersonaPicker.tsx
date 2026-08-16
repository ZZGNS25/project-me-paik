"use client";

import PersonaList from "@/components/PersonaList";
import type { SavedPersona } from "@/lib/types";

type PersonaPickerProps = {
  personas: SavedPersona[];
  selectedId?: string | null;
  copy?: string;
  skipLabel?: string;
  onPick: (id: string) => void;
  onSkip?: () => void;
  onCancel: () => void;
};

export default function PersonaPicker({
  personas,
  selectedId,
  copy = "이 이야기에서 나는 누구인가요?",
  skipLabel,
  onPick,
  onSkip,
  onCancel,
}: PersonaPickerProps) {
  return (
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
        <p className="label-caps">유저 프로필</p>
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
          {onSkip && skipLabel ? (
            <button type="button" className="btn-quiet" onClick={onSkip}>
              {skipLabel}
            </button>
          ) : null}
        </div>
      </div>
    </div>
  );
}
