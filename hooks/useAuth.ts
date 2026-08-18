"use client";

import { useEffect, useState } from "react";
import type { User } from "@supabase/supabase-js";
import {
  beginGuestSession,
  clearGuestSession,
  isGuestSession,
} from "@/lib/guest";
import { formatSupabaseError, getSupabase, hasSupabaseEnv } from "@/lib/supabase";

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [ready, setReady] = useState(!hasSupabaseEnv());
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!hasSupabaseEnv()) return;

    const supabase = getSupabase();
    let mounted = true;

    supabase.auth.getSession().then(async ({ data, error: sessionError }) => {
      if (!mounted) return;
      if (sessionError) {
        setError(formatSupabaseError(sessionError, "로그인 상태를 확인하지 못했습니다."));
      }
      const nextUser = data.session?.user ?? null;
      if (nextUser?.is_anonymous && !isGuestSession()) {
        await supabase.auth.signOut();
        if (!mounted) return;
        setUser(null);
      } else {
        if (nextUser && !nextUser.is_anonymous && isGuestSession()) {
          clearGuestSession();
        }
        setUser(nextUser);
      }
      setReady(true);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      const nextUser = session?.user ?? null;
      if (nextUser?.is_anonymous && !isGuestSession()) {
        setUser(null);
        window.setTimeout(() => void supabase.auth.signOut(), 0);
      } else {
        if (nextUser && !nextUser.is_anonymous && isGuestSession()) {
          clearGuestSession();
        }
        setUser(nextUser);
      }
      setReady(true);
      setBusy(false);
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  async function signInWithGoogle() {
    if (!hasSupabaseEnv()) {
      setError("Supabase 환경 변수가 없습니다.");
      return;
    }

    setBusy(true);
    setError("");
    const { error: oauthError } = await getSupabase().auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: window.location.href,
        queryParams: { prompt: "select_account" },
      },
    });

    if (oauthError) {
      setError(formatSupabaseError(oauthError, "Google 로그인에 실패했습니다."));
      setBusy(false);
    }
  }

  async function signInAsGuest() {
    if (!hasSupabaseEnv()) {
      setError("Supabase 환경 변수가 없습니다.");
      return;
    }

    beginGuestSession();
    setBusy(true);
    setError("");
    const { error: guestError } = await getSupabase().auth.signInAnonymously();

    if (guestError) {
      clearGuestSession();
      const code = "code" in guestError ? String(guestError.code) : "";
      const message = guestError.message.toLowerCase();
      setError(
        code === "anonymous_provider_disabled" ||
          message.includes("anonymous sign-ins are disabled")
          ? "Supabase Anonymous가 아직 저장되지 않았습니다. Sign In / Providers에서 켠 뒤 Save를 눌러 주세요."
          : formatSupabaseError(guestError, "Guest 로그인에 실패했습니다."),
      );
      setBusy(false);
      return;
    }

    window.location.replace("/");
  }

  async function signOut() {
    if (!hasSupabaseEnv()) return;
    const wasGuest = isGuestSession() || Boolean(user?.is_anonymous);
    if (wasGuest) clearGuestSession();
    setBusy(true);
    setError("");
    const { error: signOutError } = await getSupabase().auth.signOut();
    if (signOutError) {
      setError(formatSupabaseError(signOutError, "로그아웃에 실패했습니다."));
    }
    setBusy(false);
    if (wasGuest) window.location.replace("/");
  }

  return {
    user,
    ready,
    busy,
    error,
    enabled: hasSupabaseEnv(),
    isGuest: Boolean(user?.is_anonymous && isGuestSession()),
    signInWithGoogle,
    signInAsGuest,
    signOut,
  };
}
