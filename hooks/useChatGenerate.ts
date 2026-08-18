"use client";

import { useEffect, useRef, useState } from "react";
import type { PlayController } from "@/hooks/usePlayState";
import {
  GenerateStoppedError,
  isAbortError,
  requestGenerateStream,
} from "@/lib/geminiClient";
import { isBlankOrMeaningless } from "@/lib/korean";
import { takePendingMessage } from "@/lib/pending";
import { cleanContinueUser, splitContinueOutput } from "@/lib/prompt";
import { SAVED_CHATS_MAX } from "@/lib/savedChat";
import { listSavedChats } from "@/lib/settingFilters";
import type { PlayState } from "@/lib/types";

export function useChatGenerate(play: PlayController, loggedIn: boolean) {
  const [draft, setDraft] = useState("");
  const [busy, setBusy] = useState<"chat" | null>(null);
  const [error, setError] = useState("");
  const [pendingUser, setPendingUser] = useState("");
  const [streamingReply, setStreamingReply] = useState("");
  const [replacingModelId, setReplacingModelId] = useState<string | null>(null);
  const pendingSent = useRef(false);
  const sending = useRef(false);
  const abortRef = useRef<AbortController | null>(null);

  async function sendMessage(
    text = draft.trim(),
    state: PlayState = play.state,
    replaceModelId?: string,
  ) {
    if (!text || sending.current) return;
    if (
      !replaceModelId &&
      state.chatLog.length === 0 &&
      listSavedChats(play.settings).length >= SAVED_CHATS_MAX
    ) {
      setError("이어하기가 가득 찼습니다. 목록에서 대화를 지운 뒤 이으세요.");
      return;
    }

    sending.current = true;
    setBusy("chat");
    setError("");
    setDraft("");
    setPendingUser(replaceModelId ? "" : text);
    setStreamingReply("");
    setReplacingModelId(replaceModelId ?? null);
    const ac = new AbortController();
    abortRef.current = ac;

    try {
      const previous = replaceModelId
        ? state.chatLog.find((item) => item.id === replaceModelId)?.content ??
          play.state.chatLog.find((item) => item.id === replaceModelId)?.content ??
          ""
        : "";
      const reply = await requestGenerateStream(
        state,
        text,
        setStreamingReply,
        ac.signal,
        replaceModelId ? "regen" : "chat",
        previous,
      );
      if (replaceModelId) {
        play.commitRegen(replaceModelId, reply);
      } else {
        play.appendTurn(text, reply);
      }
      setPendingUser("");
      setStreamingReply("");
    } catch (err) {
      setPendingUser("");
      setStreamingReply("");
      if (err instanceof GenerateStoppedError) {
        if (err.partial) {
          if (replaceModelId) {
            play.commitRegen(replaceModelId, err.partial);
          } else {
            play.appendTurn(text, err.partial);
          }
        } else if (!replaceModelId) {
          setDraft(text);
        }
      } else {
        if (!replaceModelId) setDraft(text);
        setError(err instanceof Error ? err.message : "응답을 받지 못했습니다.");
      }
    } finally {
      abortRef.current = null;
      sending.current = false;
      setBusy(null);
      setReplacingModelId(null);
    }
  }

  function stopGenerate() {
    abortRef.current?.abort();
  }

  async function submitComposer() {
    const typed = draft.trim();
    if (!isBlankOrMeaningless(typed)) {
      void sendMessage(typed);
      return;
    }
    if (sending.current) return;
    if (
      play.state.chatLog.length === 0 &&
      listSavedChats(play.settings).length >= SAVED_CHATS_MAX
    ) {
      setError("이어하기가 가득 찼습니다. 목록에서 대화를 지운 뒤 이으세요.");
      return;
    }
    sending.current = true;
    setBusy("chat");
    setError("");
    setDraft("");
    setPendingUser("");
    setStreamingReply("");
    const ac = new AbortController();
    abortRef.current = ac;
    let userText = "";
    let modelText = "";
    try {
      const raw = await requestGenerateStream(
        play.state,
        typed,
        (full) => {
          const parts = splitContinueOutput(full);
          userText = cleanContinueUser(parts.user);
          modelText = parts.model;
          setPendingUser(userText);
          setStreamingReply(modelText);
        },
        ac.signal,
        "continue",
      );
      const parts = splitContinueOutput(raw);
      userText = cleanContinueUser(parts.user);
      modelText = parts.model.trim();
      if (!userText || !modelText) {
        throw new Error("이어서 만들지 못했습니다.");
      }
      play.appendTurn(userText, modelText);
      setPendingUser("");
      setStreamingReply("");
    } catch (err) {
      setPendingUser("");
      setStreamingReply("");
      if (err instanceof GenerateStoppedError) {
        const parts = splitContinueOutput(err.partial);
        const stoppedUser = cleanContinueUser(parts.user);
        const stoppedModel = parts.model.trim();
        if (stoppedUser && stoppedModel) {
          play.appendTurn(stoppedUser, stoppedModel);
        } else if (stoppedUser) {
          setDraft(stoppedUser);
        }
      } else if (!isAbortError(err)) {
        setError(err instanceof Error ? err.message : "이어서 만들지 못했습니다.");
      }
    } finally {
      abortRef.current = null;
      sending.current = false;
      setBusy(null);
    }
  }

  useEffect(() => {
    if (!play.ready || !loggedIn || pendingSent.current) return;
    const pending = takePendingMessage();
    if (!pending) return;
    pendingSent.current = true;
    // Pending setup→chat handoff; same one-shot as the page-level effect.
    // eslint-disable-next-line react-hooks/set-state-in-effect -- start generate after hydrate
    void sendMessage(pending);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- send once when ready
  }, [play.ready, loggedIn]);

  return {
    draft,
    setDraft,
    busy,
    error,
    setError,
    pendingUser,
    streamingReply,
    replacingModelId,
    sendMessage,
    submitComposer,
    stopGenerate,
  };
}
