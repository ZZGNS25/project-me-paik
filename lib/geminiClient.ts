import { getSupabase } from "./supabase";
import type { PlayState, PromptState } from "./types";

function toPromptState(state: PlayState | PromptState): PromptState {
  return {
    character: { ...state.character, photo: "" },
    userPersona: { ...state.userPersona, photo: "" },
    worldSetting: state.worldSetting,
    prologue: "prologue" in state ? state.prologue : "",
    storySummary: state.storySummary,
    castNotes: state.castNotes,
    shortTermBuffer: state.shortTermBuffer,
  };
}

async function authHeaders() {
  const { data } = await getSupabase().auth.getSession();
  const token = data.session?.access_token;
  if (!token) {
    throw new Error("로그인이 필요합니다.");
  }
  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
  };
}

function applyChunk(full: string, chunk: string) {
  if (!chunk) return full;
  if (!full) return chunk;
  if (chunk.startsWith(full)) return chunk;
  if (full.endsWith(chunk)) return full;
  return full + chunk;
}

export async function requestGenerate(
  mode: "chat" | "summary",
  state: PlayState | PromptState,
  userText?: string,
) {
  const response = await fetch("/api/generate", {
    method: "POST",
    headers: await authHeaders(),
    body: JSON.stringify({ mode, state: toPromptState(state), userText }),
  });

  const type = response.headers.get("content-type") ?? "";
  if (type.includes("text/plain") && response.body) {
    const text = (await response.text()).trim();
    if (!response.ok || !text) {
      throw new Error("생성에 실패했습니다.");
    }
    return text;
  }

  const payload = (await response.json()) as { text?: string; error?: string };
  if (!response.ok || !payload.text) {
    throw new Error(payload.error || "생성에 실패했습니다.");
  }

  return payload.text;
}

export async function requestGenerateStream(
  state: PlayState | PromptState,
  userText: string,
  onUpdate: (text: string) => void,
) {
  const response = await fetch("/api/generate", {
    method: "POST",
    headers: await authHeaders(),
    body: JSON.stringify({
      mode: "chat",
      state: toPromptState(state),
      userText,
    }),
  });

  const type = response.headers.get("content-type") ?? "";
  if (!response.ok || !type.includes("text/plain") || !response.body) {
    const payload = (await response.json().catch(() => null)) as
      | { error?: string }
      | null;
    throw new Error(payload?.error || "생성에 실패했습니다.");
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let full = "";

  while (true) {
    const { value, done } = await reader.read();
    if (done) break;
    const chunk = decoder.decode(value, { stream: true });
    full = applyChunk(full, chunk);
    onUpdate(full);
  }

  const text = full.trim();
  if (!text) {
    throw new Error("Gemini 응답이 비어 있습니다. 잠시 후 다시 시도해 주세요.");
  }
  return text;
}
