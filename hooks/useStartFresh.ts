"use client";

import { useRouter } from "next/navigation";
import { useConfirm } from "@/components/ConfirmDialog";
import { useCloudSync, usePlay } from "@/hooks/PlayProvider";
import { deletePlayFromCloud } from "@/lib/cloud";

export function useStartFresh() {
  const play = usePlay();
  const cloud = useCloudSync();
  const router = useRouter();
  const confirm = useConfirm();

  function hasOngoing() {
    return play.state.chatLog.length > 0;
  }

  function runNew(mode: "story" | "chat") {
    if (mode === "chat" && play.state.character.name.trim()) {
      play.forkCurrentSetting();
      router.push("/chat");
      return;
    }
    play.createSetting();
    router.push("/setup");
  }

  function runDiscard(mode: "story" | "chat") {
    if (mode === "chat" && play.state.character.name.trim()) {
      const sessionId = play.state.cloudSessionId;
      play.startNewStory();
      if (sessionId) {
        void deletePlayFromCloud(sessionId).catch(() => undefined);
      }
      router.push("/chat");
      return;
    }
    play.createSetting();
    router.push("/setup");
  }

  function start(mode: "story" | "chat") {
    if (!hasOngoing()) {
      if (mode === "chat") {
        if (play.state.character.name.trim()) router.push("/chat");
        else router.push("/setup");
        return;
      }
      runNew("story");
      return;
    }

    confirm.ask({
      message: "지금 대화를 저장할까요?",
      confirmLabel: "저장",
      altLabel: "저장 안 함",
      run: async () => {
        await cloud.saveNow();
        runNew(mode);
      },
      runAlt: () => runDiscard(mode),
    });
  }

  return {
    startStory: () => start("story"),
    startChat: () => start("chat"),
    dialog: confirm.dialog,
  };
}
