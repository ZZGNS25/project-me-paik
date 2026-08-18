import { FIELD_LIMITS, SHORT_TERM_TURNS } from "./constants";
import type { PromptState } from "./types";

function clip(value: string, max: number) {
  const text = value.trim();
  if (text.length <= max) return text;
  return `${text.slice(0, max).trim()}…`;
}

function resolvePromptNames(state: PromptState) {
  return {
    character: state.character.name.trim() || "캐릭터",
    user: state.userPersona.name.trim() || "유저",
  };
}

function formatRecentDialogue(state: PromptState) {
  return state.shortTermBuffer
    .slice(-SHORT_TERM_TURNS * 2)
    .map((message) =>
      message.role === "user"
        ? `입력:\n${message.content}`
        : `응답:\n${message.content}`,
    )
    .join("\n\n");
}

function joinPromptBlocks(blocks: string[]) {
  return blocks.filter((line) => line !== "").join("\n");
}

export function buildPinnedRules(state: PromptState) {
  const { character, user } = resolvePromptNames(state);

  return `[규칙]
너는 ${character}의 시점과 행동만 서술한다.
${user}의 대사·감정·행동을 대신 쓰지 마라.
유저 @: 는 나레이션. @이름: 은 그 인물 대사. @${character}: 는 이미 한 말.
@${user}: 또는 이름 없는 말만 ${user} 대사. *행동*은 행동·속마음.
한 턴은 공백 포함 500자 이상 600자 이하. 500자보다 짧거나 600자를 넘기지 마라.
나레이션: @: 단락 하나, 3~5문장, 차갑고 건조한 반말. 한 문장씩 끊지 마라.
대사: @이름: 1~2번, 한두 문장. 말투를 따른다.
합니다·습니다·안내문·OOC 금지.`;
}

export function buildChatPrompt(state: PromptState, userText: string) {
  const started = state.shortTermBuffer.length > 0;
  const recent = formatRecentDialogue(state);

  const cast = state.castNotes
    .filter((note) => note.name.trim() || note.note.trim())
    .map((note) =>
      `- ${note.name}: ${note.note.slice(0, started ? 80 : FIELD_LIMITS.castNote)}`,
    )
    .join("\n");

  return joinPromptBlocks([
    buildPinnedRules(state),
    "",
    "[세계관]",
    clip(state.worldSetting, started ? 900 : 1400) || "(없음)",
    "",
    "[프롤로그]",
    started
      ? "이미 지난 일이다. 처음부터 다시 쓰지 말고 최근 대화 직후부터 이어라."
      : state.prologue.trim()
        ? `${clip(state.prologue, 800)}\n(프롤로그는 이미 지난 일이다. 처음부터 다시 쓰지 말고 그 직후부터 이어라.)`
        : "(없음)",
    "",
    "[캐릭터]",
    `이름: ${state.character.name}`,
    state.character.oneLiner.trim() ? `한 줄: ${state.character.oneLiner}` : "",
    state.character.setting.trim()
      ? `설정: ${clip(state.character.setting, started ? 500 : 800)}`
      : "",
    state.character.speechStyle.trim()
      ? `말투: ${clip(state.character.speechStyle, 200)}`
      : "",
    state.character.appearance.trim()
      ? `외형: ${clip(state.character.appearance, started ? 120 : 220)}`
      : "",
    state.character.forbidden.trim()
      ? `금지: ${clip(state.character.forbidden, 240)}`
      : "",
    !started && state.character.openingSituation.trim()
      ? `시작 상황: ${clip(state.character.openingSituation, 200)}`
      : "",
    "",
    "[유저]",
    `이름: ${state.userPersona.name || "유저"}`,
    state.userPersona.setting.trim()
      ? clip(state.userPersona.setting, started ? 400 : 700)
      : "",
    "",
    "[등장인물]",
    cast || "(없음)",
    "",
    "[고정된 사건]",
    state.storyPins
      ?.filter((pin) => pin.text.trim())
      .map((pin) => `- ${clip(pin.text, 160)}`)
      .join("\n") || "(없음)",
    "고정된 사건은 요약·최근 대화보다 우선한다. 말투·금지를 바꾸지 마라.",
    "",
    "[요약]",
    clip(state.storySummary, 400) || "(아직 없음)",
    "",
    "[최근 대화]",
    recent || "(없음)",
    "",
    "[유저 말]",
    userText,
    "위 입력의 @이름: 줄은 그 인물이 한 말이다. 유저 대사로 읽지 마라.",
    !started && state.prologue.trim()
      ? "\n프롤로그 직후부터 @:나레이션과 @이름:대사로 장면을 열어라. 전체 500자 이상 600자 이하."
      : "",
  ]);
}

