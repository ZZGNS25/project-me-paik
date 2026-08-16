import { SHORT_TERM_TURNS } from "./constants";
import type { PromptState } from "./types";

function clip(value: string, max: number) {
  const text = value.trim();
  if (text.length <= max) return text;
  return `${text.slice(0, max).trim()}…`;
}

export function buildPinnedRules(state: PromptState) {
  const character = state.character.name.trim() || "캐릭터";
  const user = state.userPersona.name.trim() || "유저";

  return `[규칙]
너는 ${character}의 시점과 행동만 서술한다.
절대로 ${user}의 대사·감정·행동을 대신 쓰지 않는다.
유저가 @이름: 으로 쓴 것은 그 인물을 지칭한 말이다.
유저가 @: 로 쓴 것은 나레이션이다.
유저가 *이렇게* 쓴 것은 행동·속마음이다.
나레이션은 차갑고 짧은 반말. ~다/~었다. 합니다·습니다 금지.
나레이션은 @: 로 시작하는 줄을 4~7개 쓴다. 각 줄은 한 문장.
대사는 @이름: 대사 형식. 말투를 따르되 짧고 차갑게.
안내문·설명조·하십시오·바랍니다 금지. 한 줄에 한 말만.
대사는 3~6줄. 같은 인물을 여러 칸으로 나누어 설명하지 마라.
동작·속마음은 *이렇게* 쓴다.
다른 기호·OOC 설명은 금지한다.
한 줄로 끝내지 마라. 문장을 중간에 끊지 마라.
장면이 보이게 충분히 써라. 숨·시선·거리·공기까지 이어서 보여라.
나쁜 나레이션: @:그녀는 고개를 끄덕였습니다.
좋은 나레이션: @:그녀는 짧게 고개를 끄덕였다.
나쁜 대사: @${character}: 제 뒤를 세 걸음 이상 떨어지지 말고 따라오십시오.
좋은 대사: @${character}: 세 걸음 이상 떨어지지 마.`;
}

export function buildChatPrompt(state: PromptState, userText: string) {
  const started = state.shortTermBuffer.length > 0;
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

  const blocks = [
    buildPinnedRules(state),
    "",
    "[세계관]",
    clip(state.worldSetting, started ? 900 : 1600) || "(없음)",
    "",
    "[프롤로그]",
    started
      ? "이미 지난 일이다. 처음부터 다시 쓰지 말고 최근 대화 직후부터 이어라."
      : state.prologue.trim()
        ? `${clip(state.prologue, 1200)}\n(프롤로그는 이미 지난 일이다. 처음부터 다시 쓰지 말고 그 직후부터 이어라.)`
        : "(없음)",
    "",
    "[캐릭터]",
    `이름: ${state.character.name}`,
    state.character.oneLiner.trim() ? `한 줄: ${state.character.oneLiner}` : "",
    state.character.speechStyle.trim()
      ? `말투: ${clip(state.character.speechStyle, 240)}`
      : "",
    state.character.appearance.trim()
      ? `외형: ${clip(state.character.appearance, started ? 160 : 400)}`
      : "",
    state.character.forbidden.trim()
      ? `금지: ${clip(state.character.forbidden, 400)}`
      : "",
    !started && state.character.openingSituation.trim()
      ? `시작 상황: ${clip(state.character.openingSituation, 500)}`
      : "",
    "",
    "[유저]",
    `이름: ${state.userPersona.name || "유저"}`,
    state.userPersona.setting.trim()
      ? clip(state.userPersona.setting, started ? 180 : 400)
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
    clip(state.storySummary, 500) || "(아직 없음)",
    "",
    "[최근 대화]",
    recent || "(없음)",
    "",
    "[유저 말]",
    userText,
    !started && state.prologue.trim()
      ? "\n프롤로그 직후 장면을 @:나레이션 4~7줄과 @이름:대사 3~6줄로 충분히 보여라."
      : "",
  ];

  return blocks.filter((line) => line !== "").join("\n");
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
