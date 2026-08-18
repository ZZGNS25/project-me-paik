import type { SettingRecord } from "./types";

const EMPTY_TITLE = "이름 없음";

export function storyTitle(item: Pick<SettingRecord, "title" | "character">) {
  const title = item.title.trim();
  if (title && title !== EMPTY_TITLE) return title;
  return item.character.name.trim() || EMPTY_TITLE;
}
