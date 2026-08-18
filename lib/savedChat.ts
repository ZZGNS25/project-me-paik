import { previewText } from "./parseMessage";
import type { SettingRecord } from "./types";

export const SAVED_CHATS_MAX = 100;

function pad(value: number) {
  return String(value).padStart(2, "0");
}

export function defaultSavedChatTitle(at = new Date()) {
  return `${at.getFullYear()}-${pad(at.getMonth() + 1)}-${pad(at.getDate())} ${pad(at.getHours())}:${pad(at.getMinutes())}에 저장된 대화`;
}

export function continueStamp(iso: string) {
  const at = new Date(iso);
  if (Number.isNaN(at.getTime())) return "";
  return `${String(at.getFullYear()).slice(-2)}/${pad(at.getMonth() + 1)}/${pad(at.getDate())}`;
}

export function continuePreview(item: SettingRecord, max = 42) {
  const last = [...item.chatLog].reverse().find((message) => message.content.trim());
  if (!last) return "아직 대화가 없습니다.";
  return previewText(last.content, max);
}
