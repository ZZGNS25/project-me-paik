import { FIELD_LIMITS, SHORT_TERM_TURNS } from "./constants";
import { parseModelReply } from "./parseMessage";
import type { ChatMessage, StoryPin } from "./types";

function clip(value: string, max: number) {
  return value.slice(0, max);
}

export function recountTurns(log: ChatMessage[]) {
  return log.filter((message) => message.role === "user").length;
}

export function syncBuffer(log: ChatMessage[]) {
  return log.slice(-SHORT_TERM_TURNS * 2);
}

export function sanitizeSummary(raw: string) {
  const banned = /^(말투|금지|세계관|외형|캐릭터|프롤로그|speech|forbidden)\s*[:：]/i;
  const lines = raw
    .split(/\r?\n/)
    .map((line) => line.trimEnd())
    .filter((line) => !banned.test(line.trim()));
  return clip(lines.join("\n").trim(), FIELD_LIMITS.storySummary);
}

export function normalizePins(value: unknown): StoryPin[] {
  if (!Array.isArray(value)) return [];

  const pins: StoryPin[] = [];
  for (const item of value) {
    if (pins.length >= FIELD_LIMITS.storyPinsMax) break;
    if (typeof item === "string" && item.trim()) {
      pins.push({
        id: crypto.randomUUID(),
        text: clip(item.trim(), FIELD_LIMITS.storyPin),
      });
      continue;
    }
    if (!item || typeof item !== "object") continue;
    const text = String("text" in item ? item.text : "").trim();
    if (!text) continue;
    pins.push({
      id:
        "id" in item && typeof item.id === "string" && item.id
          ? item.id
          : crypto.randomUUID(),
      text: clip(text, FIELD_LIMITS.storyPin),
    });
  }
  return pins;
}

export function pinTextFromTurn(user: ChatMessage, model?: ChatMessage) {
  const source = model?.content || user.content;
  const narration = parseModelReply(source).find((line) => line.kind === "narration");
  const raw = (narration?.text || source)
    .replace(/@[^:\n]+:/g, "")
    .replace(/@:/g, "")
    .replace(/\*/g, "")
    .replace(/\s+/g, " ")
    .trim();
  return clip(raw, FIELD_LIMITS.storyPin);
}
