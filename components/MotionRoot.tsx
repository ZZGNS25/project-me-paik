"use client";

import IntroScreen from "@/components/IntroScreen";
import ViewportSync from "@/components/ViewportSync";
import Analytics from "@/components/Analytics";
import { PlayProvider } from "@/hooks/PlayProvider";

export default function MotionRoot({ children }: { children: React.ReactNode }) {
  return (
    <PlayProvider>
      <Analytics />
      <ViewportSync />
      <IntroScreen />
      {children}
    </PlayProvider>
  );
}
