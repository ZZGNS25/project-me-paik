"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import StoryCard from "@/components/StoryCard";
import { useConfirm } from "@/components/ConfirmDialog";
import { useAuth } from "@/hooks/useAuth";
import type { PlayController } from "@/hooks/usePlayState";
import { useStartFresh } from "@/hooks/useStartFresh";
import {
  deletePlayFromCloud,
  listPlaySessions,
  loadPlayById,
  type SessionSummary,
} from "@/lib/cloud";
import { storyTitle } from "@/lib/storyTitle";
import { deleteSettingWithCloud } from "@/lib/deleteSetting";
import { listLocalNamed } from "@/lib/settingFilters";

export default function HistoryPanel({ play }: { play: PlayController }) {
  const router = useRouter();
  const auth = useAuth();
  const [sessions, setSessions] = useState<SessionSummary[]>([]);
  const [error, setError] = useState("");
  const [busyId, setBusyId] = useState<string | null>(null);
  const confirm = useConfirm();
  const fresh = useStartFresh();

  useEffect(() => {
    if (!auth.user || auth.isGuest) return;
    listPlaySessions(auth.user.id)
      .then(setSessions)
      .catch((err: unknown) => {
        setError(err instanceof Error ? err.message : "기록을 불러오지 못했습니다.");
      });
  }, [auth.isGuest, auth.user]);

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
      router.push(next === "/setup" ? "/setup?focus=1" : next);
    } catch (err) {
      setError(err instanceof Error ? err.message : "열기에 실패했습니다.");
    } finally {
      setBusyId(null);
    }
  }

  function deleteSession(id: string) {
    confirm.ask({
      message: "클라우드에서 이 이야기를 지울까요?",
      confirmLabel: "삭제",
      danger: true,
      run: async () => {
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
      },
    });
  }

  function deleteLocal(id: string, cloudSessionId: string | null) {
    confirm.ask({
      message: "이 브라우저에서 이 이야기를 지울까요?",
      confirmLabel: "삭제",
      danger: true,
      run: async () => {
        await deleteSettingWithCloud(play.deleteSetting, { id, cloudSessionId });
        if (cloudSessionId) {
          setSessions((current) => current.filter((item) => item.id !== cloudSessionId));
        }
      },
    });
  }

  const localStories = listLocalNamed(play.settings);
  const localCloudIds = new Set(
    localStories
      .map((item) => item.cloudSessionId)
      .filter((id): id is string => Boolean(id)),
  );
  const remoteOnly = sessions.filter((item) => !localCloudIds.has(item.id));

  return (
    <>
    <div className="page-scroll mx-auto w-full max-w-2xl px-6 py-12">
      <div className="flex items-end justify-between gap-3">
        <div>
          <p className="label-caps">내 기록</p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight">이어 둔 이야기</h1>
        </div>
        <button
          type="button"
          className="btn-secondary"
          onClick={fresh.startStory}
        >
          새 시나리오
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
            <StoryCard
              key={item.id}
              variant="history-card"
              name={storyTitle(item)}
              oneLiner={item.character.oneLiner}
              photo={item.character.photo}
              meta={
                item.chatLog.length > 0
                  ? `${item.turnCount}턴`
                  : "아직 시작 전"
              }
              onRename={(title) => play.renameSetting(item.id, title)}
              actions={[
                {
                  label: item.chatLog.length > 0 ? "이어가기" : "시작하기",
                  kind: "primary",
                  onClick: () => {
                    play.selectSetting(item.id);
                    router.push("/chat");
                  },
                },
                {
                  label: "다듬기",
                  kind: "secondary",
                  onClick: () => {
                    play.selectSetting(item.id);
                    router.push(`/setup?id=${encodeURIComponent(item.id)}`);
                  },
                },
                ...(play.settings.length > 1
                  ? [
                      {
                        label: "삭제",
                        kind: "danger" as const,
                        onClick: () => void deleteLocal(item.id, item.cloudSessionId),
                      },
                    ]
                  : []),
              ]}
            />
          ))}
        </div>
      )}

      <p className="label-caps mt-10">클라우드</p>
      {error ? <p className="alert-error mt-3">{error}</p> : null}
      <div className="mt-3 space-y-3">
        {auth.isGuest ? (
          <p className="text-sm text-[var(--ink-dim)]">
            Guest는 클라우드에 남기지 않습니다. 브라우저를 닫으면 모든 기록이
            사라집니다.
          </p>
        ) : sessions.length === 0 ? (
          <p className="text-sm text-[var(--ink-dim)]">
            로그인한 이야기는 여기에 자동으로 쌓입니다.
          </p>
        ) : remoteOnly.length === 0 ? (
          <p className="text-sm text-[var(--ink-dim)]">
            클라우드 이야기는 이미 이 브라우저에 있습니다.
          </p>
        ) : (
          remoteOnly.map((session) => (
            <StoryCard
              key={session.id}
              variant="history-card"
              name={session.characterName}
              oneLiner={session.oneLiner}
              photo={session.photo}
              meta={`${session.turnCount}턴${busyId === session.id ? " · 여는 중…" : ""}`}
              actions={[
                {
                  label: "이어가기",
                  kind: "primary",
                  disabled: busyId === session.id,
                  onClick: () => void openSession(session.id, "/chat"),
                },
                {
                  label: "다듬기",
                  kind: "secondary",
                  disabled: busyId === session.id,
                  onClick: () => void openSession(session.id, "/setup"),
                },
                {
                  label: "삭제",
                  kind: "danger",
                  disabled: busyId === session.id,
                  onClick: () => void deleteSession(session.id),
                },
              ]}
            />
          ))
        )}
      </div>
    </div>
    {confirm.dialog}
    {fresh.dialog}
    </>
  );
}
