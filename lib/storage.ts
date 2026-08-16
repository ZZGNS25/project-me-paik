import { createEmptyPlayState, createEmptySetting, createEmptyStore } from "./constants";
import { buildForbidden } from "./forbidden";
import type { AppStore, PlayState, SettingRecord } from "./types";
import { STORAGE_KEY } from "./constants";

function applyForbidden(record: SettingRecord): SettingRecord {
  const forbiddenManual = Boolean(record.character.forbiddenManual);
  return {
    ...record,
    prologue: record.prologue ?? "",
    userPersona: {
      ...record.userPersona,
      photo: record.userPersona.photo ?? "",
    },
    character: {
      ...record.character,
      photo: record.character.photo ?? "",
      forbiddenManual,
      forbidden: forbiddenManual
        ? record.character.forbidden
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
    updatedAt: new Date().toISOString(),
    character: parsed.character ?? createEmptyPlayState().character,
    userPersona: parsed.userPersona ?? createEmptyPlayState().userPersona,
    worldSetting: parsed.worldSetting ?? "",
    prologue: parsed.prologue ?? "",
    storySummary: parsed.storySummary ?? "",
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
      return {
        ...parsed,
        settings: parsed.settings.map(applyForbidden),
      };
    }
    const migrated = migrateLegacy({
      ...createEmptyPlayState(),
      ...(parsed as PlayState),
    });
    return {
      ...migrated,
      settings: migrated.settings.map(applyForbidden),
    };
  } catch {
    return createEmptyStore();
  }
}

export function saveStore(store: AppStore) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
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
