"use client";

import { Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import AppFrame from "@/components/AppFrame";
import AvatarCircle from "@/components/AvatarCircle";
import BrandLockup from "@/components/BrandLockup";
import GuidePanel from "@/components/GuidePanel";
import HistoryPanel from "@/components/HistoryPanel";
import PageShell from "@/components/PageShell";
import ProfileCard from "@/components/ProfileCard";
import ProfilesPanel from "@/components/ProfilesPanel";
import { useConfirm } from "@/components/ConfirmDialog";
import { usePlay } from "@/hooks/PlayProvider";
import { useAuth } from "@/hooks/useAuth";
import { useStartFresh } from "@/hooks/useStartFresh";
import { deletePlayFromCloud } from "@/lib/cloud";
import { timeAgo } from "@/lib/korean";
import { previewText } from "@/lib/parseMessage";
import { WORLD_PRESETS } from "@/lib/presets";
import { SITE_TAGLINE } from "@/lib/site";
import { storyTitle } from "@/lib/storyTitle";
import type { SettingRecord } from "@/lib/types";

function HomeBody() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const auth = useAuth();
  const play = usePlay();
  const view = searchParams.get("view");
  const confirm = useConfirm();
  const fresh = useStartFresh();

  if (!auth.ready || !play.ready) {
    return (
      <PageShell>
        <p className="mono-readout text-sm text-[var(--ink-dim)]">불러오는 중…</p>
      </PageShell>
    );
  }

  if (!auth.enabled || !auth.user) {
    return (
      <PageShell>
        <main className="paper-card login-card mt-8 px-7 py-10">
          <BrandLockup />
          <p className="login-kicker">{SITE_TAGLINE}</p>
          <h1 className="mt-4 text-4xl font-semibold tracking-tight">
            이야기가 끊기지 않게
          </h1>
          <p className="mt-4 text-base leading-relaxed text-[var(--ink-soft)]">
            캐릭터 설정이 이어지는 개인용 스토리 롤플.
          </p>
          <div className="login-cast">
            {WORLD_PRESETS.map((preset) => (
              <div key={preset.id} className="login-cast-item">
                <AvatarCircle
                  src={preset.character.photo}
                  name={preset.character.name}
                  size="md"
                />
                <p className="login-cast-name">{preset.character.name}</p>
              </div>
            ))}
          </div>
          {!auth.enabled ? (
            <p className="alert-error mt-8">
              Supabase 환경 변수가 없어 로그인할 수 없습니다.
            </p>
          ) : (
            <>
              <button
                type="button"
                className="btn-primary mt-8 w-full"
                onClick={auth.signInWithGoogle}
                disabled={auth.busy}
              >
                {auth.busy ? "연결 중…" : "Google로 시작하기"}
              </button>
              {auth.error ? <p className="alert-error mt-4">{auth.error}</p> : null}
            </>
          )}
        </main>
      </PageShell>
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
    .filter((item) => item.character.name.trim() && item.chatLog.length === 0)
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
                : "시나리오에서 세계를 고르면, 그 대화가 여기에 쌓입니다."}
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
            <section className="story-empty mt-8">
              <p className="text-sm leading-relaxed text-[var(--ink-soft)]">
                얼굴을 누르면 시나리오로 갑니다. 거기서 세계를 고르거나 직접 만들 수 있습니다.
              </p>
              <div className="login-cast">
                {WORLD_PRESETS.map((preset) => (
                  <button
                    key={preset.id}
                    type="button"
                    className="story-start-face"
                    onClick={() => router.push("/setup")}
                  >
                    <AvatarCircle
                      src={preset.character.photo}
                      name={preset.character.name}
                      size="md"
                    />
                    <p className="login-cast-name">{preset.character.name}</p>
                    <p className="story-start-blurb">{preset.blurb}</p>
                  </button>
                ))}
              </div>
              <div className="mt-6 flex flex-wrap gap-2">
                <button
                  type="button"
                  className="btn-primary"
                  onClick={() => router.push("/setup")}
                >
                  시나리오
                </button>
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={fresh.startStory}
                >
                  새 시나리오
                </button>
              </div>
            </section>
          )}

          {waiting.length > 0 ? (
            <section className="mt-8 space-y-3">
              <p className="label-caps">아직 말 없는 시나리오</p>
              {waiting.map((item) => (
                <div key={item.id} className="story-card">
                  <ProfileCard
                    name={storyTitle(item)}
                    oneLiner={item.character.oneLiner}
                    photo={item.character.photo}
                    meta="채팅 전"
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
    {fresh.dialog}
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
