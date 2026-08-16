"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { usePlayState } from "@/hooks/usePlayState";
import { listPlaySessions, loadPlayById, type SessionSummary } from "@/lib/cloud";

export default function HistoryPanel() {
  const router = useRouter();
  const auth = useAuth();
  const play = usePlayState();
  const [sessions, setSessions] = useState<SessionSummary[]>([]);
  const [error, setError] = useState("");
  const [busyId, setBusyId] = useState<string | null>(null);

  useEffect(() => {
    if (!auth.user) return;
    listPlaySessions(auth.user.id)
      .then(setSessions)
      .catch((err: unknown) => {
        setError(err instanceof Error ? err.message : "기록을 불러오지 못했습니다.");
      });
  }, [auth.user]);

  async function openSession(id: string) {
    setBusyId(id);
    setError("");
    try {
      const loaded = await loadPlayById(id);
      if (!loaded) throw new Error("세션을 찾지 못했습니다.");
      play.hydrateFromCloud(loaded);
      router.push("/chat");
    } catch (err) {
      setError(err instanceof Error ? err.message : "열기에 실패했습니다.");
    } finally {
      setBusyId(null);
    }
  }

  const local = play.state.character.name
    ? {
        name: play.state.character.name,
        turns: play.state.turnCount,
        lines: play.state.chatLog.length,
      }
    : null;

  return (
    <div className="mx-auto w-full max-w-2xl px-6 py-12">
      <div className="flex items-end justify-between gap-3">
        <div>
          <p className="label-caps">내 기록</p>
          <h1 className="mt-2 text-3xl font-semibold">이어 둔 이야기</h1>
        </div>
        <button
          type="button"
          className="btn-secondary"
          onClick={() => {
            play.createSetting();
            router.push("/setup");
          }}
        >
          설정 추가
        </button>
      </div>

      {local ? (
        <button
          type="button"
          className="history-card mt-8 w-full text-left"
          onClick={() => router.push(local.lines > 0 ? "/chat" : "/setup")}
        >
          <p className="text-xs text-[var(--blue-soft)]">이 브라우저</p>
          <p className="mt-1 text-lg font-semibold">{local.name}</p>
          <p className="mt-1 text-sm text-[var(--ink-dim)]">
            {local.turns}턴 · 메시지 {local.lines}개
          </p>
        </button>
      ) : (
        <p className="mt-8 text-sm text-[var(--ink-dim)]">
          아직 이 브라우저에 저장된 이야기가 없습니다.
        </p>
      )}

      <p className="label-caps mt-10">클라우드</p>
      {error ? <p className="alert-error mt-3">{error}</p> : null}
      <div className="mt-3 space-y-3">
        {sessions.length === 0 ? (
          <p className="text-sm text-[var(--ink-dim)]">
            채팅 화면에서 클라우드 저장을 누르면 여기에 쌓입니다.
          </p>
        ) : (
          sessions.map((session) => (
            <button
              key={session.id}
              type="button"
              className="history-card w-full text-left"
              disabled={busyId === session.id}
              onClick={() => void openSession(session.id)}
            >
              <p className="text-lg font-semibold">{session.characterName}</p>
              <p className="mt-1 text-sm text-[var(--ink-soft)]">
                {session.oneLiner || "한 줄 소개 없음"}
              </p>
              <p className="mt-2 text-xs text-[var(--ink-dim)]">
                {session.turnCount}턴
                {busyId === session.id ? " · 여는 중…" : ""}
              </p>
            </button>
          ))
        )}
      </div>
    </div>
  );
}
