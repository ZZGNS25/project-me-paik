"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { FIELD_LIMITS, createEmptySetting, createEmptyStore } from "@/lib/constants";
import { buildForbidden } from "@/lib/forbidden";
import { WORLD_PRESETS, settingFromPreset, type PresetId } from "@/lib/presets";
import {
  normalizePins,
  pinTextFromTurn,
  recountTurns,
  sanitizeSummary,
  syncBuffer,
} from "@/lib/memory";
import {
  backfillPresetMeta,
  clip,
  loadStore,
  saveStore,
  toPlayState,
} from "@/lib/storage";
import type { ShareSnapshot } from "@/lib/share";
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
        castNotes: [...current.castNotes, { id: newId(), name: "", note: "", photo: "" }],
      })),
    );
  }

  function updateCastNote(id: string, key: keyof CastNote, value: string) {
    updateStore((prev) =>
      patchCurrent(prev, (current) => ({
        ...current,
        castNotes: current.castNotes.map((note) => {
          if (note.id !== id || key === "id") return note;
          if (key === "photo") return { ...note, photo: value };
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

  function withLog(current: SettingRecord, chatLog: ChatMessage[]): SettingRecord {
    return {
      ...current,
      chatLog,
      shortTermBuffer: syncBuffer(chatLog),
      turnCount: recountTurns(chatLog),
    };
  }

  function lastTurn(log: ChatMessage[]) {
    if (log.length === 0) {
      return { ids: [] as string[], userText: "" };
    }

    const last = log[log.length - 1];
    const prev = log[log.length - 2];
    if (last.role === "model" && prev?.role === "user") {
      return { ids: [prev.id, last.id], userText: prev.content };
    }
    if (last.role === "user") {
      return { ids: [last.id], userText: last.content };
    }
    return { ids: [last.id], userText: "" };
  }

  function removeLastTurn() {
    const current =
      store.settings.find((item) => item.id === store.currentSettingId) ??
      store.settings[0];
    if (!current) return "";
    const turn = lastTurn(current.chatLog);
    if (turn.ids.length === 0) return "";
    const ids = new Set(turn.ids);
    const nextStore = patchCurrent(store, (item) =>
      withLog(
        item,
        item.chatLog.filter((message) => !ids.has(message.id)),
      ),
    );
    saveStore(nextStore);
    setStore(nextStore);
    return turn.userText;
  }

  function truncateFrom(messageId: string) {
    const current =
      store.settings.find((item) => item.id === store.currentSettingId) ??
      store.settings[0];
    if (!current) return;
    const index = current.chatLog.findIndex((item) => item.id === messageId);
    if (index < 0) return;
    let start = index;
    if (
      current.chatLog[index].role === "model" &&
      current.chatLog[index - 1]?.role === "user"
    ) {
      start = index - 1;
    }
    const nextStore = patchCurrent(store, (item) =>
      withLog(item, item.chatLog.slice(0, start)),
    );
    saveStore(nextStore);
    setStore(nextStore);
  }

  function rewindForRegen(userMessageId: string): {
    text: string;
    state: PlayState;
  } | null {
    const current =
      store.settings.find((item) => item.id === store.currentSettingId) ??
      store.settings[0];
    if (!current) return null;
    const index = current.chatLog.findIndex((item) => item.id === userMessageId);
    if (index < 0 || current.chatLog[index].role !== "user") return null;
    const nextStore = patchCurrent(store, (item) =>
      withLog(item, item.chatLog.slice(0, index)),
    );
    saveStore(nextStore);
    setStore(nextStore);
    return {
      text: current.chatLog[index].content,
      state: toPlayState(nextStore),
    };
  }

  function deleteLastTurn() {
    removeLastTurn();
  }

  function popLastUserMessage() {
    return removeLastTurn();
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
        storySummary: clip(sanitizeSummary(summary), FIELD_LIMITS.storySummary),
        shortTermBuffer: [],
      })),
    );
  }

  function addStoryPin(text: string) {
    const value = clip(text.trim(), FIELD_LIMITS.storyPin);
    if (!value) return;
    updateStore((prev) =>
      patchCurrent(prev, (current) => {
        const pins = current.storyPins ?? [];
        if (pins.length >= FIELD_LIMITS.storyPinsMax) return current;
        return {
          ...current,
          storyPins: [...pins, { id: newId(), text: value }],
        };
      }),
    );
  }

  function pinTurn(user: ChatMessage, model?: ChatMessage) {
    addStoryPin(pinTextFromTurn(user, model));
  }

  function updateStoryPin(id: string, text: string) {
    updateStore((prev) =>
      patchCurrent(prev, (current) => ({
        ...current,
        storyPins: current.storyPins.map((pin) =>
          pin.id === id ? { ...pin, text: clip(text, FIELD_LIMITS.storyPin) } : pin,
        ),
      })),
    );
  }

  function removeStoryPin(id: string) {
    updateStore((prev) =>
      patchCurrent(prev, (current) => ({
        ...current,
        storyPins: current.storyPins.filter((pin) => pin.id !== id),
      })),
    );
  }

  function importSettings(incoming: SettingRecord[]) {
    if (incoming.length === 0) return;
    updateStore((prev) => {
      const next = incoming.map((item) =>
        withForbidden({
          ...createEmptySetting(newId()),
          ...item,
          id: newId(),
          title: item.title ?? "",
          shareId: null,
          storyPins: normalizePins(item.storyPins),
          cloudSessionId: null,
          updatedAt: new Date().toISOString(),
        }),
      );
      return {
        ...prev,
        currentSettingId: next[0].id,
        settings: [...prev.settings, ...next],
      };
    });
  }

  function mergeCloudPlay(
    prev: AppStore,
    partial: Partial<PlayState> & { cloudSessionId: string },
    select = false,
  ) {
    const existing = prev.settings.find(
      (item) => item.cloudSessionId === partial.cloudSessionId,
    );
    const mapped: SettingRecord = withForbidden(
      backfillPresetMeta({
        ...(existing ?? createEmptySetting(newId())),
        ...partial,
        title: existing?.title ?? "",
        shareId: existing?.shareId ?? null,
        id: existing?.id ?? newId(),
        storyPins: normalizePins(partial.storyPins),
        shortTermBuffer: partial.shortTermBuffer ?? syncBuffer(partial.chatLog ?? []),
        cloudSessionId: partial.cloudSessionId,
        updatedAt: new Date().toISOString(),
      }),
    );

    if (existing) {
      return {
        ...prev,
        currentSettingId: select ? mapped.id : prev.currentSettingId,
        settings: prev.settings.map((item) =>
          item.id === existing.id ? mapped : item,
        ),
      };
    }

    const blank =
      prev.settings.length === 1 &&
      !prev.settings[0].character.name.trim() &&
      prev.settings[0].chatLog.length === 0;
    return {
      ...prev,
      currentSettingId: select || blank ? mapped.id : prev.currentSettingId,
      settings: blank ? [mapped] : [...prev.settings, mapped],
    };
  }

  function addFromCloud(partial: Partial<PlayState> & { cloudSessionId: string }) {
    updateStore((prev) => mergeCloudPlay(prev, partial));
  }

  function openFromCloud(partial: Partial<PlayState> & { cloudSessionId: string }) {
    const next = mergeCloudPlay(store, partial, true);
    saveStore(next);
    setStore(next);
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

        return backfillPresetMeta({
          ...current,
          ...partial,
          character,
          storyPins: normalizePins(partial.storyPins ?? current.storyPins),
          shortTermBuffer:
            partial.shortTermBuffer ??
            syncBuffer(partial.chatLog ?? current.chatLog),
          prologue: partial.prologue?.trim() ? partial.prologue : current.prologue,
          id: current.id,
        });
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

  function unlinkCloudSession(sessionId: string) {
    updateStore((prev) => ({
      ...prev,
      settings: prev.settings.map((item) =>
        item.cloudSessionId === sessionId
          ? { ...item, cloudSessionId: null, updatedAt: new Date().toISOString() }
          : item,
      ),
    }));
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

  function renameSetting(id: string, title: string) {
    updateStore((prev) => ({
      ...prev,
      settings: prev.settings.map((item) =>
        item.id === id
          ? {
              ...item,
              title: clip(title, FIELD_LIMITS.storyTitle),
              updatedAt: new Date().toISOString(),
            }
          : item,
      ),
    }));
  }

  function setShareId(shareId: string | null) {
    updateStore((prev) =>
      patchCurrent(prev, (current) => ({ ...current, shareId })),
    );
  }

  function openFromShare(snapshot: ShareSnapshot) {
    const setting = withForbidden(
      backfillPresetMeta({
        ...createEmptySetting(newId()),
        title: snapshot.title ?? "",
        shareId: null,
        character: snapshot.character,
        userPersona: snapshot.userPersona,
        worldSetting: snapshot.worldSetting,
        prologue: snapshot.prologue,
        castNotes: snapshot.castNotes.map((note) => ({
          id: newId(),
          name: note.name,
          note: note.note,
          photo: note.photo ?? "",
        })),
      }),
    );
    updateStore((prev) => {
      const blank =
        prev.settings.length === 1 &&
        !prev.settings[0].character.name.trim() &&
        prev.settings[0].chatLog.length === 0;
      const next = {
        ...prev,
        currentSettingId: setting.id,
        settings: blank ? [setting] : [...prev.settings, setting],
      };
      saveStore(next);
      return next;
    });
  }

  return {
    state,
    ready,
    settings: store.settings,
    currentSettingId: store.currentSettingId,
    updatedAt: state && store.settings.find((item) => item.id === store.currentSettingId)?.updatedAt,
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
    deleteLastTurn,
    popLastUserMessage,
    truncateFrom,
    rewindForRegen,
    applySummary,
    addStoryPin,
    pinTurn,
    updateStoryPin,
    removeStoryPin,
    importSettings,
    addFromCloud,
    openFromCloud,
    hydrateFromCloud,
    setCloudSessionId,
    startNewStory,
    createSetting,
    applyPreset,
    selectSetting,
    unlinkCloudSession,
    deleteSetting,
    renameSetting,
    setShareId,
    openFromShare,
  };
}

export type PlayController = ReturnType<typeof usePlayState>;
