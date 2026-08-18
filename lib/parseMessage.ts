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

const USER_SPEAKERS = new Set(["나", "유저", "me", "user"]);

export function isUserSpeaker(name: string | undefined, userName?: string) {
  const speaker = name?.trim() ?? "";
  if (!speaker) return true;
  if (USER_SPEAKERS.has(speaker.toLowerCase())) return true;
  const me = userName?.trim() ?? "";
  return Boolean(me) && speaker === me;
}

export function parseModelReply(raw: string, streaming = false): ParsedLine[] {
  if (streaming && raw && !/\n$/.test(raw)) {
    const parts = raw.split(/\r?\n/);
    const tail = parts.pop() ?? "";
    const head = parts.join("\n");
    const parsed = head ? parseModelReply(head, false) : [];
    return appendStreamingLine(parsed, tail);
  }

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
      pushNarration(parsed, line.slice(2).trim());
      continue;
    }

    const mention = line.match(AT_NAME);
    if (mention?.[1].trim()) {
      flushLeftover();
      parsed.push({
        kind: "speech",
        name: mention[1].trim(),
        text: unwrapSpeech(mention[2]),
      });
      continue;
    }

    const narration = line.match(NARRATION);
    if (narration) {
      flushLeftover();
      pushNarration(parsed, narration[1] || line);
      continue;
    }

    const speech = line.match(SPEECH);
    if (speech) {
      flushLeftover();
      parsed.push({
        kind: "speech",
        name: speech[1].trim(),
        text: unwrapSpeech(speech[2]),
      });
      continue;
    }

    const last = parsed[parsed.length - 1];
    if (last?.kind === "narration") {
      pushNarration(parsed, line);
      continue;
    }

    leftover.push(rawLine);
  }

  flushLeftover();
  return mergeRuns(parsed.length > 0 ? parsed : [{ kind: "fallback", text: raw.trim() }]);
}

function appendStreamingLine(parsed: ParsedLine[], tail: string): ParsedLine[] {
  if (!tail) return parsed;
  const next = parsed.map((line) => ({ ...line }));
  const line = tail.trimStart();

  if (line.startsWith("@:")) {
    pushNarration(next, line.slice(2));
    return next.length > 0 ? next : [{ kind: "fallback", text: tail }];
  }

  const mention = line.match(AT_NAME);
  if (mention?.[1].trim()) {
    const name = mention[1].trim();
    const text = unwrapSpeech(mention[2]);
    const last = next[next.length - 1];
    if (last?.kind === "speech" && last.name === name) {
      last.text = text ? `${last.text}\n${text}` : last.text;
      return next;
    }
    next.push({ kind: "speech", name, text });
    return next;
  }

  if (line.startsWith("@")) {
    next.push({ kind: "fallback", text: tail });
    return next;
  }

  const last = next[next.length - 1];
  if (last?.kind === "narration") {
    pushNarration(next, line);
    return next;
  }
  if (last?.kind === "fallback") {
    last.text = `${last.text}\n${tail}`;
    return next;
  }
  next.push({ kind: "fallback", text: tail });
  return next;
}

function pushNarration(parsed: ParsedLine[], text: string) {
  const next = text.trim();
  if (!next) return;
  const last = parsed[parsed.length - 1];
  if (last?.kind === "narration") {
    last.text = joinProse(last.text, next);
    return;
  }
  parsed.push({ kind: "narration", text: next });
}

function joinProse(left: string, right: string) {
  const a = left.trim();
  const b = right.trim();
  if (!a) return b;
  if (!b) return a;
  return /\s$/.test(a) ? `${a}${b}` : `${a} ${b}`;
}

function unwrapSpeech(text: string) {
  const trimmed = text.trim();
  const wrapped = trimmed.match(/^\*([^*]+)\*$/);
  return wrapped ? wrapped[1].trim() : trimmed;
}

export function previewText(raw: string, max = 92) {
  const parsed = parseModelReply(raw);
  const line = [...parsed].reverse().find((item) => item.text.trim());
  const text = !line
    ? raw
    : line.kind === "speech"
      ? `${line.name}  ${line.text}`
      : line.text;
  return text
    .replace(/@[^:\n]+:/g, "")
    .replace(/\*/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, max);
}

function mergeRuns(lines: ParsedLine[]): ParsedLine[] {
  const merged: ParsedLine[] = [];

  for (const line of lines) {
    const last = merged[merged.length - 1];
    if (line.kind === "narration" && last?.kind === "narration") {
      last.text = joinProse(last.text, line.text);
      continue;
    }
    if (line.kind === "speech" && last?.kind === "speech" && last.name === line.name) {
      last.text = `${last.text}\n${line.text}`;
      continue;
    }
    merged.push({ ...line });
  }

  return merged;
}
