"use client";

import AvatarCircle from "@/components/AvatarCircle";
import { PERSONAS_MAX } from "@/lib/constants";
import { personaTitle } from "@/lib/persona";
import type { SavedPersona } from "@/lib/types";

type PersonaListProps = {
  personas: SavedPersona[];
  activeId?: string | null;
  onPick: (id: string) => void;
  onRemove?: (id: string) => void;
};

export default function PersonaList({
  personas,
  activeId,
  onPick,
  onRemove,
}: PersonaListProps) {
  if (personas.length === 0) {
    return (
      <p className="text-sm text-[var(--ink-dim)]">
        아직 만든 프로필이 없습니다. 이야기와 따로, 내가 누구인지만 먼저 적어 두세요.
      </p>
    );
  }

  return (
    <ul className="persona-list">
      {personas.map((persona) => {
        const active = persona.id === activeId;
        return (
          <li key={persona.id} className={`persona-item ${active ? "is-active" : ""}`}>
            <button type="button" className="persona-pick" onClick={() => onPick(persona.id)}>
              <AvatarCircle
                src={persona.photo}
                name={persona.name || persona.label}
                size="sm"
              />
              <span className="min-w-0">
                <span className="block truncate font-medium">{personaTitle(persona)}</span>
                <span className="mt-0.5 block truncate text-xs text-[var(--ink-dim)]">
                  {persona.name}
                  {persona.setting ? ` · ${persona.setting}` : ""}
                </span>
              </span>
            </button>
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
