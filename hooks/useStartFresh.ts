"use client";

import { useRouter } from "next/navigation";
import { useConfirm } from "@/components/ConfirmDialog";
import { useCloudSync, usePlay } from "@/hooks/PlayProvider";
import { deletePlayFromCloud } from "@/lib/cloud";
import type { SettingRecord } from "@/lib/types";

function isUnusedBlank(setting: SettingRecord) {
  return (
    !setting.character.name.trim() &&
    !setting.character.photo &&
    !setting.worldSetting.trim() &&
    setting.chatLog.length === 0
  );
}

export function useStartFresh() {
  const play = usePlay();
  const cloud = useCloudSync();
  const router = useRouter();
  const confirm = useConfirm();

  function openBlankScenario() {
    const unused = play.settings.find(isUnusedBlank);
    if (unused) play.selectSetting(unused.id);
    else play.createSetting();
    router.push("/setup?focus=1");
  }

  function startStory() {
    openBlankScenario();
  }

  function startChat() {
    if (play.state.chatLog.length === 0) {
      if (play.state.character.name.trim()) router.push("/chat");
      else router.push("/setup?focus=1");
      return;
    }

    confirm.ask({
      message:
        "지금 대화를 목록에 남기고, 같은 세계로 빈 대화를 열까요? 지우면 이 대화는 사라집니다.",
      confirmLabel: "남기고 새로",
      altLabel: "지우고 새로",
      run: async () => {
        await cloud.saveNow();
        play.forkCurrentSetting();
        router.push("/chat");
      },
      runAlt: () => {
        const sessionId = play.state.cloudSessionId;
        play.startNewStory();
        if (sessionId) {
          void deletePlayFromCloud(sessionId).catch(() => undefined);
        }
        router.push("/chat");
      },
    });
  }

  return {
    startStory,
    startChat,
    dialog: confirm.dialog,
  };
}
