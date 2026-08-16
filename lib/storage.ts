import {
  FIELD_LIMITS,
  STORAGE_KEY,
  createEmptyPlayState,
  createEmptySetting,
  createEmptyStore,
} from "./constants";
import { buildForbidden } from "./forbidden";
import { normalizePins } from "./memory";
import { WORLD_PRESETS } from "./presets";
import type { AppStore, PlayState, SettingRecord } from "./types";

let lastSaved = "";

function backfillPresetMeta(record: SettingRecord): SettingRecord {
  const preset = WORLD_PRESETS.find(
    (item) => item.character.name === record.character.name.trim(),
  );
  if (!preset) return record;
  const oldHunterSpeech = "존댓말, 짧은 문장, 이모지 금지. 감정은 잘 안 드러낸다.";
  return {
    ...record,
    prologue: record.prologue.trim() || preset.prologue,
    character: {
      ...record.character,
      photo: record.character.photo || preset.character.photo,
      speechStyle:
        record.character.speechStyle.trim() === oldHunterSpeech
          ? preset.character.speechStyle
          : record.character.speechStyle,
    },
  };
}

function applyForbidden(record: SettingRecord): SettingRecord {
  const forbiddenManual = Boolean(record.character.forbiddenManual);
  return {
    ...record,
    title: record.title ?? "",
    prologue: record.prologue ?? "",
    storyPins: normalizePins(record.storyPins),
    worldSetting: clip(record.worldSetting ?? "", FIELD_LIMITS.worldSetting),
    userPersona: {
      ...record.userPersona,
      photo: record.userPersona.photo ?? "",
      setting: clip(record.userPersona.setting ?? "", FIELD_LIMITS.userSetting),
    },
    character: {
      ...record.character,
      photo: record.character.photo ?? "",
      speechStyle: clip(record.character.speechStyle ?? "", FIELD_LIMITS.speechStyle),
      appearance: clip(record.character.appearance ?? "", FIELD_LIMITS.appearance),
      openingSituation: clip(
        record.character.openingSituation ?? "",
        FIELD_LIMITS.openingSituation,
      ),
      forbiddenManual,
      forbidden: forbiddenManual
        ? clip(record.character.forbidden, FIELD_LIMITS.forbidden)
        : buildForbidden({
            name: record.character.name,
            speechStyle: record.character.speechStyle,
            appearance: record.character.appearance,
            worldSetting: record.worldSetting,
            openingSituation: record.character.openingSituation,
          }),
    },
  };
}

export function toPlayState(store: AppStore): PlayState {
  const current =
    store.settings.find((item) => item.id === store.currentSettingId) ??
    store.settings[0] ??
    createEmptySetting();

  return {
    apiKey: store.apiKey,
    character: {
      ...current.character,
      photo: current.character.photo ?? "",
    },
    userPersona: {
      ...current.userPersona,
      photo: current.userPersona.photo ?? "",
    },
    worldSetting: current.worldSetting,
    prologue: current.prologue ?? "",
    storySummary: current.storySummary,
    storyPins: normalizePins(current.storyPins),
    castNotes: current.castNotes,
    chatLog: current.chatLog,
    shortTermBuffer: current.shortTermBuffer,
    turnCount: current.turnCount,
    cloudSessionId: current.cloudSessionId,
  };
}

function isStore(value: unknown): value is AppStore {
  if (!value || typeof value !== "object") return false;
  const store = value as AppStore;
  return Array.isArray(store.settings) && typeof store.currentSettingId === "string";
}

function migrateLegacy(parsed: PlayState): AppStore {
  const id =
    typeof crypto !== "undefined" && crypto.randomUUID
      ? crypto.randomUUID()
      : "migrated";
  const setting: SettingRecord = {
    id,
    title: "",
    updatedAt: new Date().toISOString(),
    character: parsed.character ?? createEmptyPlayState().character,
    userPersona: parsed.userPersona ?? createEmptyPlayState().userPersona,
    worldSetting: parsed.worldSetting ?? "",
    prologue: parsed.prologue ?? "",
    storySummary: parsed.storySummary ?? "",
    storyPins: normalizePins(parsed.storyPins),
    castNotes: parsed.castNotes ?? [],
    chatLog: parsed.chatLog ?? [],
    shortTermBuffer: parsed.shortTermBuffer ?? [],
    turnCount: parsed.turnCount ?? 0,
    cloudSessionId: parsed.cloudSessionId ?? null,
  };

  return {
    apiKey: parsed.apiKey ?? "",
    currentSettingId: id,
    settings: [setting],
  };
}

export function loadStore(): AppStore {
  if (typeof window === "undefined") return createEmptyStore();

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return createEmptyStore();
    const parsed = JSON.parse(raw) as unknown;
    if (isStore(parsed) && parsed.settings.length > 0) {
      const next = {
        ...parsed,
        settings: parsed.settings.map((item) =>
          applyForbidden(backfillPresetMeta(item)),
        ),
      };
      lastSaved = raw;
      return next;
    }
    const migrated = migrateLegacy({
      ...createEmptyPlayState(),
      ...(parsed as PlayState),
    });
    return {
      ...migrated,
      settings: migrated.settings.map((item) =>
        applyForbidden(backfillPresetMeta(item)),
      ),
    };
  } catch {
    return createEmptyStore();
  }
}

export function saveStore(store: AppStore) {
  if (typeof window === "undefined") return;
  const raw = JSON.stringify(store);
  if (raw === lastSaved) return;
  lastSaved = raw;
  window.localStorage.setItem(STORAGE_KEY, raw);
}

export function loadPlayState(): PlayState {
  return toPlayState(loadStore());
}

export function savePlayState(state: PlayState) {
  const store = loadStore();
  const currentId = store.currentSettingId;
  const next: AppStore = {
    ...store,
    apiKey: state.apiKey,
    settings: store.settings.map((item) =>
      item.id === currentId
        ? {
            ...item,
            ...state,
            id: item.id,
            title: item.title,
            updatedAt: new Date().toISOString(),
          }
        : item,
    ),
  };
  saveStore(next);
}

export function clip(value: string, max: number) {
  return value.slice(0, max);
}
