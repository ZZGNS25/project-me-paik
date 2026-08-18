"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import FreshStartFlow from "@/components/FreshStartFlow";
import { useCloudSync, usePlay } from "@/hooks/PlayProvider";
import { deletePlayFromCloud } from "@/lib/cloud";
import { DEFAULT_STORY_TITLE } from "@/lib/constants";
import { SAVED_CHATS_MAX, defaultSavedChatTitle } from "@/lib/savedChat";
import { isUnusedBlank, listSavedChats, oldestSavedChat } from "@/lib/settingFilters";

export function useStartFresh() {
  const play = usePlay();
  const cloud = useCloudSync();
  const router = useRouter();
  const [freshOpen, setFreshOpen] = useState(false);

  function openBlankScenario() {
    const unused = play.settings.find((item) => isUnusedBlank(item));
    if (unused) {
      play.selectSetting(unused.id);
      if (!unused.title.trim() || unused.title.trim() === "이름 없음") {
        play.renameSetting(unused.id, DEFAULT_STORY_TITLE);
      }
    } else play.createSetting();
    router.push("/setup?focus=1");
  }

  function startStory() {
    openBlankScenario();
  }

  function goToStart() {
    router.push("/");
  }

  function startChat() {
    if (play.state.chatLog.length === 0) {
      goToStart();
      return;
    }
    setFreshOpen(true);
  }

  async function finishFresh(save: boolean, title: string) {
    setFreshOpen(false);
    if (save) {
      const saved = listSavedChats(play.settings);
      if (saved.length >= SAVED_CHATS_MAX) {
        const oldest = oldestSavedChat(play.settings, play.currentSettingId);
        if (oldest) {
          if (oldest.cloudSessionId) {
            await deletePlayFromCloud(oldest.cloudSessionId).catch(() => undefined);
          }
          play.deleteSetting(oldest.id);
        }
      }
      await cloud.saveNow();
      play.forkCurrentSetting(title.trim() || defaultSavedChatTitle());
    } else {
      const sessionId = play.state.cloudSessionId;
      play.startNewStory();
      if (sessionId) {
        void deletePlayFromCloud(sessionId).catch(() => undefined);
      }
    }
    goToStart();
  }

  return {
    startStory,
    startChat,
    dialog: freshOpen ? (
      <FreshStartFlow
        savedFull={listSavedChats(play.settings).length >= SAVED_CHATS_MAX}
        onCancel={() => setFreshOpen(false)}
        onConfirm={(save, title) => void finishFresh(save, title)}
      />
    ) : null,
  };
}
