import { NextResponse } from "next/server";
import {
  GEMINI_CONTINUE_OUTPUT_TOKENS,
  GEMINI_MAX_OUTPUT_TOKENS,
  GEMINI_SUMMARY_OUTPUT_TOKENS,
} from "@/lib/constants";
import { generateGeminiText, streamGeminiText } from "@/lib/gemini";
import {
  buildChatPrompt,
  buildContinuePrompt,
  buildRegenPrompt,
  buildSummaryPrompt,
} from "@/lib/prompt";
import { requireUser } from "@/lib/requireUser";
import type { GenerateMode, PromptState } from "@/lib/types";

export const maxDuration = 60;

const USER_TEXT_MAX = 2000;

const STREAM_HEADERS = {
  "Content-Type": "text/plain; charset=utf-8",
  "Cache-Control": "no-cache, no-transform",
  "X-Accel-Buffering": "no",
};

function isPromptState(value: unknown): value is PromptState {
  if (!value || typeof value !== "object") return false;
  const state = value as PromptState;
  return Boolean(state.character && state.userPersona && Array.isArray(state.shortTermBuffer));
}

export async function POST(request: Request) {
  const { user, error } = await requireUser(request);
  if (!user) {
    return NextResponse.json({ error }, { status: 401 });
  }

  try {
    const body = (await request.json()) as {
      mode?: GenerateMode;
      userText?: string;
      previous?: string;
      state?: unknown;
    };

    if (!isPromptState(body.state)) {
      return NextResponse.json({ error: "설정 정보가 없습니다." }, { status: 400 });
    }

    if (body.mode === "chat") {
      const userText = String(body.userText ?? "").trim().slice(0, USER_TEXT_MAX);
      if (!userText) {
        return NextResponse.json({ error: "메시지를 입력해 주세요." }, { status: 400 });
      }
      const stream = await streamGeminiText(
        buildChatPrompt(body.state, userText),
        GEMINI_MAX_OUTPUT_TOKENS,
        "minimal",
      );
      return new Response(stream, { headers: STREAM_HEADERS });
    }

    if (body.mode === "summary") {
      const text = await generateGeminiText(
        buildSummaryPrompt(body.state),
        GEMINI_SUMMARY_OUTPUT_TOKENS,
      );
      return NextResponse.json({ text });
    }

    if (body.mode === "regen") {
      const userText = String(body.userText ?? "").trim().slice(0, USER_TEXT_MAX);
      if (!userText) {
        return NextResponse.json({ error: "메시지를 입력해 주세요." }, { status: 400 });
      }
      const previous = String(body.previous ?? "").trim().slice(0, USER_TEXT_MAX);
      const stream = await streamGeminiText(
        buildRegenPrompt(body.state, userText, previous),
        GEMINI_MAX_OUTPUT_TOKENS,
        "minimal",
      );
      return new Response(stream, { headers: STREAM_HEADERS });
    }

    if (body.mode === "continue") {
      const hint = String(body.userText ?? "").trim().slice(0, USER_TEXT_MAX);
      const stream = await streamGeminiText(
        buildContinuePrompt(body.state, hint),
        GEMINI_CONTINUE_OUTPUT_TOKENS,
        "minimal",
      );
      return new Response(stream, { headers: STREAM_HEADERS });
    }

    return NextResponse.json({ error: "잘못된 요청입니다." }, { status: 400 });
  } catch (err) {
    const message = err instanceof Error ? err.message : "생성에 실패했습니다.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
