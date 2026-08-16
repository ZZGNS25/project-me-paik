const PENDING_KEY = "eorol-pending-message";

export function setPendingMessage(text: string) {
  window.sessionStorage.setItem(PENDING_KEY, text);
}

export function takePendingMessage() {
  const text = window.sessionStorage.getItem(PENDING_KEY);
  window.sessionStorage.removeItem(PENDING_KEY);
  return text?.trim() || "";
}
