"use client";

import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import AppFrame from "@/components/AppFrame";
import AvatarCircle from "@/components/AvatarCircle";
import BrandLockup from "@/components/BrandLockup";
import GuidePanel from "@/components/GuidePanel";
import HistoryPanel from "@/components/HistoryPanel";
import PageShell from "@/components/PageShell";
import PersonaPicker from "@/components/PersonaPicker";
import ProfileCard from "@/components/ProfileCard";
import ProfilesPanel from "@/components/ProfilesPanel";
import { useConfirm } from "@/components/ConfirmDialog";
import { usePlay } from "@/hooks/PlayProvider";
import { useAuth } from "@/hooks/useAuth";
import { useStartFresh } from "@/hooks/useStartFresh";
import { deletePlayFromCloud } from "@/lib/cloud";
import { WORLD_PRESETS, type PresetId } from "@/lib/presets";
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
  const [pendingStart, setPendingStart] = useState<{
    presetId: PresetId;
    next: "/chat" | "/setup";
  } | null>(null);

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
          <p className="login-kicker">듣고, 잇고, 연기하다.</p>
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

  const ongoing = play.settings.filter(
    (item) => item.character.name.trim() && item.chatLog.length > 0,
  );

  function goPreset(
    presetId: PresetId,
    next: "/chat" | "/setup",
    personaId?: string | null,
  ) {
    const preset = WORLD_PRESETS.find((item) => item.id === presetId);
    if (!preset) return;
    const unused = play.settings.find(
      (item) =>
        item.character.name.trim() === preset.character.name &&
        item.chatLog.length === 0,
    );
    if (unused) {
      play.selectSetting(unused.id);
      if (personaId) play.applyPersona(personaId);
    } else {
      play.applyPreset(presetId, personaId);
    }
    router.push(next);
  }

  function startPreset(presetId: PresetId, next: "/chat" | "/setup") {
    if (play.personas.length > 0) {
      setPendingStart({ presetId, next });
      return;
    }
    goPreset(presetId, next);
  }

  return (
    <>
    <AppFrame>
      {view === "guide" ? (
        <GuidePanel />
      ) : view === "history" ? (
        <HistoryPanel play={play} />
      ) : view === "profiles" ? (
        <ProfilesPanel play={play} />
      ) : (
        <div className="page-scroll mx-auto w-full max-w-3xl px-6 py-10">
          <div className="page-hero">
            <p className="label-caps">이야기</p>
            <h1 className="mt-2 text-3xl font-semibold">어떤 이야기를 이을까요?</h1>
            <p className="mt-3 text-sm text-[var(--ink-dim)]">
              하던 이야기는 위에서, 새 이야기는 아래 얼굴에서.
            </p>
          </div>

          {ongoing.length > 0 ? (
            <section className="mt-8 space-y-3">
              <p className="label-caps">이어가기</p>
              {ongoing.map((item) => (
                <div key={item.id} className="story-card">
                  <ProfileCard
                    name={storyTitle(item)}
                    oneLiner={item.character.oneLiner}
                    photo={item.character.photo}
                    meta={`${item.turnCount}턴`}
                    onRename={(title) => play.renameSetting(item.id, title)}
                  />
                  <div className="story-actions">
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
              ))}
            </section>
          ) : null}

          <section className="mt-8">
            <p className="label-caps">시작하기</p>
            <div className="cast-grid">
              {WORLD_PRESETS.map((preset) => (
                <article key={preset.id} className="cast-card">
                  <button
                    type="button"
                    className="cast-start"
                    onClick={() => startPreset(preset.id, "/chat")}
                  >
                    <AvatarCircle
                      src={preset.character.photo}
                      name={preset.character.name}
                      size="lg"
                    />
                    <p className="cast-world">{preset.label}</p>
                    <h2 className="cast-name">{preset.character.name}</h2>
                    <p className="cast-blurb">{preset.character.oneLiner}</p>
                  </button>
                  <button
                    type="button"
                    className="btn-quiet"
                    onClick={() => startPreset(preset.id, "/setup")}
                  >
                    설정
                  </button>
                </article>
              ))}
            </div>
          </section>

          <div className="mt-8">
            <button
              type="button"
              className="btn-quiet"
              onClick={fresh.startStory}
            >
              내 세계관으로 만들기
            </button>
          </div>
        </div>
      )}
    </AppFrame>
    {confirm.dialog}
    {fresh.dialog}
    {pendingStart ? (
      <PersonaPicker
        personas={play.personas}
        selectedId={play.lastPersonaId}
        skipLabel="없이 시작"
        onPick={(id) => {
          const pending = pendingStart;
          setPendingStart(null);
          goPreset(pending.presetId, pending.next, id);
        }}
        onSkip={() => {
          const pending = pendingStart;
          setPendingStart(null);
          goPreset(pending.presetId, pending.next, null);
        }}
        onCancel={() => setPendingStart(null)}
      />
    ) : null}
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
