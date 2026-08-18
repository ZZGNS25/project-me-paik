"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { useOverlayLeave } from "@/hooks/useOverlayLeave";
import AvatarCircle from "@/components/AvatarCircle";
import Icon from "@/components/Icon";
import PersonaList from "@/components/PersonaList";
import type { SavedPersona, UserPersona } from "@/lib/types";

type PersonaPickerProps = {
  personas: SavedPersona[];
  selectedId?: string | null;
  current?: UserPersona | null;
  copy?: string;
  skipLabel?: string;
  onPick: (id: string) => void;
  onEdit?: (id: string) => void;
  onEditCurrent?: () => void;
  onAdd?: () => void;
  onSkip?: () => void;
  onCancel: () => void;
};

export default function PersonaPicker({
  personas,
  selectedId,
  current,
  copy,
  skipLabel,
  onPick,
  onEdit,
  onEditCurrent,
  onAdd,
  onSkip,
  onCancel,
}: PersonaPickerProps) {
  const [mounted, setMounted] = useState(false);
  const { leaveClass, dismiss } = useOverlayLeave();
  const stacked = Boolean(current);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") dismiss(onCancel);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [dismiss, onCancel]);

  if (!mounted) return null;

  const nowName = current?.name.trim() || "나";
  const nowSetting = current?.setting.trim() || "";

  return createPortal(
    <div
      className={`confirm-layer ${stacked ? "is-sheet" : ""} ${leaveClass}`}
      role="dialog"
      aria-modal="true"
      aria-label="내 대화 프로필"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) dismiss(onCancel);
      }}
    >
      <div className={`confirm-card persona-picker ${stacked ? "is-stack" : ""}`}>
        <p className="label-caps">내 대화 프로필</p>
        {copy ? <p className="confirm-copy">{copy}</p> : null}
        <div className="persona-picker-list">
          <PersonaList
            personas={personas}
            activeId={stacked ? null : selectedId}
            onPick={(id) => dismiss(() => onPick(id))}
            onEdit={onEdit ? (id) => dismiss(() => onEdit(id)) : undefined}
            onAdd={onAdd ? () => dismiss(onAdd) : undefined}
          />
        </div>
        {current ? (
          <div className="persona-now">
            <p className="label-caps">지금</p>
            <div className="persona-item is-active">
              <span className="persona-face">
                <AvatarCircle src={current.photo} name={nowName} size="sm" />
                <span className="persona-check" aria-hidden="true">
                  ✓
                </span>
              </span>
              <button type="button" className="persona-pick" onClick={() => dismiss(onCancel)}>
                <span className="min-w-0">
                  <span className="block truncate font-medium">{nowName}</span>
                  {nowSetting ? <span className="persona-desc">{nowSetting}</span> : null}
                </span>
              </button>
              {onEditCurrent ? (
                <button
                  type="button"
                  className="persona-edit"
                  aria-label="지금 프로필 수정"
                  onClick={() => dismiss(onEditCurrent)}
                >
                  <Icon name="edit" size={16} />
                </button>
              ) : null}
            </div>
          </div>
        ) : null}
        <div className="confirm-actions">
          <button type="button" className="btn-quiet" onClick={() => dismiss(onCancel)}>
            닫기
          </button>
          {onSkip && skipLabel ? (
            <button type="button" className="btn-quiet" onClick={() => dismiss(onSkip)}>
              {skipLabel}
            </button>
          ) : null}
        </div>
      </div>
    </div>,
    document.body,
  );
}
