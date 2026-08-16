"use client";

import { Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import AppFrame from "@/components/AppFrame";
import BrandLockup from "@/components/BrandLockup";
import GuidePanel from "@/components/GuidePanel";
import HistoryPanel from "@/components/HistoryPanel";
import PageShell from "@/components/PageShell";
import ProfileCard from "@/components/ProfileCard";
import { usePlay } from "@/hooks/PlayProvider";
import { useAuth } from "@/hooks/useAuth";
import { withWaGwa } from "@/lib/korean";
import type { SettingRecord } from "@/lib/types";

function HomeBody() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const auth = useAuth();
  const play = usePlay();
  const view = searchParams.get("view");

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
        <main className="paper-card login-card mt-10 px-7 py-10">
          <BrandLockup />
          <p className="login-kicker">듣고, 잇고, 연기하다.</p>
          <h1 className="mt-4 text-4xl font-semibold tracking-tight">
            이야기가 끊기지 않게
          </h1>
          <p className="mt-4 text-base leading-relaxed text-[var(--ink-soft)]">
            캐릭터 설정이 이어지는 개인용 스토리 롤플. EarRole은 귀를 열고, 역할을
            잇습니다.
          </p>
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

  const stories = play.settings.filter((item) => item.character.name.trim());
  const ongoing = stories.filter((item) => item.chatLog.length > 0);
  const notStarted = stories.filter((item) => item.chatLog.length === 0);

  return (
    <AppFrame>
      {view === "guide" ? (
        <GuidePanel />
      ) : view === "history" ? (
        <HistoryPanel play={play} />
      ) : (
        <div className="page-scroll mx-auto w-full max-w-2xl px-6 py-10">
          <div className="page-hero">
            <p className="label-caps">이야기</p>
            <h1 className="mt-2 text-3xl font-semibold">어떤 이야기를 이을까요?</h1>
            <p className="mt-3 text-sm text-[var(--ink-dim)]">
              진행 중인 건 여기서 바로 이어가고, 새 말은 채팅 화면에서 씁니다.
            </p>
          </div>

          {ongoing.length > 0 ? (
            <section className="mt-8 space-y-3">
              <p className="label-caps">이어가기</p>
              {ongoing.map((item) => (
                <div key={item.id} className="story-card">
                  <ProfileCard
                    name={item.character.name}
                    oneLiner={item.character.oneLiner}
                    photo={item.character.photo}
                    meta={`${item.turnCount}턴 · ${withWaGwa(item.character.name)} 이어가 볼까요?`}
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
                      onClick={() => openStory(item)}
                    >
                      대화 이어가기
                    </button>
                  </div>
                </div>
              ))}
            </section>
          ) : null}

          {notStarted.length > 0 ? (
            <section className="mt-8 space-y-3">
              <p className="label-caps">시작하기</p>
              {notStarted.map((item) => (
                <div key={item.id} className="story-card">
                  <ProfileCard
                    name={item.character.name}
                    oneLiner={item.character.oneLiner}
                    photo={item.character.photo}
                    meta={`${withWaGwa(item.character.name)} 시작해볼까요?`}
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
                      onClick={() => openStory(item)}
                    >
                      대화 시작
                    </button>
                  </div>
                </div>
              ))}
            </section>
          ) : null}

          {stories.length === 0 ? (
            <p className="mt-8 text-sm text-[var(--ink-dim)]">
              아직 만든 이야기가 없습니다. 설정에서 예시 세계관을 고르거나 프로필을
              적어 주세요.
            </p>
          ) : null}

          <button
            type="button"
            className="btn-secondary mt-8 w-full"
            onClick={() => router.push("/setup")}
          >
            설정으로
          </button>
        </div>
      )}
    </AppFrame>
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