export function cleanContinueUser(raw: string) {
  return raw
    .replace(/^```[\w]*\s*/, "")
    .replace(/\s*```$/, "")
    .trim()
    .slice(0, 2000);
}

export function splitContinueOutput(raw: string) {
  const text = raw.replace(/\r\n/g, "\n");
  if (/^---/.test(text)) {
    return { user: "", model: text.replace(/^---[^\S\n]*\n?/, "") };
  }
  const marker = text.indexOf("\n---");
  if (marker < 0) {
    return { user: text, model: "" };
  }
  return {
    user: text.slice(0, marker),
    model: text.slice(marker + 1).replace(/^---[^\S\n]*\n?/, ""),
  };
}

export function buildRegenPrompt(
  state: PromptState,
  userText: string,
  previous = "",
) {
  const { character, user } = resolvePromptNames(state);
  const recent = formatRecentDialogue(state);

  return joinPromptBlocks([
    `같은 유저 말에 대한 ${character}의 답을 다시 써라. 이전 답을 복사하지 마라.`,
    `한 턴은 공백 포함 500자 이상 600자 이하.`,
    `나레이션: @: 단락 하나, 3~5문장. 대사: @이름: 1~2번.`,
    `${user}의 대사·행동을 대신 쓰지 마라. 합니다·습니다·OOC 금지.`,
    state.character.speechStyle.trim()
      ? `말투: ${clip(state.character.speechStyle, 160)}`
      : "",
    "",
    "[최근 대화]",
    recent || "(없음)",
    "",
    "[유저 말]",
    userText,
    previous.trim()
      ? `\n[이전 답 — 반복 금지]\n${clip(previous, 360)}`
      : "",
  ]);
}

export function buildContinuePrompt(state: PromptState, hint = "") {
  const { character, user } = resolvePromptNames(state);
  const started = state.shortTermBuffer.length > 0;
  const recent = formatRecentDialogue(state);

  return joinPromptBlocks([
    `유저가 말을 비웠다. 한 출력으로 ${user}의 다음 입력과 ${character}의 답을 이어서 써라.`,
    `형식만 지켜라.`,
    `1) ${user}의 입력만. @${user}: / @: / *행동*. 한 턴, 짧게.`,
    `2) 다음 줄에 --- 만.`,
    `3) ${character}의 응답. @:나레이션 3~5문장, @이름:대사 1~2번. 공백 포함 500~600자.`,
    `${character} 답을 --- 앞에 쓰지 마라. ${user} 입력을 --- 뒤에 쓰지 마라.`,
    `합니다·습니다·안내문·OOC 금지. ${character} 말투를 따른다.`,
    hint.trim() ? `힌트: ${clip(hint, 200)}` : "",
    "",
    "[유저]",
    `이름: ${user}`,
    state.userPersona.setting.trim()
      ? clip(state.userPersona.setting, 280)
      : "",
    "",
    "[상대]",
    `이름: ${character}`,
    state.character.oneLiner.trim() ? `한 줄: ${state.character.oneLiner}` : "",
    state.character.speechStyle.trim()
      ? `말투: ${clip(state.character.speechStyle, 160)}`
      : "",
    !started && state.character.openingSituation.trim()
      ? `시작 상황: ${clip(state.character.openingSituation, 180)}`
      : "",
    "",
    "[최근 대화]",
    recent || "(없음)",
    !started && state.prologue.trim()
      ? `\n프롤로그 직후부터 이어라. 처음부터 다시 쓰지 마라.`
      : "최근 대화 직후만 이어라.",
  ]);
}

export function buildSummaryPrompt(state: PromptState) {
  const recent = state.shortTermBuffer
    .map((message) =>
      message.role === "user"
        ? `유저: ${message.content}`
        : `모델: ${message.content}`,
    )
    .join("\n");

  return `아래 기존 요약과 최근 대화만 보고, 스토리에서 일어난 일만 800자 안으로 요약하라.
세계관·캐릭터 설정·말투·금지·외형은 넣지 마라. 다시 쓰지도 마라.
고정된 사건은 이미 따로 있으니 요약에 반복하지 마라.
형식:
진행중:
결정된 것:
미결:

[고정된 사건]
${
    state.storyPins
      ?.filter((pin) => pin.text.trim())
      .map((pin) => `- ${pin.text}`)
      .join("\n") || "(없음)"
  }

[기존 요약]
${state.storySummary.trim() || "(없음)"}

[최근 대화]
${recent || "(없음)"}`;
}
