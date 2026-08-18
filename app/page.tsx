"use client";

import { Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import AppFrame from "@/components/AppFrame";
import LoginField from "@/components/LoginField";
import LoginGate from "@/components/LoginGate";
import GuidePanel from "@/components/GuidePanel";
import HistoryPanel from "@/components/HistoryPanel";
import PageShell from "@/components/PageShell";
import ProfileCard from "@/components/ProfileCard";
import ProfilesPanel from "@/components/ProfilesPanel";
import { useConfirm } from "@/components/ConfirmDialog";
import { usePlay } from "@/hooks/PlayProvider";
import { useAuth } from "@/hooks/useAuth";
import { deletePlayFromCloud } from "@/lib/cloud";
import { timeAgo } from "@/lib/korean";
import { previewText } from "@/lib/parseMessage";
import { isPresetNamed } from "@/lib/presets";
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
        />
      </div>
    );
  }

  function openStory(setting: SettingRecord) {
    play.selectSetting(setting.id);
    router.push("/chat");
  }

  async function removeStory(setting: SettingRecord) {
    if (setting.cloudSessionId) {
      try {
        await deletePlayFromCloud(setting.cloudSessionId);
      } catch {
        // 로컬은 지운다.
      }
    }
    play.deleteSetting(setting.id);
  }

  const ongoing = play.settings
    .filter((item) => item.character.name.trim() && item.chatLog.length > 0)
    .slice()
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  const waiting = play.settings
    .filter(
      (item) =>
        item.character.name.trim() &&
        item.chatLog.length === 0 &&
        !isPresetNamed(item.character.name),
    )
    .slice()
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));

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
                <div key={item.id} className="story-card">
                  <ProfileCard
                    name={storyTitle(item)}
                    oneLiner={item.character.oneLiner}
                    photo={item.character.photo}
                    meta={`${item.turnCount}턴${when ? ` · ${when}` : ""}`}
                    onRename={(title) => play.renameSetting(item.id, title)}
                  />
                  {last ? (
                    <p className="story-peek">{previewText(last.content)}</p>
                  ) : null}
                  <div className="story-actions">
                    <button
                      type="button"
                      className="btn-primary"
                      onClick={() => openStory(item)}
                    >
                      이어가기
                    </button>
                    {play.settings.length > 1 ? (
                      <button
                        type="button"
                        className="btn-danger"
                        onClick={() =>
                          confirm.ask({
                            message: "이 이야기를 지울까요?",
                            confirmLabel: "삭제",
                            danger: true,
                            run: () => void removeStory(item),
                          })
                        }
                      >
                        삭제
                      </button>
                    ) : null}
                  </div>
                </div>
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
                <div key={item.id} className="story-card">
                  <ProfileCard
                    name={storyTitle(item)}
                    oneLiner={item.character.oneLiner}
                    photo={item.character.photo}
                    meta="시작 전"
                    onRename={(title) => play.renameSetting(item.id, title)}
                  />
                  <div className="story-actions">
                    <button
                      type="button"
                      className="btn-primary"
                      onClick={() => openStory(item)}
                    >
                      시작
                    </button>
                    <button
                      type="button"
                      className="btn-secondary"
                      onClick={() => {
                        play.selectSetting(item.id);
                        router.push(`/setup?id=${encodeURIComponent(item.id)}`);
                      }}
                    >
                      다듬기
                    </button>
                  </div>
                </div>
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
