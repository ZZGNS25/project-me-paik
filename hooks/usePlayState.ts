"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { FIELD_LIMITS, PERSONAS_MAX, createEmptySetting, createEmptyStore } from "@/lib/constants";
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
import { userFromPersona } from "@/lib/persona";
import type { ShareSnapshot } from "@/lib/share";
import type {
  AppStore,
  CastNote,
  CharacterProfile,
  ChatMessage,
  PlayState,
  SavedPersona,
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

  function applySummary(summary: string, summarizedTurns?: number) {
    updateStore((prev) =>
      patchCurrent(prev, (current) => {
        const closed = summarizedTurns ?? recountTurns(current.shortTermBuffer);
        const keepTurns = Math.max(0, current.turnCount - closed);
        return {
          ...current,
          storySummary: clip(sanitizeSummary(summary), FIELD_LIMITS.storySummary),
          shortTermBuffer:
            keepTurns > 0 ? current.chatLog.slice(-keepTurns * 2) : [],
        };
      }),
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

  function forkCurrentSetting() {
    updateStore((prev) => {
      const current =
        prev.settings.find((item) => item.id === prev.currentSettingId) ??
        prev.settings[0];
      if (!current) return prev;
      const setting: SettingRecord = {
        ...current,
        id: newId(),
        title: "",
        shareId: null,
        cloudSessionId: null,
        storySummary: "",
        chatLog: [],
        shortTermBuffer: [],
        turnCount: 0,
        updatedAt: new Date().toISOString(),
      };
      const next = {
        ...prev,
        currentSettingId: setting.id,
        settings: [...prev.settings, setting],
      };
      saveStore(next);
      return next;
    });
  }

  function upsertPersona(input: {
    id?: string;
    label: string;
    name: string;
    setting: string;
    photo: string;
  }) {
    const name = input.name.trim();
    const label = input.label.trim() || name;
    if (!name) return;

    updateStore((prev) => {
      const personas = prev.personas ?? [];
      const existing = input.id
        ? personas.find((item) => item.id === input.id)
        : undefined;
      if (!existing && personas.length >= PERSONAS_MAX) return prev;
      const nextPersona: SavedPersona = {
        id: existing?.id ?? newId(),
        label: clip(label, FIELD_LIMITS.personaLabel),
        name: clip(name, FIELD_LIMITS.userName),
        setting: clip(input.setting, FIELD_LIMITS.userSetting),
        photo: input.photo ?? "",
        updatedAt: new Date().toISOString(),
      };
      return {
        ...prev,
        lastPersonaId: nextPersona.id,
        personas: existing
          ? personas.map((item) =>
              item.id === existing.id ? nextPersona : item,
            )
          : [...personas, nextPersona],
      };
    });
  }

  function applyPersona(id: string) {
    updateStore((prev) => {
      const persona = (prev.personas ?? []).find((item) => item.id === id);
      if (!persona) return prev;
      return {
        ...patchCurrent(prev, (current) => ({
          ...current,
          personaId: persona.id,
          userPersona: userFromPersona(persona),
        })),
        lastPersonaId: persona.id,
      };
    });
  }

  function deletePersona(id: string) {
    updateStore((prev) => ({
      ...prev,
      lastPersonaId: prev.lastPersonaId === id ? null : prev.lastPersonaId,
      personas: (prev.personas ?? []).filter((item) => item.id !== id),
    }));
  }

  function applyPreset(presetId: PresetId, personaId?: string | null) {
    const preset = WORLD_PRESETS.find((item) => item.id === presetId);
    if (!preset) return;
    updateStore((prev) => {
      const setting = settingFromPreset(preset, newId());
      const chosenId = personaId === undefined ? prev.lastPersonaId : personaId;
      const persona = chosenId
        ? (prev.personas ?? []).find((item) => item.id === chosenId)
        : undefined;
      if (persona) {
        setting.userPersona = userFromPersona(persona);
        setting.personaId = persona.id;
      }

      const current =
        prev.settings.find((item) => item.id === prev.currentSettingId) ??
        prev.settings[0];
      const canReplace = current && current.chatLog.length === 0;
      const lastPersonaId = persona?.id ?? prev.lastPersonaId ?? null;

      if (canReplace && current) {
        return {
          ...prev,
          lastPersonaId,
          settings: prev.settings.map((item) =>
            item.id === current.id ? { ...setting, id: current.id } : item,
          ),
        };
      }

      return {
        ...prev,
        lastPersonaId,
        currentSettingId: setting.id,
        settings: [...prev.settings, setting],
      };
    });
  }

  function createSetting(personaId?: string | null) {
    updateStore((prev) => {
      const setting = withForbidden(createEmptySetting(newId()));
      const chosenId = personaId === undefined ? prev.lastPersonaId : personaId;
      const persona = chosenId
        ? (prev.personas ?? []).find((item) => item.id === chosenId)
        : undefined;
      if (persona) {
        setting.userPersona = userFromPersona(persona);
        setting.personaId = persona.id;
      }
      return {
        ...prev,
        lastPersonaId: persona?.id ?? prev.lastPersonaId ?? null,
        currentSettingId: setting.id,
        settings: [...prev.settings, setting],
      };
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
      const remaining = prev.settings.filter((item) => item.id !== id);
      if (remaining.length === 0) {
        const setting = withForbidden(createEmptySetting(newId()));
        const next = {
          ...prev,
          currentSettingId: setting.id,
          settings: [setting],
        };
        saveStore(next);
        return next;
      }
      const currentSettingId =
        prev.currentSettingId === id ? remaining[0].id : prev.currentSettingId;
      const next = { ...prev, settings: remaining, currentSettingId };
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
    personas: store.personas ?? [],
    lastPersonaId: store.lastPersonaId ?? null,
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
    addFromCloud,
    openFromCloud,
    hydrateFromCloud,
    setCloudSessionId,
    startNewStory,
    forkCurrentSetting,
    createSetting,
    applyPreset,
    selectSetting,
    upsertPersona,
    applyPersona,
    deletePersona,
    unlinkCloudSession,
    deleteSetting,
    renameSetting,
    setShareId,
    openFromShare,
  };
}

export type PlayController = ReturnType<typeof usePlayState>;
