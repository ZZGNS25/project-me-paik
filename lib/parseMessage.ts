import type { ParsedLine } from "./types";

const NARRATION = /^\(나레이션\)\s*(.*)$/;
const SPEECH = /^(.+?):\s*[「『"](.+?)[」』"]\s*$/;

export function parseModelReply(raw: string): ParsedLine[] {
  const lines = raw
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  const parsed: ParsedLine[] = [];
  let matched = false;

  for (const line of lines) {
    const narration = line.match(NARRATION);
    if (narration) {
      parsed.push({ kind: "narration", text: narration[1] || line });
      matched = true;
      continue;
    }

    const speech = line.match(SPEECH);
    if (speech) {
      parsed.push({
        kind: "speech",
        name: speech[1].trim(),
        text: speech[2].trim(),
      });
      matched = true;
      continue;
    }
  }

  if (!matched) {
    return [{ kind: "fallback", text: raw.trim() }];
  }

  return parsed;
}
