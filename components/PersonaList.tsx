"use client";

import AvatarCircle from "@/components/AvatarCircle";
import { PERSONAS_MAX } from "@/lib/constants";
import { personaTitle } from "@/lib/persona";
import type { SavedPersona } from "@/lib/types";

type PersonaListProps = {
  personas: SavedPersona[];
  activeId?: string | null;
  onPick: (id: string) => void;
  onEdit?: (id: string) => void;
  onAdd?: () => void;
  onRemove?: (id: string) => void;
};

export default function PersonaList({
  personas,
  activeId,
  onPick,
  onEdit,
  onAdd,
  onRemove,
}: PersonaListProps) {
  return (
    <ul className="persona-list">
      {onAdd ? (
        <li>
          <button type="button" className="persona-add" onClick={onAdd}>
            <span className="avatar-circle avatar-sm">+</span>
            <span>대화 프로필 추가</span>
          </button>
        </li>
      ) : null}
      {personas.length === 0 && !onAdd ? (
        <li className="text-sm text-[var(--ink-dim)]">
          아직 만든 프로필이 없습니다. 이야기와 따로, 내가 누구인지만 먼저 적어 두세요.
        </li>
      ) : null}
      {personas.map((persona) => {
        const active = persona.id === activeId;
        return (
          <li key={persona.id} className={`persona-item ${active ? "is-active" : ""}`}>
            <span className="persona-face">
              <AvatarCircle
                src={persona.photo}
                name={persona.name || persona.label}
                size="sm"
              />
              {active ? (
                <span className="persona-check" aria-hidden="true">
                  ✓
                </span>
              ) : null}
            </span>
            <button type="button" className="persona-pick" onClick={() => onPick(persona.id)}>
              <span className="min-w-0">
                <span className="block truncate font-medium">{personaTitle(persona)}</span>
                <span className="persona-desc">
                  {persona.setting.trim() || persona.name}
                </span>
              </span>
            </button>
            {onEdit ? (
              <button
                type="button"
                className="persona-edit"
                aria-label="프로필 수정"
                onClick={() => onEdit(persona.id)}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                  <path
                    d="M4 20h4.2L19 9.2a1.5 1.5 0 0 0 0-2.1L16.9 5a1.5 1.5 0 0 0-2.1 0L5 14.8V20Z"
                    stroke="currentColor"
                    strokeWidth="1.7"
                    strokeLinejoin="round"
                  />
                  <path
                    d="M13.5 6.5 17.5 10.5"
                    stroke="currentColor"
                    strokeWidth="1.7"
                    strokeLinecap="round"
                  />
                </svg>
              </button>
            ) : null}
            {onRemove ? (
              <button
                type="button"
                className="btn-danger"
                onClick={() => onRemove(persona.id)}
              >
                삭제
              </button>
            ) : null}
          </li>
        );
      })}
      {personas.length >= PERSONAS_MAX ? (
        <li className="text-xs text-[var(--ink-dim)]">프로필은 {PERSONAS_MAX}개까지입니다.</li>
      ) : null}
    </ul>
  );
}
