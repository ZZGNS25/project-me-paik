export const STORAGE_KEY = "eorol-play-state";

export const GEMINI_MODEL = "gemini-3.6-flash";
export const GEMINI_MAX_OUTPUT_TOKENS = 400;
export const SHORT_TERM_TURNS = 5;

export const FIELD_LIMITS = {
  characterName: 20,
  oneLiner: 50,
  speechStyle: 200,
  appearance: 200,
  forbidden: 300,
  openingSituation: 300,
  userName: 20,
  userSetting: 200,
  worldSetting: 800,
  storySummary: 600,
  castName: 20,
  castNote: 80,
  castNotesTotal: 400,
} as const;

export const WORLD_PLACEHOLDER = `시대/장소:
세계의 규칙: (예: 마법 없음 / 스마트폰 있음)
중요 지명:
절대 금지: (세계관이 깨지면 안 되는 것)`;

export const EMPTY_CHARACTER = {
  name: "",
  oneLiner: "",
  speechStyle: "",
  appearance: "",
  forbidden: "",
  openingSituation: "",
};

export const EMPTY_USER = {
  name: "",
  setting: "",
};

export function createEmptyPlayState(): import("./types").PlayState {
  return {
    apiKey: "",
    character: { ...EMPTY_CHARACTER },
    userPersona: { ...EMPTY_USER },
    worldSetting: "",
    storySummary: "",
    castNotes: [],
    chatLog: [],
    shortTermBuffer: [],
    turnCount: 0,
    cloudSessionId: null,
  };
}
