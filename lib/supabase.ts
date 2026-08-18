import { createClient, type SupabaseClient, type SupportedStorage } from "@supabase/supabase-js";
import { isGuestSession } from "@/lib/guest";

let supabase: SupabaseClient | undefined;

const authStorage: SupportedStorage = {
  getItem(key) {
    if (typeof window === "undefined") return null;
    return (isGuestSession() ? window.sessionStorage : window.localStorage).getItem(
      key,
    );
  },
  setItem(key, value) {
    if (typeof window === "undefined") return;
    (isGuestSession() ? window.sessionStorage : window.localStorage).setItem(
      key,
      value,
    );
  },
  removeItem(key) {
    if (typeof window === "undefined") return;
    window.sessionStorage.removeItem(key);
    window.localStorage.removeItem(key);
  },
};

export function hasSupabaseEnv() {
  return Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
  );
}

export function getSupabase() {
  if (!hasSupabaseEnv()) {
    throw new Error("Supabase 환경 변수가 설정되지 않았습니다.");
  }

  if (!supabase) {
    supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
      {
        auth: {
          persistSession: true,
          autoRefreshToken: true,
          detectSessionInUrl: true,
          flowType: "pkce",
          storage: authStorage,
        },
      },
    );
  }

  return supabase;
}

export function formatSupabaseError(
  error: { message?: string } | string | null | undefined,
  fallback = "요청에 실패했습니다.",
) {
  const message = String(
    typeof error === "string" ? error : error?.message || "",
  );
  const lower = message.toLowerCase();

  if (
    lower.includes("jwt issued at future") ||
    lower.includes("token used before issued")
  ) {
    return "컴퓨터 시간이 실제보다 느립니다. Windows 시간을 동기화한 뒤 다시 로그인해 주세요.";
  }

  if (lower.includes("jwt expired") || lower.includes("token is expired")) {
    return "로그인 세션이 만료되었습니다. 다시 로그인해 주세요.";
  }

  return message || fallback;
}
