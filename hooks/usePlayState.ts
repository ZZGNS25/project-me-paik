"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { FIELD_LIMITS, createEmptySetting, createEmptyStore } from "@/lib/constants";
import { buildForbidden } from "@/lib/forbidden";
import { WORLD_PRESETS, settingFromPreset, type PresetId } from "@/lib/presets";
import { clip, loadStore, saveStore, toPlayState } from "@/lib/storage";
import type {
  AppStore,
  CastNote,
  CharacterProfile,
  ChatMessage,
  PlayState,
  SettingRecord,
  UserPersona,
} from "@/lib/types";

function newId() {
  return crypto.randomUUID();
}

function withForbidden(record: SettingRecord): SettingRecord {
  const forbiddenManual = Boolean(record.character.forbiddenManual);
  return {
    ...record,
    updatedAt: new Date().toISOString(),
    character: {
      ...record.character,
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

function patchCurrent(
  store: AppStore,
  updater: (current: SettingRecord) => SettingRecord,
): AppStore {
  const current =
    store.settings.find((item) => item.id === store.currentSettingId) ??
    store.settings[0];
  if (!current) return store;

  const next = withForbidden(updater(current));
  return {
    ...store,
    settings: store.settings.map((item) =>
      item.id === current.id ? next : item,
    ),
  };
}

export function usePlayState() {
  const [store, setStore] = useState<AppStore>(createEmptyStore);
  const [ready, setReady] = useState(false);
  const skipSave = useRef(true);

  useEffect(() => {
    setStore(loadStore());
    setReady(true);
  }, []);

  useEffect(() => {
    if (!ready) return;
    if (skipSave.current) {
      skipSave.current = false;
      return;
    }
    saveStore(store);
  }, [ready, store]);

  const updateStore = useCallback((updater: (prev: AppStore) => AppStore) => {
    setStore(updater);
  }, []);

  const state = toPlayState(store);

  function updateCharacter(
    key: Exclude<keyof CharacterProfile, "forbiddenManual" | "photo">,
    value: string,
  ) {
    const limits = {
      name: FIELD_LIMITS.characterName,
      oneLiner: FIELD_LIMITS.oneLiner,
      speechStyle: FIELD_LIMITS.speechStyle,
      appearance: FIELD_LIMITS.appearance,
      forbidden: FIELD_LIMITS.forbidden,
      openingSituation: FIELD_LIMITS.openingSituation,
    } as const;

    updateStore((prev) =>
      patchCurrent(prev, (current) => ({
        ...current,
        character: {
          ...current.character,
          [key]: clip(value, limits[key]),
          ...(key === "forbidden" ? { forbiddenManual: true } : {}),
        },
      })),
    );
  }

  function resetForbidden() {
    updateStore((prev) =>
      patchCurrent(prev, (current) => ({
        ...current,
        character: {
          ...current.character,
          forbiddenManual: false,
        },
      })),
    );
  }

  function updateUser(key: Exclude<keyof UserPersona, "photo">, value: string) {
    const limits = {
      name: FIELD_LIMITS.userName,
      setting: FIELD_LIMITS.userSetting,
    } as const;

    updateStore((prev) =>
      patchCurrent(prev, (current) => ({
        ...current,
        userPersona: { ...current.userPersona, [key]: clip(value, limits[key]) },
      })),
    );
  }

  function setUserPhoto(photo: string) {
    updateStore((prev) =>
      patchCurrent(prev, (current) => ({
        ...current,
        userPersona: { ...current.userPersona, photo },
      })),
    );
  }

  function setCharacterPhoto(photo: string) {
    updateStore((prev) =>
      patchCurrent(prev, (current) => ({
        ...current,
        character: { ...current.character, photo },
      })),
    );
  }

  function setWorldSetting(value: string) {
    updateStore((prev) =>
      patchCurrent(prev, (current) => ({
        ...current,
        worldSetting: clip(value, FIELD_LIMITS.worldSetting),
      })),
    );
  }

  function setPrologue(value: string) {
    updateStore((prev) =>
      patchCurrent(prev, (current) => ({
        ...current,
        prologue: clip(value, FIELD_LIMITS.prologue),
      })),
    );
  }

  function setStorySummary(value: string) {
    updateStore((prev) =>
      patchCurrent(prev, (current) => ({
        ...current,
        storySummary: clip(value, FIELD_LIMITS.storySummary),
      })),
    );
  }

  function addCastNote() {
    const used = state.castNotes.reduce(
      (sum, note) => sum + note.note.length,
      0,
    );
    if (used >= FIELD_LIMITS.castNotesTotal) return;

    updateStore((prev) =>
      patchCurrent(prev, (current) => ({
        ...current,
        castNotes: [...current.castNotes, { id: newId(), name: "", note: "" }],
      })),
    );
  }

  function updateCastNote(id: string, key: keyof CastNote, value: string) {
    updateStore((prev) =>
      patchCurrent(prev, (current) => ({
        ...current,
        castNotes: current.castNotes.map((note) => {
          if (note.id !== id || key === "id") return note;
          const max =
            key === "name" ? FIELD_LIMITS.castName : FIELD_LIMITS.castNote;
          return { ...note, [key]: clip(value, max) };
        }),
      })),
    );
  }

  function removeCastNote(id: string) {
    updateStore((prev) =>
      patchCurrent(prev, (current) => ({
        ...current,
        castNotes: current.castNotes.filter((note) => note.id !== id),
      })),
    );
  }

  function appendTurn(userText: string, modelText: string) {
    const createdAt = new Date().toISOString();
    const userMessage: ChatMessage = {
      id: newId(),
      role: "user",
      content: userText,
      createdAt,
    };
    const modelMessage: ChatMessage = {
      id: newId(),
      role: "model",
      content: modelText,
      createdAt: new Date().toISOString(),
    };

    updateStore((prev) =>
      patchCurrent(prev, (current) => ({
        ...current,
        chatLog: [...current.chatLog, userMessage, modelMessage],
        shortTermBuffer: [...current.shortTermBuffer, userMessage, modelMessage],
        turnCount: current.turnCount + 1,
      })),
    );
  }

  function applySummary(summary: string) {
    updateStore((prev) =>
      patchCurrent(prev, (current) => ({
        ...current,
        storySummary: clip(summary, FIELD_LIMITS.storySummary),
        shortTermBuffer: [],
      })),
    );
  }

  function hydrateFromCloud(partial: Partial<PlayState>) {
    updateStore((prev) =>
      patchCurrent(prev, (current) => {
        const character = partial.character
          ? {
              ...current.character,
              ...partial.character,
              forbiddenManual:
                partial.character.forbiddenManual ??
                Boolean(partial.character.forbidden.trim()),
            }
          : current.character;

        return {
          ...current,
          ...partial,
          character,
          prologue: partial.prologue?.trim() ? partial.prologue : current.prologue,
          id: current.id,
        };
      }),
    );
  }

  function setCloudSessionId(cloudSessionId: string | null) {
    updateStore((prev) =>
      patchCurrent(prev, (current) => ({ ...current, cloudSessionId })),
    );
  }

  function startNewStory() {
    updateStore((prev) => {
      const next = patchCurrent(prev, (current) => ({
        ...current,
        storySummary: "",
        chatLog: [],
        shortTermBuffer: [],
        turnCount: 0,
        cloudSessionId: null,
      }));
      saveStore(next);
      return next;
    });
  }

  function applyPreset(presetId: PresetId) {
    const preset = WORLD_PRESETS.find((item) => item.id === presetId);
    if (!preset) return;
    const setting = settingFromPreset(preset, newId());
    updateStore((prev) => {
      const current =
        prev.settings.find((item) => item.id === prev.currentSettingId) ??
        prev.settings[0];
      const canReplace = current && current.chatLog.length === 0;

      if (canReplace && current) {
        const next = {
          ...prev,
          settings: prev.settings.map((item) =>
            item.id === current.id ? { ...setting, id: current.id } : item,
          ),
        };
        saveStore(next);
        return next;
      }

      const next = {
        ...prev,
        currentSettingId: setting.id,
        settings: [...prev.settings, setting],
      };
      saveStore(next);
      return next;
    });
  }

  function createSetting() {
    const setting = withForbidden(createEmptySetting(newId()));
    updateStore((prev) => {
      const next = {
        ...prev,
        currentSettingId: setting.id,
        settings: [...prev.settings, setting],
      };
      saveStore(next);
      return next;
    });
  }

  function selectSetting(id: string) {
    updateStore((prev) => {
      if (!prev.settings.some((item) => item.id === id)) return prev;
      const next = { ...prev, currentSettingId: id };
      saveStore(next);
      return next;
    });
  }

  function deleteSetting(id: string) {
    updateStore((prev) => {
      if (prev.settings.length <= 1) return prev;
      const settings = prev.settings.filter((item) => item.id !== id);
      const currentSettingId =
        prev.currentSettingId === id ? settings[0].id : prev.currentSettingId;
      const next = { ...prev, settings, currentSettingId };
      saveStore(next);
      return next;
    });
  }

  return {
    state,
    ready,
    settings: store.settings,
    currentSettingId: store.currentSettingId,
    updateCharacter,
    resetForbidden,
    updateUser,
    setUserPhoto,
    setCharacterPhoto,
    setWorldSetting,
    setPrologue,
    setStorySummary,
    addCastNote,
    updateCastNote,
    removeCastNote,
    appendTurn,
    applySummary,
    hydrateFromCloud,
    setCloudSessionId,
    startNewStory,
    createSetting,
    applyPreset,
    selectSetting,
    deleteSetting,
  };
}

export type PlayController = ReturnType<typeof usePlayState>;
