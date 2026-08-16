"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import ProfileCard from "@/components/ProfileCard";
import { useAuth } from "@/hooks/useAuth";
import type { PlayController } from "@/hooks/usePlayState";
import {
  deletePlayFromCloud,
  listPlaySessions,
  loadPlayById,
  type SessionSummary,
} from "@/lib/cloud";

export default function HistoryPanel({ play }: { play: PlayController }) {
  const router = useRouter();
  const auth = useAuth();
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

  async function openSession(id: string, next: "/chat" | "/setup") {
    setBusyId(id);
    setError("");
    try {
      const loaded = await loadPlayById(id);
      if (!loaded?.cloudSessionId) throw new Error("세션을 찾지 못했습니다.");
      play.openFromCloud({
        ...loaded,
        cloudSessionId: loaded.cloudSessionId,
      });
      router.push(next);
    } catch (err) {
      setError(err instanceof Error ? err.message : "열기에 실패했습니다.");
    } finally {
      setBusyId(null);
    }
  }

  async function deleteSession(id: string) {
    if (!window.confirm("클라우드에서 이 이야기를 지울까요?")) return;
    setBusyId(id);
    setError("");
    try {
      await deletePlayFromCloud(id);
      play.unlinkCloudSession(id);
      setSessions((current) => current.filter((item) => item.id !== id));
    } catch (err) {
      setError(err instanceof Error ? err.message : "삭제에 실패했습니다.");
    } finally {
      setBusyId(null);
    }
  }

  async function deleteLocal(id: string, cloudSessionId: string | null) {
    if (!window.confirm("이 브라우저에서 이 이야기를 지울까요?")) return;
    if (cloudSessionId) {
      try {
        await deletePlayFromCloud(cloudSessionId);
        setSessions((current) => current.filter((item) => item.id !== cloudSessionId));
      } catch {
        // 로컬은 지운다. 클라우드가 남아 있으면 아래 목록에서 다시 지울 수 있다.
      }
    }
    play.deleteSetting(id);
  }

  const localStories = play.settings.filter((item) => item.character.name.trim());
  const localCloudIds = new Set(
    localStories
      .map((item) => item.cloudSessionId)
      .filter((id): id is string => Boolean(id)),
  );
  const remoteOnly = sessions.filter((item) => !localCloudIds.has(item.id));

  return (
    <div className="page-scroll mx-auto w-full max-w-2xl px-6 py-12">
      <div className="flex items-end justify-between gap-3">
        <div>
          <p className="label-caps">내 기록</p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight">이어 둔 이야기</h1>
        </div>
        <button
          type="button"
          className="btn-secondary"
          onClick={() => {
            play.createSetting();
            router.push("/setup");
          }}
        >
          새 설정
        </button>
      </div>

      <p className="label-caps mt-8">이 브라우저</p>
      {localStories.length === 0 ? (
        <p className="mt-3 text-sm text-[var(--ink-dim)]">
          아직 이 브라우저에 저장된 이야기가 없습니다.
        </p>
      ) : (
        <div className="mt-3 space-y-3">
          {localStories.map((item) => (
            <div key={item.id} className="history-card">
              <ProfileCard
                name={item.character.name}
                oneLiner={item.character.oneLiner}
                photo={item.character.photo}
                meta={
                  item.chatLog.length > 0
                    ? `${item.turnCount}턴`
                    : "아직 시작 전"
                }
              />
              <div className="mt-3 flex flex-wrap gap-2">
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => {
                    play.selectSetting(item.id);
                    router.push("/setup");
                  }}
                >
                  설정
                </button>
                <button
                  type="button"
                  className="btn-primary"
                  onClick={() => {
                    play.selectSetting(item.id);
                    router.push("/chat");
                  }}
                >
                  {item.chatLog.length > 0 ? "대화 이어가기" : "대화 시작"}
                </button>
                {play.settings.length > 1 ? (
                  <button
                    type="button"
                    className="btn-danger"
                    onClick={() => void deleteLocal(item.id, item.cloudSessionId)}
                  >
                    삭제
                  </button>
                ) : null}
              </div>
            </div>
          ))}
        </div>
      )}

      <p className="label-caps mt-10">클라우드</p>
      {error ? <p className="alert-error mt-3">{error}</p> : null}
      <div className="mt-3 space-y-3">
        {sessions.length === 0 ? (
          <p className="text-sm text-[var(--ink-dim)]">
            로그인한 이야기는 여기에 자동으로 쌓입니다.
          </p>
        ) : remoteOnly.length === 0 ? (
          <p className="text-sm text-[var(--ink-dim)]">
            클라우드 이야기는 이미 이 브라우저에 있습니다.
          </p>
        ) : (
          remoteOnly.map((session) => (
            <div key={session.id} className="history-card">
              <ProfileCard
                name={session.characterName}
                oneLiner={session.oneLiner}
                photo={session.photo}
                meta={`${session.turnCount}턴${busyId === session.id ? " · 여는 중…" : ""}`}
              />
              <div className="mt-3 flex flex-wrap gap-2">
                <button
                  type="button"
                  className="btn-secondary"
                  disabled={busyId === session.id}
                  onClick={() => void openSession(session.id, "/setup")}
                >
                  설정
                </button>
                <button
                  type="button"
                  className="btn-primary"
                  disabled={busyId === session.id}
                  onClick={() => void openSession(session.id, "/chat")}
                >
                  대화 이어가기
                </button>
                <button
                  type="button"
                  className="btn-danger"
                  disabled={busyId === session.id}
                  onClick={() => void deleteSession(session.id)}
                >
                  삭제
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
