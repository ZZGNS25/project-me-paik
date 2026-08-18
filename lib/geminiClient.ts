import { STREAM_CHARS_PER_SEC } from "./constants";
import { getSupabase } from "./supabase";
import type { GenerateMode, PlayState, PromptState } from "./types";

function toPromptState(state: PlayState | PromptState): PromptState {
  return {
    character: { ...state.character, photo: "" },
    userPersona: { ...state.userPersona, photo: "" },
    worldSetting: state.worldSetting,
    prologue: "prologue" in state ? state.prologue : "",
    storySummary: state.storySummary,
    storyPins: "storyPins" in state ? state.storyPins : [],
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
  if (chunk === full || full.endsWith(chunk)) return full;
  if (chunk.startsWith(full)) return chunk;
  return full + chunk;
}

function waitPaint() {
  return new Promise<void>((resolve) => {
    requestAnimationFrame(() => {
      requestAnimationFrame(() => resolve());
    });
  });
}

export class GenerateStoppedError extends Error {
  constructor(public readonly partial: string) {
    super("stopped");
    this.name = "GenerateStoppedError";
  }
}

export function isAbortError(err: unknown) {
  return (
    (err instanceof DOMException && err.name === "AbortError") ||
    (err instanceof Error && err.name === "AbortError")
  );
}

export async function requestGenerate(
  mode: Extract<GenerateMode, "chat" | "summary" | "continue">,
  state: PlayState | PromptState,
  userText?: string,
  signal?: AbortSignal,
) {
  const response = await fetch("/api/generate", {
    method: "POST",
    headers: await authHeaders(),
    body: JSON.stringify({ mode, state: toPromptState(state), userText }),
    signal,
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
  signal?: AbortSignal,
  mode: Extract<GenerateMode, "chat" | "continue" | "regen"> = "chat",
  previous = "",
) {
  let response: Response;
  try {
    const headers = await authHeaders();
    if (signal?.aborted) {
      throw new GenerateStoppedError("");
    }
    response = await fetch("/api/generate", {
      method: "POST",
      headers,
      body: JSON.stringify({
        mode,
        state: toPromptState(state),
        userText,
        previous: previous || undefined,
      }),
      signal,
    });
  } catch (err) {
    if (err instanceof GenerateStoppedError) throw err;
    if (signal?.aborted || isAbortError(err)) {
      throw new GenerateStoppedError("");
    }
    throw err;
  }

  const type = response.headers.get("content-type") ?? "";
  if (!response.ok || !type.includes("text/plain") || !response.body) {
    const payload = (await response.json().catch(() => null)) as
      | { error?: string }
      | null;
    throw new Error(payload?.error || "생성에 실패했습니다.");
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let received = "";
  let shown = "";
  let raf = 0;
  let lastTs = 0;
  let networkDone = false;
  let settle: (() => void) | null = null;
  const caughtUp = new Promise<void>((resolve) => {
    settle = resolve;
  });

  const reveal = (receivedText: string, dt: number) => {
    if (shown.length >= receivedText.length) return receivedText;
    const step = Math.min(
      2,
      Math.max(1, Math.round((STREAM_CHARS_PER_SEC * dt) / 1000)),
    );
    return receivedText.slice(0, shown.length + step);
  };

  const finishIfCaughtUp = () => {
    if (networkDone && shown.length >= received.length) {
      settle?.();
      settle = null;
    }
  };

  const tick = (ts: number) => {
    raf = 0;
    if (signal?.aborted) {
      finishIfCaughtUp();
      return;
    }
    const dt = lastTs ? Math.min(ts - lastTs, 40) : 16;
    lastTs = ts;
    const next = reveal(received, dt);
    if (next !== shown) {
      shown = next;
      onUpdate(shown);
    }
    if (shown.length < received.length || !networkDone) {
      raf = requestAnimationFrame(tick);
    } else {
      finishIfCaughtUp();
    }
  };

  const kick = () => {
    if (!raf && (shown.length < received.length || !networkDone)) {
      raf = requestAnimationFrame(tick);
    }
  };

  const onAbort = () => {
    void reader.cancel();
    if (raf) cancelAnimationFrame(raf);
    raf = 0;
    settle?.();
    settle = null;
  };
  signal?.addEventListener("abort", onAbort, { once: true });

  try {
    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      const chunk = decoder.decode(value, { stream: true });
      received = applyChunk(received, chunk);
      kick();
    }
    received = applyChunk(received, decoder.decode());
    networkDone = true;
    if (shown.length >= received.length) {
      if (shown) onUpdate(shown);
      finishIfCaughtUp();
    } else {
      kick();
    }
    await caughtUp;
    if (!signal?.aborted) await waitPaint();
  } catch (err) {
    if (raf) cancelAnimationFrame(raf);
    raf = 0;
    if (signal?.aborted || isAbortError(err)) {
      throw new GenerateStoppedError(shown.trim() || received.trim());
    }
    throw err;
  } finally {
    signal?.removeEventListener("abort", onAbort);
    if (raf) cancelAnimationFrame(raf);
  }

  if (signal?.aborted) {
    throw new GenerateStoppedError(shown.trim() || received.trim());
  }

  const text = (shown || received).trim();
  if (!text) {
    throw new Error("Gemini 응답이 비어 있습니다. 잠시 후 다시 시도해 주세요.");
  }
  return text;
}
