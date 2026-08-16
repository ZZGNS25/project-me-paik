"use client";

import { useEffect, useState } from "react";
import type { User } from "@supabase/supabase-js";
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

    supabase.auth.getSession().then(({ data, error: sessionError }) => {
      if (!mounted) return;
      if (sessionError) {
        setError(formatSupabaseError(sessionError, "로그인 상태를 확인하지 못했습니다."));
      }
      setUser(data.session?.user ?? null);
      setReady(true);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
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

  async function signOut() {
    if (!hasSupabaseEnv()) return;
    setBusy(true);
    setError("");
    const { error: signOutError } = await getSupabase().auth.signOut();
    if (signOutError) {
      setError(formatSupabaseError(signOutError, "로그아웃에 실패했습니다."));
    }
    setBusy(false);
  }

  return {
    user,
    ready,
    busy,
    error,
    enabled: hasSupabaseEnv(),
    signInWithGoogle,
    signOut,
  };
}
