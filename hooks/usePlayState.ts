"use client";

import { useCallback, useEffect, useState } from "react";
import { FIELD_LIMITS, createEmptySetting, createEmptyStore } from "@/lib/constants";
import { buildForbidden } from "@/lib/forbidden";
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
  return {
    ...record,
    updatedAt: new Date().toISOString(),
    character: {
      ...record.character,
      forbidden: buildForbidden({
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

  useEffect(() => {
    setStore(loadStore());
    setReady(true);
  }, []);

  useEffect(() => {
    if (!ready) return;
    saveStore(store);
  }, [ready, store]);

  const updateStore = useCallback((updater: (prev: AppStore) => AppStore) => {
    setStore(updater);
  }, []);

  const state = toPlayState(store);

  function updateCharacter<K extends keyof CharacterProfile>(
    key: K,
    value: string,
  ) {
    if (key === "forbidden") return;

    const limits: Record<keyof CharacterProfile, number> = {
      name: FIELD_LIMITS.characterName,
      oneLiner: FIELD_LIMITS.oneLiner,
      speechStyle: FIELD_LIMITS.speechStyle,
      appearance: FIELD_LIMITS.appearance,
      forbidden: FIELD_LIMITS.forbidden,
      openingSituation: FIELD_LIMITS.openingSituation,
    };

    updateStore((prev) =>
      patchCurrent(prev, (current) => ({
        ...current,
        character: { ...current.character, [key]: clip(value, limits[key]) },
      })),
    );
  }

  function updateUser<K extends keyof UserPersona>(key: K, value: string) {
    const limits: Record<keyof UserPersona, number> = {
      name: FIELD_LIMITS.userName,
      setting: FIELD_LIMITS.userSetting,
    };

    updateStore((prev) =>
      patchCurrent(prev, (current) => ({
        ...current,
        userPersona: { ...current.userPersona, [key]: clip(value, limits[key]) },
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
      patchCurrent(prev, (current) => ({
        ...current,
        ...partial,
        id: current.id,
      })),
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
    updateUser,
    setWorldSetting,
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
    selectSetting,
    deleteSetting,
  };
}
