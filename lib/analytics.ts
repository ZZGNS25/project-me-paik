const MEASUREMENT_ID =
  process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID?.trim() || "G-062FE9M296";

declare global {
  interface Window {
    dataLayer: unknown[];
    gtag?: (...args: unknown[]) => void;
  }
}

export function gaId() {
  return MEASUREMENT_ID?.trim() || "";
}

export function trackPageView(path: string) {
  const id = gaId();
  if (!id || typeof window === "undefined" || !window.gtag) return;
  window.gtag("event", "page_view", {
    page_path: path,
    page_location: `${window.location.origin}${path}`,
  });
}

export function trackEvent(name: string, params?: Record<string, string>) {
  if (typeof window === "undefined" || !window.gtag) return;
  window.gtag("event", name, params);
}
