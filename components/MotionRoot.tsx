"use client";

import IntroScreen from "@/components/IntroScreen";
import { PlayProvider } from "@/hooks/PlayProvider";

export default function MotionRoot({ children }: { children: React.ReactNode }) {
  return (
    <PlayProvider>
      <IntroScreen />
      {children}
    </PlayProvider>
  );
}
