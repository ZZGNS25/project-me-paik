import type { InlinePart, ParsedLine } from "./types";

const NARRATION = /^\(나레이션\)\s*(.*)$/;
const SPEECH = /^(.+?):\s*[「『"](.+?)[」』"]\s*$/;
const AT_NAME = /^@([^:\n]+):\s*(.*)$/;

export function splitItalics(text: string): InlinePart[] {
  const parts: InlinePart[] = [];
  const pattern = /\*([^*]+)\*/g;
  let last = 0;
  let match: RegExpExecArray | null;

  while ((match = pattern.exec(text))) {
    if (match.index > last) {
      parts.push({ text: text.slice(last, match.index) });
    }
    parts.push({ text: match[1], italic: true });
    last = match.index + match[0].length;
  }

  if (last < text.length) {
    parts.push({ text: text.slice(last) });
  }

  return parts.length > 0 ? parts : [{ text }];
}

export function parseModelReply(raw: string): ParsedLine[] {
  const lines = raw.split(/\r?\n/);
  const parsed: ParsedLine[] = [];
  let leftover: string[] = [];

  function flushLeftover() {
    const text = leftover.join("\n").trim();
    if (text) parsed.push({ kind: "fallback", text });
    leftover = [];
  }

  for (const rawLine of lines) {
    const line = rawLine.trim();
    if (!line) continue;

    if (line.startsWith("@:")) {
      flushLeftover();
      parsed.push({ kind: "narration", text: line.slice(2).trim() });
      continue;
    }

    const mention = line.match(AT_NAME);
    if (mention?.[1].trim()) {
      flushLeftover();
      parsed.push({
        kind: "speech",
        name: mention[1].trim(),
        text: mention[2].trim(),
      });
      continue;
    }

    const narration = line.match(NARRATION);
    if (narration) {
      flushLeftover();
      parsed.push({ kind: "narration", text: narration[1] || line });
      continue;
    }

    const speech = line.match(SPEECH);
    if (speech) {
      flushLeftover();
      parsed.push({
        kind: "speech",
        name: speech[1].trim(),
        text: speech[2].trim(),
      });
      continue;
    }

    leftover.push(rawLine);
  }

  flushLeftover();
  return mergeSpeech(parsed.length > 0 ? parsed : [{ kind: "fallback", text: raw.trim() }]);
}

function mergeSpeech(lines: ParsedLine[]): ParsedLine[] {
  const merged: ParsedLine[] = [];

  for (const line of lines) {
    const last = merged[merged.length - 1];
    if (line.kind === "speech" && last?.kind === "speech" && last.name === line.name) {
      last.text = `${last.text}\n${line.text}`;
      continue;
    }
    merged.push({ ...line });
  }

  return merged;
}
