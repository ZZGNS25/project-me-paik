import { FIELD_LIMITS, SHORT_TERM_TURNS } from "./constants";
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
유저가 @: 로 쓴 것은 나레이션이다.
유저가 @이름: 으로 쓴 것은 그 인물의 대사다. ${user}가 한 말이 아니다.
@${character}: 로 적힌 줄은 ${character}가 이미 말한 것이다. 유저 대사로 바꾸지 마라.
유저가 @${user}: 또는 이름 없이 쓴 말만 ${user}의 대사다.
유저가 *이렇게* 쓴 것은 행동·속마음이다.
나레이션은 차갑고 건조한 반말. ~다/~었다. 합니다·습니다 금지.
나레이션은 @: 단락 1~2개. 한 단락 안에서 문장을 이어서 쓴다. 한 문장을 한 줄로 끊지 마라.
나레이션은 8~14문장. 숨·시선·거리·공기·소리·손끝까지 한 흐름으로 보여라.
대사는 @이름: 형식. 말투를 따르되 한 말에 한두 문장까지 이어서 써도 된다.
안내문·설명조·하십시오·바랍니다 금지.
대사는 3~5번. 같은 인물을 설명 칸으로 나누지 마라.
동작·속마음은 *이렇게* 쓴다.
다른 기호·OOC 설명은 금지한다.
짧게 끊지 마라. 장면이 다 보일 때까지 이어서 써라.
최근 응답이 한 문장씩 잘려 있어도 따라하지 마라. 이번 나레이션은 단락으로 이어 써라.
나쁜 나레이션: @:그녀는 고개를 끄덕였다.
@:코트 자락이 움직였다.
@:검을 쥐었다.
좋은 나레이션: @:그녀는 짧게 고개를 끄덕인 뒤 거친 암벽 사이로 밀어닥치는 어둠의 경계를 밟았다. 회색 코트 자락이 던전의 낯선 바람에 잠깐 흔들렸고, 칼자국 난 장갑이 검자루를 감았다. 뒤에서 들리는 조심스러운 발소리로 거리를 가늠했다. 좁은 통로를 따라 불쾌한 습기와 마수의 비린내가 진하게 밀려왔다.
나쁜 대사: @${character}: 제 뒤를 세 걸음 이상 떨어지지 말고 따라오십시오.
좋은 대사: @${character}: 세 걸음 이상 떨어지지 마. 손 풀지 말고.`;
}

export function buildChatPrompt(state: PromptState, userText: string) {
  const started = state.shortTermBuffer.length > 0;
  const recent = state.shortTermBuffer
    .slice(-SHORT_TERM_TURNS * 2)
    .map((message) =>
      message.role === "user"
        ? `입력:\n${message.content}`
        : `응답:\n${message.content}`,
    )
    .join("\n\n");

  const cast = state.castNotes
    .filter((note) => note.name.trim() || note.note.trim())
    .map((note) => `- ${note.name}: ${note.note.slice(0, FIELD_LIMITS.castNote)}`)
    .join("\n");

  const blocks = [
    buildPinnedRules(state),
    "",
    "[세계관]",
    clip(state.worldSetting, FIELD_LIMITS.worldSetting) || "(없음)",
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
    state.character.setting.trim()
      ? `설정: ${clip(state.character.setting, FIELD_LIMITS.characterSetting)}`
      : "",
    state.character.speechStyle.trim()
      ? `말투: ${clip(state.character.speechStyle, 200)}`
      : "",
    state.character.appearance.trim()
      ? `외형: ${clip(state.character.appearance, started ? 160 : 300)}`
      : "",
    state.character.forbidden.trim()
      ? `금지: ${clip(state.character.forbidden, 400)}`
      : "",
    !started && state.character.openingSituation.trim()
      ? `시작 상황: ${clip(state.character.openingSituation, 200)}`
      : "",
    "",
    "[유저]",
    `이름: ${state.userPersona.name || "유저"}`,
    state.userPersona.setting.trim()
      ? clip(state.userPersona.setting, FIELD_LIMITS.userSetting)
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
    "위 입력의 @이름: 줄은 그 인물이 한 말이다. 유저 대사로 읽지 마라.",
    !started && state.prologue.trim()
      ? "\n프롤로그 직후 장면을 @:나레이션 단락(8문장 이상, 이어서)과 @이름:대사로 충분히 보여라."
      : "",
  ];

  return blocks.filter((line) => line !== "").join("\n");
}

export function buildSuggestPrompt(state: PromptState, hint = "") {
  const character = state.character.name.trim() || "캐릭터";
  const user = state.userPersona.name.trim() || "유저";
  const started = state.shortTermBuffer.length > 0;
  const recent = state.shortTermBuffer
    .slice(-SHORT_TERM_TURNS * 2)
    .map((message) =>
      message.role === "user"
        ? `입력:\n${message.content}`
        : `응답:\n${message.content}`,
    )
    .join("\n\n");

  return [
    `[역할]`,
    `너는 ${user}의 다음 입력을 대신 쓴다. 채팅 입력창에 넣을 텍스트만 출력한다.`,
    `이것은 ${character}의 답이 아니다.`,
    "",
    `[규칙]`,
    `- ${character}의 대사·나레이션·속마음을 쓰지 마라.`,
    `- ${user}의 말·짧은 행동만 쓴다.`,
    `- 형식: @${user}: 대사 / @:짧은 장면 / *행동*`,
    `- 최근 장면 직후만 잇는다. 처음부터 다시 시작하지 마라.`,
    `- 한 턴분. 대사 1~3번. 나레이션은 있어도 두 문장 안.`,
    `- 안내·설명·따옴표 설명·코드블록 금지.`,
    `- ${user}의 설정과 최근 말투를 따른다.`,
    "",
    "[세계관]",
    clip(state.worldSetting, 800) || "(없음)",
    "",
    "[유저]",
    `이름: ${user}`,
    state.userPersona.setting.trim()
      ? clip(state.userPersona.setting, FIELD_LIMITS.userSetting)
      : "",
    "",
    "[상대]",
    `이름: ${character}`,
    state.character.oneLiner.trim() ? `한 줄: ${state.character.oneLiner}` : "",
    state.character.setting.trim()
      ? `설정: ${clip(state.character.setting, 400)}`
      : "",
    "",
    "[요약]",
    clip(state.storySummary, 400) || "(아직 없음)",
    "",
    "[최근 대화]",
    recent || "(없음)",
    !started && state.character.openingSituation.trim()
      ? `\n[시작 상황]\n${clip(state.character.openingSituation, 200)}`
      : "",
    "",
    hint.trim()
      ? `[힌트]\n유저가 이미 적었다. 이 뜻을 지키되 입력창 형식으로 다듬어라.\n${clip(hint, 400)}`
      : "[힌트]\n없음. 맥락만 보고 다음 말을 써라.",
  ]
    .filter((line) => line !== "")
    .join("\n");
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
