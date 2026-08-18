"use client";

import { useCallback, useEffect, useRef, useState } from "react";

export const OVERLAY_LEAVE_MS = 180;

function reduceMotion() {
  return (
    typeof window !== "undefined" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches
  );
}

export function useOverlayLeave() {
  const [leaving, setLeaving] = useState(false);
  const timer = useRef(0);
  const leavingRef = useRef(false);

  useEffect(() => () => window.clearTimeout(timer.current), []);

  const dismiss = useCallback((then: () => void) => {
    if (leavingRef.current) return;
    if (reduceMotion()) {
      then();
      return;
    }
    leavingRef.current = true;
    setLeaving(true);
    timer.current = window.setTimeout(then, OVERLAY_LEAVE_MS);
  }, []);

  return {
    leaving,
    dismiss,
    leaveClass: leaving ? "is-leaving" : "",
  };
}
