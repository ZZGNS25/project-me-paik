import { STORAGE_KEY } from "@/lib/constants";

export const GUEST_SESSION_KEY = "eorol-guest-session";

export function isGuestSession() {
  return (
    typeof window !== "undefined" &&
    window.sessionStorage.getItem(GUEST_SESSION_KEY) === "1"
  );
}

export function beginGuestSession() {
  if (typeof window === "undefined") return;
  window.sessionStorage.setItem(GUEST_SESSION_KEY, "1");
  window.sessionStorage.removeItem(STORAGE_KEY);
}

export function clearGuestSession() {
  if (typeof window === "undefined") return;
  window.sessionStorage.removeItem(GUEST_SESSION_KEY);
  window.sessionStorage.removeItem(STORAGE_KEY);
}
