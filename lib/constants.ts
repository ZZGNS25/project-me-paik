export const STORAGE_KEY = "eorol-play-state";

export const GEMINI_MODEL = "gemini-3.6-flash";
export const GEMINI_MAX_OUTPUT_TOKENS = 4096;
export const GEMINI_SUMMARY_OUTPUT_TOKENS = 768;
export const GEMINI_SUGGEST_OUTPUT_TOKENS = 400;
export const SHORT_TERM_TURNS = 3;
export const COMPRESS_EVERY_TURNS = 30;
export const PERSONAS_MAX = 12;

export const FIELD_LIMITS = {
  characterName: 32,
  oneLiner: 80,
  speechStyle: 200,
  appearance: 300,
  forbidden: 400,
  openingSituation: 200,
  userName: 32,
  userSetting: 1000,
  worldSetting: 2000,
  prologue: 1200,
  storySummary: 800,
  storyPin: 160,
  storyPinsMax: 12,
  castName: 32,
  castNote: 200,
  castNotesTotal: 1200,
  storyTitle: 40,
  personaLabel: 40,
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
  forbiddenManual: false,
  openingSituation: "",
  photo: "",
};

export const EMPTY_USER = {
  name: "",
  setting: "",
  photo: "",
};

export function createEmptySetting(
  id = "local-draft",
): import("./types").SettingRecord {
  return {
    id,
    title: "",
    shareId: null,
    updatedAt: new Date().toISOString(),
    character: { ...EMPTY_CHARACTER },
    userPersona: { ...EMPTY_USER },
    worldSetting: "",
    prologue: "",
    storySummary: "",
    storyPins: [],
    castNotes: [],
    chatLog: [],
    shortTermBuffer: [],
    turnCount: 0,
    cloudSessionId: null,
    personaId: null,
  };
}

export function createEmptyStore(): import("./types").AppStore {
  const setting = createEmptySetting();
  return {
    apiKey: "",
    currentSettingId: setting.id,
    settings: [setting],
    personas: [],
    lastPersonaId: null,
  };
}

export function createEmptyPlayState(): import("./types").PlayState {
  const setting = createEmptySetting();
  return {
    apiKey: "",
    character: setting.character,
    userPersona: setting.userPersona,
    worldSetting: setting.worldSetting,
    prologue: setting.prologue,
    storySummary: setting.storySummary,
    storyPins: setting.storyPins,
    castNotes: setting.castNotes,
    chatLog: setting.chatLog,
    shortTermBuffer: setting.shortTermBuffer,
    turnCount: setting.turnCount,
    cloudSessionId: setting.cloudSessionId,
  };
}
