import { SHORT_TERM_TURNS } from "./constants";
import type { PromptState } from "./types";

export function buildPinnedRules(state: PromptState) {
  const character = state.character.name.trim() || "캐릭터";
  const user = state.userPersona.name.trim() || "유저";

  return `[규칙]
너는 ${character}의 시점과 행동만 서술한다.
절대로 ${user}의 대사·감정·행동을 대신 쓰지 않는다.
나레이션은 반드시 (나레이션) ... 한 줄로 쓴다.
대사는 반드시 이름: 「대사」 형식만 쓴다.
다른 기호·OOC 설명은 금지한다.
짧게: 나레이션 1~3문장 + 대사 2~5줄. 소설처럼 길게 쓰지 않는다.`;
}

export function buildChatPrompt(state: PromptState, userText: string) {
  const recent = state.shortTermBuffer
    .slice(-SHORT_TERM_TURNS * 2)
    .map((message) =>
      message.role === "user"
        ? `유저: ${message.content}`
        : `모델: ${message.content}`,
    )
    .join("\n");

  const cast = state.castNotes
    .filter((note) => note.name.trim() || note.note.trim())
    .map((note) => `- ${note.name}: ${note.note}`)
    .join("\n");

  return [
    buildPinnedRules(state),
    "",
    "[세계관]",
    state.worldSetting.trim() || "(없음)",
    "",
    "[캐릭터 설정집]",
    `이름: ${state.character.name}`,
    `한 줄: ${state.character.oneLiner}`,
    `말투: ${state.character.speechStyle}`,
    `외형: ${state.character.appearance}`,
    `금지: ${state.character.forbidden}`,
    `시작 상황: ${state.character.openingSituation}`,
    "",
    "[유저 설정]",
    `이름: ${state.userPersona.name}`,
    state.userPersona.setting.trim() || "(없음)",
    "",
    "[등장인물 메모]",
    cast || "(없음)",
    "",
    "[스토리 요약]",
    state.storySummary.trim() || "(아직 없음)",
    "",
    "[최근 대화]",
    recent || "(없음)",
    "",
    "[유저 말]",
    userText,
  ].join("\n");
}

export function buildSummaryPrompt(state: PromptState) {
  const recent = state.shortTermBuffer
    .map((message) =>
      message.role === "user"
        ? `유저: ${message.content}`
        : `모델: ${message.content}`,
    )
    .join("\n");

  return `아래 기존 요약과 최근 대화만 보고, 스토리 진행 상황만 600자 안으로 요약하라.
세계관·캐릭터 말투·금지는 넣지 마라.
형식:
진행중:
결정된 것:
미결:

[기존 요약]
${state.storySummary.trim() || "(없음)"}

[최근 대화]
${recent || "(없음)"}`;
}
