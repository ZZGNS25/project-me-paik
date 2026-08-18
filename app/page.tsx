"use client";

import { Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import AppFrame from "@/components/AppFrame";
import LoginField from "@/components/LoginField";
import LoginGate from "@/components/LoginGate";
import GuidePanel from "@/components/GuidePanel";
import HistoryPanel from "@/components/HistoryPanel";
import PageShell from "@/components/PageShell";
import ProfilesPanel from "@/components/ProfilesPanel";
import StoryCard from "@/components/StoryCard";
import { useConfirm } from "@/components/ConfirmDialog";
import { usePlay } from "@/hooks/PlayProvider";
import { useAuth } from "@/hooks/useAuth";
import { deleteSettingWithCloud } from "@/lib/deleteSetting";
import { timeAgo } from "@/lib/korean";
import { previewText } from "@/lib/parseMessage";
import { listOngoing, listWaiting } from "@/lib/settingFilters";
import { storyTitle } from "@/lib/storyTitle";
import type { SettingRecord } from "@/lib/types";

function HomeBody() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const auth = useAuth();
  const play = usePlay();
  const view = searchParams.get("view");
  const confirm = useConfirm();

  if (!auth.ready || !play.ready) {
    return (
      <PageShell>
        <p className="mono-readout text-sm text-[var(--ink-dim)]">불러오는 중…</p>
      </PageShell>
    );
  }

  if (!auth.enabled || !auth.user) {
    return (
      <div className="login-gate">
        <LoginField />
        <LoginGate
          enabled={auth.enabled}
          busy={auth.busy}
          error={auth.error}
          onGoogle={auth.signInWithGoogle}
          onGuest={auth.signInAsGuest}
        />
      </div>
    );
  }

  function openStory(setting: SettingRecord) {
    play.selectSetting(setting.id);
    router.push("/chat");
  }

  async function removeStory(setting: SettingRecord) {
    await deleteSettingWithCloud(play.deleteSetting, setting);
  }

  const ongoing = listOngoing(play.settings);
  const waiting = listWaiting(play.settings);

  return (
    <>
    <AppFrame>
      {view === "guide" ? (
        <GuidePanel />
      ) : view === "history" ? (
        <HistoryPanel play={play} />
      ) : view === "profiles" ? (
        <ProfilesPanel
          play={play}
          returnHref={
            searchParams.get("from") === "chat"
              ? "/chat"
              : searchParams.get("from") === "setup"
                ? "/setup"
                : null
          }
          editId={searchParams.get("edit")}
          startNew={searchParams.get("new") === "1"}
        />
      ) : (
        <div className="page-scroll mx-auto w-full max-w-3xl px-6 py-10">
          <div className="page-hero">
            <p className="label-caps">이야기</p>
            <h1 className="mt-2 text-3xl font-semibold">
              {ongoing.length > 0 ? "이어서 읽을 대화" : "아직 이은 대화가 없습니다"}
            </h1>
            <p className="mt-3 text-sm text-[var(--ink-dim)]">
              {ongoing.length > 0
                ? `${ongoing.length}개의 대화를 이었습니다. 세계와 역할은 시나리오에서 고칩니다.`
                : "시나리오에서 세계를 고르면, 이은 대화가 여기에 모입니다."}
            </p>
          </div>

          {ongoing.length > 0 ? (
            <section className="mt-8 space-y-3">
              <p className="label-caps">이어가기</p>
              {ongoing.map((item) => {
                const last = item.chatLog[item.chatLog.length - 1];
                const when = timeAgo(item.updatedAt);
                return (
                <StoryCard
                  key={item.id}
                  name={storyTitle(item)}
                  oneLiner={item.character.oneLiner}
                  photo={item.character.photo}
                  meta={`${item.turnCount}턴${when ? ` · ${when}` : ""}`}
                  peek={last ? previewText(last.content) : undefined}
                  onRename={(title) => play.renameSetting(item.id, title)}
                  actions={[
                    {
                      label: "이어가기",
                      kind: "primary",
                      onClick: () => openStory(item),
                    },
                    ...(play.settings.length > 1
                      ? [
                          {
                            label: "삭제",
                            kind: "danger" as const,
                            onClick: () =>
                              confirm.ask({
                                message: "이 이야기를 지울까요?",
                                confirmLabel: "삭제",
                                danger: true,
                                run: () => void removeStory(item),
                              }),
                          },
                        ]
                      : []),
                  ]}
                />
                );
              })}
            </section>
          ) : (
            <div className="mt-8">
              <button
                type="button"
                className="btn-primary"
                onClick={() => router.push("/setup")}
              >
                시나리오로
              </button>
            </div>
          )}

          {waiting.length > 0 ? (
            <section className="mt-8 space-y-3">
              <p className="label-caps">시작 전</p>
              {waiting.map((item) => (
                <StoryCard
                  key={item.id}
                  name={storyTitle(item)}
                  oneLiner={item.character.oneLiner}
                  photo={item.character.photo}
                  meta="시작 전"
                  onRename={(title) => play.renameSetting(item.id, title)}
                  actions={[
                    {
                      label: "시작하기",
                      kind: "primary",
                      onClick: () => openStory(item),
                    },
                    {
                      label: "다듬기",
                      kind: "secondary",
                      onClick: () => {
                        play.selectSetting(item.id);
                        router.push(`/setup?id=${encodeURIComponent(item.id)}`);
                      },
                    },
                  ]}
                />
              ))}
            </section>
          ) : null}
        </div>
      )}
    </AppFrame>
    {confirm.dialog}
    </>
  );
}

export default function HomePage() {
  return (
    <Suspense
      fallback={
        <PageShell>
          <p className="mono-readout text-sm text-[var(--ink-dim)]">불러오는 중…</p>
        </PageShell>
      }
    >
      <HomeBody />
    </Suspense>
  );
}
