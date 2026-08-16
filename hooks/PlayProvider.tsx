"use client";

import { createContext, useContext } from "react";
import { useCloudAutosave, type CloudSync } from "@/hooks/useCloudAutosave";
import { usePlayState, type PlayController } from "@/hooks/usePlayState";

const PlayContext = createContext<PlayController | null>(null);
const CloudContext = createContext<CloudSync | null>(null);

export function PlayProvider({ children }: { children: React.ReactNode }) {
  const play = usePlayState();
  const cloud = useCloudAutosave(play);

  return (
    <PlayContext.Provider value={play}>
      <CloudContext.Provider value={cloud}>{children}</CloudContext.Provider>
    </PlayContext.Provider>
  );
}

export function usePlay() {
  const play = useContext(PlayContext);
  if (!play) {
    throw new Error("usePlay는 PlayProvider 안에서만 쓸 수 있습니다.");
  }
  return play;
}

export function useCloudSync() {
  const cloud = useContext(CloudContext);
  if (!cloud) {
    throw new Error("useCloudSync는 PlayProvider 안에서만 쓸 수 있습니다.");
  }
  return cloud;
}
