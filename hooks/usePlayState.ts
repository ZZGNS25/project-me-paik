"use client";

import { useCallback, useEffect, useState } from "react";
import { FIELD_LIMITS, createEmptyPlayState } from "@/lib/constants";
import { clip, loadPlayState, savePlayState } from "@/lib/storage";
import type {
  CastNote,
  CharacterProfile,
  ChatMessage,
  PlayState,
  UserPersona,
} from "@/lib/types";

function newId() {
  return crypto.randomUUID();
}

export function usePlayState() {
  const [state, setState] = useState<PlayState>(createEmptyPlayState);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setState(loadPlayState());
    setReady(true);
  }, []);

  useEffect(() => {
    if (!ready) return;
    savePlayState(state);
  }, [ready, state]);

  const patch = useCallback((updater: (prev: PlayState) => PlayState) => {
    setState(updater);
  }, []);

  function setApiKey(apiKey: string) {
    patch((prev) => ({ ...prev, apiKey }));
  }

  function updateCharacter<K extends keyof CharacterProfile>(
    key: K,
    value: string,
  ) {
    const limits: Record<keyof CharacterProfile, number> = {
      name: FIELD_LIMITS.characterName,
      oneLiner: FIELD_LIMITS.oneLiner,
      speechStyle: FIELD_LIMITS.speechStyle,
      appearance: FIELD_LIMITS.appearance,
      forbidden: FIELD_LIMITS.forbidden,
      openingSituation: FIELD_LIMITS.openingSituation,
    };

    patch((prev) => ({
      ...prev,
      character: { ...prev.character, [key]: clip(value, limits[key]) },
    }));
  }

  function updateUser<K extends keyof UserPersona>(key: K, value: string) {
    const limits: Record<keyof UserPersona, number> = {
      name: FIELD_LIMITS.userName,
      setting: FIELD_LIMITS.userSetting,
    };

    patch((prev) => ({
      ...prev,
      userPersona: { ...prev.userPersona, [key]: clip(value, limits[key]) },
    }));
  }

  function setWorldSetting(value: string) {
    patch((prev) => ({
      ...prev,
      worldSetting: clip(value, FIELD_LIMITS.worldSetting),
    }));
  }

  function setStorySummary(value: string) {
    patch((prev) => ({
      ...prev,
      storySummary: clip(value, FIELD_LIMITS.storySummary),
    }));
  }

  function addCastNote() {
    const used = state.castNotes.reduce(
      (sum, note) => sum + note.note.length,
      0,
    );
    if (used >= FIELD_LIMITS.castNotesTotal) return;

    patch((prev) => ({
      ...prev,
      castNotes: [...prev.castNotes, { id: newId(), name: "", note: "" }],
    }));
  }

  function updateCastNote(id: string, key: keyof CastNote, value: string) {
    patch((prev) => ({
      ...prev,
      castNotes: prev.castNotes.map((note) => {
        if (note.id !== id) return note;
        if (key === "id") return note;
        const max =
          key === "name" ? FIELD_LIMITS.castName : FIELD_LIMITS.castNote;
        return { ...note, [key]: clip(value, max) };
      }),
    }));
  }

  function removeCastNote(id: string) {
    patch((prev) => ({
      ...prev,
      castNotes: prev.castNotes.filter((note) => note.id !== id),
    }));
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

    patch((prev) => ({
      ...prev,
      chatLog: [...prev.chatLog, userMessage, modelMessage],
      shortTermBuffer: [...prev.shortTermBuffer, userMessage, modelMessage],
      turnCount: prev.turnCount + 1,
    }));
  }

  function applySummary(summary: string) {
    patch((prev) => ({
      ...prev,
      storySummary: clip(summary, FIELD_LIMITS.storySummary),
      shortTermBuffer: [],
    }));
  }

  function hydrateFromCloud(partial: Partial<PlayState>) {
    patch((prev) => ({ ...prev, ...partial }));
  }

  function setCloudSessionId(cloudSessionId: string | null) {
    patch((prev) => ({ ...prev, cloudSessionId }));
  }

  function startNewStory() {
    patch((prev) => {
      const next = {
        ...prev,
        storySummary: "",
        chatLog: [],
        shortTermBuffer: [],
        turnCount: 0,
        cloudSessionId: null,
      };
      savePlayState(next);
      return next;
    });
  }

  return {
    state,
    ready,
    setApiKey,
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
  };
}
