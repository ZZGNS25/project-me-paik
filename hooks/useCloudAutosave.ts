"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import type { PlayController } from "@/hooks/usePlayState";
import { listPlaySessions, loadPlayById, savePlayToCloud } from "@/lib/cloud";

export type CloudSync = {
  status: "idle" | "saving" | "saved" | "error";
  error: string;
  saveNow: () => Promise<void>;
};

export function useCloudAutosave(play: PlayController): CloudSync {
  const auth = useAuth();
  const [status, setStatus] = useState<CloudSync["status"]>("idle");
  const [error, setError] = useState("");
  const playRef = useRef(play);
  const saving = useRef(false);
  const queued = useRef(false);
  const pulled = useRef(false);
  playRef.current = play;

  const saveNow = useCallback(async () => {
    const user = auth.user;
    const current = playRef.current;
    if (!user || !current.ready) return;

    const state = current.state;
    if (!state.character.name.trim() && state.chatLog.length === 0) return;

    if (saving.current) {
      queued.current = true;
      return;
    }

    saving.current = true;
    setStatus("saving");
    try {
      const id = await savePlayToCloud(user.id, state);
      if (playRef.current.state.cloudSessionId !== id) {
        playRef.current.setCloudSessionId(id);
      }
      setStatus("saved");
      setError("");
    } catch (err) {
      setStatus("error");
      setError(err instanceof Error ? err.message : "클라우드 저장에 실패했습니다.");
    } finally {
      saving.current = false;
      if (queued.current) {
        queued.current = false;
        void saveNow();
      }
    }
  }, [auth.user]);

  useEffect(() => {
    if (!auth.user || !play.ready) return;
    const timer = window.setTimeout(() => {
      void saveNow();
    }, 2200);
    return () => window.clearTimeout(timer);
  }, [
    auth.user,
    play.ready,
    play.currentSettingId,
    play.updatedAt,
    play.state.turnCount,
    play.state.chatLog.length,
    saveNow,
  ]);

  useEffect(() => {
    if (!auth.user || !play.ready) return;

    function onHide() {
      if (document.visibilityState === "hidden") {
        void saveNow();
      }
    }

    document.addEventListener("visibilitychange", onHide);
    return () => document.removeEventListener("visibilitychange", onHide);
  }, [auth.user, play.ready, saveNow]);

  useEffect(() => {
    if (!auth.user || !play.ready || pulled.current) return;
    const key = `eorol-cloud-pulled:${auth.user.id}`;
    if (sessionStorage.getItem(key)) {
      pulled.current = true;
      return;
    }
    pulled.current = true;
    sessionStorage.setItem(key, "1");

    const userId = auth.user.id;
    void (async () => {
      try {
        const remote = await listPlaySessions(userId);
        const have = new Set(
          playRef.current.settings
            .map((item) => item.cloudSessionId)
            .filter((id): id is string => Boolean(id)),
        );
        for (const row of remote) {
          if (have.has(row.id)) continue;
          const loaded = await loadPlayById(row.id);
          if (loaded?.cloudSessionId) {
            playRef.current.addFromCloud({
              ...loaded,
              cloudSessionId: loaded.cloudSessionId,
            });
            have.add(row.id);
          }
        }
      } catch {
        sessionStorage.removeItem(key);
        pulled.current = false;
      }
    })();
  }, [auth.user, play.ready]);

  return { status, error, saveNow };
}
