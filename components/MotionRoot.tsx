"use client";

import IntroScreen from "@/components/IntroScreen";

export default function MotionRoot({ children }: { children: React.ReactNode }) {
  return (
    <>
      <IntroScreen />
      {children}
    </>
  );
}
