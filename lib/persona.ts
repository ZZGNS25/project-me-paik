import type { SavedPersona, UserPersona } from "./types";

export const STORY_PERSONA_EDIT = "now";

export function personaTitle(persona: Pick<SavedPersona, "label" | "name">) {
  return persona.label.trim() || persona.name.trim() || "이름 없음";
}

export function userFromPersona(persona: SavedPersona): UserPersona {
  return {
    name: persona.name,
    setting: persona.setting,
    photo: persona.photo,
  };
}
