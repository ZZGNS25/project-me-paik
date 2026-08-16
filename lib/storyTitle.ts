import type { SettingRecord } from "./types";

export function storyTitle(item: Pick<SettingRecord, "title" | "character">) {
  return item.title.trim() || item.character.name.trim() || "이름 없음";
}
