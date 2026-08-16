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

export async function requestGenerate(
  mode: "chat" | "summary",
  state: PlayState | PromptState,
  userText?: string,
) {
  const { data } = await getSupabase().auth.getSession();
  const token = data.session?.access_token;
  if (!token) {
    throw new Error("로그인이 필요합니다.");
  }

  const response = await fetch("/api/generate", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ mode, state: toPromptState(state), userText }),
  });

  const payload = (await response.json()) as { text?: string; error?: string };
  if (!response.ok || !payload.text) {
    throw new Error(payload.error || "생성에 실패했습니다.");
  }

  return payload.text;
}
