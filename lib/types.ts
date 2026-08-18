export type ChatRole = "user" | "model";

export type ChatMessage = {
  id: string;
  role: ChatRole;
  content: string;
  createdAt: string;
  versions?: string[];
  versionIndex?: number;
};

export type CastNote = {
  id: string;
  name: string;
  note: string;
  photo: string;
};

export type StoryPin = {
  id: string;
  text: string;
};

export type CharacterProfile = {
  name: string;
  oneLiner: string;
  speechStyle: string;
  appearance: string;
  forbidden: string;
  forbiddenManual: boolean;
  openingSituation: string;
  photo: string;
};

export type UserPersona = {
  name: string;
  setting: string;
  photo: string;
};

export type SavedPersona = {
  id: string;
  label: string;
  name: string;
  setting: string;
  photo: string;
  updatedAt: string;
};

export type PlayState = {
  apiKey: string;
  character: CharacterProfile;
  userPersona: UserPersona;
  worldSetting: string;
  prologue: string;
  storySummary: string;
  storyPins: StoryPin[];
  castNotes: CastNote[];
  chatLog: ChatMessage[];
  shortTermBuffer: ChatMessage[];
  turnCount: number;
  cloudSessionId: string | null;
};

export type SettingRecord = Omit<PlayState, "apiKey"> & {
  id: string;
  title: string;
  shareId: string | null;
  personaId: string | null;
  updatedAt: string;
};

export type AppStore = {
  apiKey: string;
  currentSettingId: string;
  settings: SettingRecord[];
  personas: SavedPersona[];
  lastPersonaId: string | null;
};

export type PromptState = Pick<
  PlayState,
  | "character"
  | "userPersona"
  | "worldSetting"
  | "prologue"
  | "storySummary"
  | "storyPins"
  | "castNotes"
  | "shortTermBuffer"
>;

export type InlinePart = {
  text: string;
  italic?: boolean;
};

export type ParsedLine =
  | { kind: "narration"; text: string }
  | { kind: "speech"; name: string; text: string }
  | { kind: "fallback"; text: string };
