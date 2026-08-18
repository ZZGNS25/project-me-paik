"use client";

import { useEffect, useState } from "react";
import EarRoleMark from "@/components/EarRoleMark";
import { SITE_MOTTO } from "@/lib/site";

const INTRO_KEY = "eorol-intro-seen";

export default function IntroScreen() {
  const [phase, setPhase] = useState<"hidden" | "in" | "out">("hidden");

  useEffect(() => {
    if (sessionStorage.getItem(INTRO_KEY) === "1") return;
    setPhase("in");
    const leave = window.setTimeout(() => setPhase("out"), 2600);
    const done = window.setTimeout(() => {
      sessionStorage.setItem(INTRO_KEY, "1");
      setPhase("hidden");
    }, 3300);
    return () => {
      window.clearTimeout(leave);
      window.clearTimeout(done);
    };
  }, []);

  if (phase === "hidden") return null;

  return (
    <div className={`intro-screen ${phase === "out" ? "is-leaving" : ""}`}>
      <div className="intro-mark">
        <EarRoleMark size={88} />
        <p className="brand-en">EarRole</p>
        <p className="intro-kicker">{SITE_MOTTO}</p>
      </div>
    </div>
  );
}
