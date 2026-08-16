import { createEmptyPlayState } from "./constants";
import type { PlayState } from "./types";
import { STORAGE_KEY } from "./constants";

export function loadPlayState(): PlayState {
  if (typeof window === "undefined") return createEmptyPlayState();

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return createEmptyPlayState();
    return { ...createEmptyPlayState(), ...JSON.parse(raw) } as PlayState;
  } catch {
    return createEmptyPlayState();
  }
}

export function savePlayState(state: PlayState) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

export function clip(value: string, max: number) {
  return value.slice(0, max);
}
