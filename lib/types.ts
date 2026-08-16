export type ChatRole = "user" | "model";

export type ChatMessage = {
  id: string;
  role: ChatRole;
  content: string;
  createdAt: string;
};

export type CastNote = {
  id: string;
  name: string;
  note: string;
};

export type CharacterProfile = {
  name: string;
  oneLiner: string;
  speechStyle: string;
  appearance: string;
  forbidden: string;
  openingSituation: string;
};

export type UserPersona = {
  name: string;
  setting: string;
};

export type PlayState = {
  apiKey: string;
  character: CharacterProfile;
  userPersona: UserPersona;
  worldSetting: string;
  storySummary: string;
  castNotes: CastNote[];
  chatLog: ChatMessage[];
  shortTermBuffer: ChatMessage[];
  turnCount: number;
  cloudSessionId: string | null;
};

export type SettingRecord = Omit<PlayState, "apiKey"> & {
  id: string;
  updatedAt: string;
};

export type AppStore = {
  apiKey: string;
  currentSettingId: string;
  settings: SettingRecord[];
};

export type PromptState = Pick<
  PlayState,
  | "character"
  | "userPersona"
  | "worldSetting"
  | "storySummary"
  | "castNotes"
  | "shortTermBuffer"
>;

export type ParsedLine =
  | { kind: "narration"; text: string }
  | { kind: "speech"; name: string; text: string }
  | { kind: "fallback"; text: string };
