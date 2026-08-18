"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { useOverlayLeave } from "@/hooks/useOverlayLeave";
import AvatarCircle from "@/components/AvatarCircle";
import CharField from "@/components/CharField";
import { FIELD_LIMITS } from "@/lib/constants";

export type PersonaDraft = {
  id: string;
  label: string;
  name: string;
  setting: string;
  photo: string;
};

type PersonaFormModalProps = {
  title: string;
  copy?: string;
  draft: PersonaDraft;
  saveLabel: string;
  canSave: boolean;
  onChange: (patch: Partial<PersonaDraft>) => void;
  onSave: () => void;
  onCancel: () => void;
};

export default function PersonaFormModal({
  title,
  copy,
  draft,
  saveLabel,
  canSave,
  onChange,
  onSave,
  onCancel,
}: PersonaFormModalProps) {
  const [mounted, setMounted] = useState(false);
  const { leaveClass, dismiss } = useOverlayLeave();

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

  return createPortal(
    <div
      className={`confirm-layer ${leaveClass}`}
      role="dialog"
      aria-modal="true"
      aria-label={title}
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) dismiss(onCancel);
      }}
    >
      <div className="confirm-card persona-form">
        <p className="confirm-heading">{title}</p>
        {copy ? <p className="confirm-copy">{copy}</p> : null}
        <div className="persona-form-body">
          <div className="flex items-start gap-4">
            <div>
              <p className="text-sm font-medium text-[var(--ink)]">사진</p>
              <div className="mt-2">
                <AvatarCircle
                  src={draft.photo}
                  name={draft.name || draft.label}
                  size="lg"
                  editable
                  onChange={(photo) => onChange({ photo })}
                />
              </div>
            </div>
            <div className="min-w-0 flex-1 space-y-4">
              <CharField
                label="목록 이름"
                value={draft.label}
                max={FIELD_LIMITS.personaLabel}
                onChange={(label) => onChange({ label })}
                placeholder="헌터 — 20세"
                hint="목록에 보이는 이름입니다. 예: 아카데미 학생 — 17세"
              />
              <CharField
                label="이야기에서 부를 이름"
                value={draft.name}
                max={FIELD_LIMITS.userName}
                onChange={(name) => onChange({ name })}
                placeholder="하준"
                required
              />
            </div>
          </div>
          <CharField
            label="나는 누구인지"
            multiline
            rows={6}
            value={draft.setting}
            max={FIELD_LIMITS.userSetting}
            onChange={(setting) => onChange({ setting })}
            placeholder="나이, 성격, 숨기는 것, 이 몸이 아는 것"
            hint="세계관은 적지 마세요. 내가 누구인지만 적습니다."
          />
        </div>
        <div className="confirm-actions is-split">
          <button type="button" className="btn-quiet" onClick={() => dismiss(onCancel)}>
            취소
          </button>
          <button
            type="button"
            className="btn-primary"
            disabled={!canSave}
            onClick={() => dismiss(onSave)}
          >
            {saveLabel}
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}
