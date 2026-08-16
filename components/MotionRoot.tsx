"use client";

import IntroScreen from "@/components/IntroScreen";
import ViewportSync from "@/components/ViewportSync";
import { PlayProvider } from "@/hooks/PlayProvider";

export default function MotionRoot({ children }: { children: React.ReactNode }) {
  return (
    <PlayProvider>
      <ViewportSync />
      <IntroScreen />
      {children}
    </PlayProvider>
  );
}
