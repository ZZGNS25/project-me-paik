"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import AppFrame from "@/components/AppFrame";
import AvatarCircle from "@/components/AvatarCircle";
import CastEditor from "@/components/CastEditor";
import CharField from "@/components/CharField";
import MemoryPanel from "@/components/MemoryPanel";
import PageShell from "@/components/PageShell";
import { useAuth } from "@/hooks/useAuth";
import { usePlayState } from "@/hooks/usePlayState";
import { FIELD_LIMITS, WORLD_PLACEHOLDER } from "@/lib/constants";
import { requestGenerate } from "@/lib/geminiClient";
import { WORLD_PRESETS } from "@/lib/presets";
import type { SettingRecord } from "@/lib/types";

function isPresetNamed(setting: SettingRecord) {
  const name = setting.character.name.trim();
  return WORLD_PRESETS.some((preset) => preset.character.name === name);
}

function isUnusedBlank(setting: SettingRecord) {
  return (
    !isPresetNamed(setting) &&
    !setting.character.name.trim() &&
    !setting.character.photo &&
    !setting.worldSetting.trim() &&
    setting.chatLog.length === 0
  );
}

function SetupBody() {
  const router = useRouter();
  const auth = useAuth();
  const play = usePlayState();
  const [compressing, setCompressing] = useState(false);
  const [error, setError] = useState("");
  const [picked, setPicked] = useState(false);

  useEffect(() => {
    if (auth.ready && !auth.user) {
      router.replace("/");
    }
  }, [auth.ready, auth.user, router]);

  if (!play.ready || !auth.ready) {
    return (
      <PageShell>
        <p className="mono-readout text-sm text-[var(--ink-dim)]">불러오는 중…</p>
      </PageShell>
    );
  }

  const canStart = Boolean(play.state.character.name.trim());
  const storyStarted = play.state.chatLog.length > 0;
  const editorOpen = picked || canStart || storyStarted;
  const activePreset = WORLD_PRESETS.find(
    (item) => item.character.name === play.state.character.name.trim(),
  );
  const customSettings = play.settings.filter((setting) => {
    if (isPresetNamed(setting)) return false;
    const onlyHiddenStarter =
      !picked &&
      play.settings.filter((item) => !isPresetNamed(item)).length === 1 &&
      isUnusedBlank(setting);
    return !onlyHiddenStarter;
  });

  function addScenario() {
    const unusedBlank = play.settings.find(isUnusedBlank);
    if (unusedBlank && customSettings.length === 0) {
      play.selectSetting(unusedBlank.id);
    } else {
      play.createSetting();
    }
    setPicked(true);
  }

  async function compressMemory() {
    if (compressing || play.state.shortTermBuffer.length === 0) return;
    setCompressing(true);
    setError("");
    try {
      const summary = await requestGenerate("summary", play.state);
      play.applySummary(summary);
    } catch (err) {
      setError(err instanceof Error ? err.message : "요약을 만들지 못했습니다.");
    } finally {
      setCompressing(false);
    }
  }

  return (
    <AppFrame>
      <form
        className="mx-auto w-full max-w-3xl space-y-6 overflow-y-auto px-6 py-8"
        onSubmit={(event) => {
          event.preventDefault();
          if (canStart) router.push("/chat");
        }}
      >
        <div className="flex items-end justify-between gap-3">
          <div>
            <p className="label-caps">설정</p>
            <h1 className="mt-1 text-3xl font-semibold">캐릭터와 세계관</h1>
            {storyStarted ? (
              <p className="mt-2 text-sm text-[var(--ink-dim)]">
                이야기가 시작된 뒤에도 인물과 설정을 고칠 수 있습니다. 다음 턴부터
                반영됩니다.
              </p>
            ) : null}
          </div>
        </div>

        <section>
          <p className="label-caps">예시로 시작</p>
          <p className="mt-2 text-sm text-[var(--ink-dim)]">
            대표 프로필을 누르면 그 설정이 열립니다.
          </p>
          <div className="scenario-row mt-4">
            {WORLD_PRESETS.map((preset) => (
              <button
                key={preset.id}
                type="button"
                className={`scenario-pick ${
                  activePreset?.id === preset.id ? "is-active" : ""
                }`}
                onClick={() => {
                  play.applyPreset(preset.id);
                  setPicked(true);
                }}
              >
                <AvatarCircle
                  src={preset.character.photo}
                  name={preset.character.name}
                  size="lg"
                />
                <span>{preset.character.name}</span>
              </button>
            ))}
            {customSettings.map((setting) => {
              const selected = setting.id === play.currentSettingId;
              return (
                <div
                  key={setting.id}
                  className={`scenario-pick ${selected ? "is-active" : ""}`}
                >
                  <button
                    type="button"
                    onClick={() => {
                      play.selectSetting(setting.id);
                      setPicked(true);
                    }}
                  >
                    <AvatarCircle
                      src={setting.character.photo}
                      name={setting.character.name}
                      size="lg"
                    />
                  </button>
                  {selected ? (
                    <input
                      className="scenario-name"
                      value={play.state.character.name}
                      maxLength={FIELD_LIMITS.characterName}
                      placeholder="이름"
                      aria-label="시나리오 이름"
                      onChange={(event) =>
                        play.updateCharacter("name", event.target.value)
                      }
                    />
                  ) : (
                    <button
                      type="button"
                      onClick={() => {
                        play.selectSetting(setting.id);
                        setPicked(true);
                      }}
                    >
                      {setting.character.name.trim() || "새 시나리오"}
                    </button>
                  )}
                </div>
              );
            })}
            <button
              type="button"
              className="scenario-add"
              onClick={addScenario}
            >
              <span className="avatar-circle avatar-lg">+</span>
              <span>시나리오 추가</span>
            </button>
          </div>
        </section>

        {editorOpen ? (
          <>
            {error ? <p className="alert-error">{error}</p> : null}
            <section className="paper-card space-y-4 p-6">
              <p className="label-caps">필수 프로필</p>
              <div className="flex items-start gap-4">
                <div>
                  <p className="text-sm font-medium text-[var(--ink)]">사진</p>
                  <div className="mt-2">
                    <AvatarCircle
                      src={play.state.character.photo}
                      name={play.state.character.name}
                      size="lg"
                      editable
                      onChange={play.setCharacterPhoto}
                    />
                  </div>
                  <p className="mt-2 text-xs text-[var(--ink-dim)]">
                    원을 눌러 사진을 바꿀 수 있습니다.
                  </p>
                </div>
                <div className="min-w-0 flex-1 space-y-4">
                  <CharField
                    label="이름"
                    required
                    value={play.state.character.name}
                    max={FIELD_LIMITS.characterName}
                    onChange={(value) => play.updateCharacter("name", value)}
                    placeholder="엘라"
                  />
                  <CharField
                    label="한 줄 소개"
                    value={play.state.character.oneLiner}
                    max={FIELD_LIMITS.oneLiner}
                    onChange={(value) => play.updateCharacter("oneLiner", value)}
                    placeholder="밤의 서점을 지키는 사람"
                  />
                </div>
              </div>
            </section>

            <details className="setup-fold">
              <summary className="label-caps">말투 · 외형 · 금지 · 시작 상황</summary>
              <div className="mt-4 space-y-4">
                <CharField
                  label="말투"
                  multiline
                  value={play.state.character.speechStyle}
                  max={FIELD_LIMITS.speechStyle}
                  onChange={(value) => play.updateCharacter("speechStyle", value)}
                  placeholder="존댓말, 이모지 금지"
                />
                <CharField
                  label="외형"
                  multiline
                  value={play.state.character.appearance}
                  max={FIELD_LIMITS.appearance}
                  onChange={(value) => play.updateCharacter("appearance", value)}
                />
                <div>
                  <CharField
                    label="금지"
                    multiline
                    rows={6}
                    value={play.state.character.forbidden}
                    max={FIELD_LIMITS.forbidden}
                    onChange={(value) => play.updateCharacter("forbidden", value)}
                    placeholder="이름이나 말투를 적으면 규칙이 생깁니다."
                    hint="말투와 세계관을 보고 자동으로 채웁니다. 직접 고쳐도 되고, 고친 뒤에는 다른 칸을 바꿔도 유지됩니다."
                  />
                  <button
                    type="button"
                    className="ghost-link mt-2"
                    onClick={play.resetForbidden}
                  >
                    자동으로 다시 채우기
                  </button>
                </div>
                <CharField
                  label="시작 상황"
                  multiline
                  value={play.state.character.openingSituation}
                  max={FIELD_LIMITS.openingSituation}
                  onChange={(value) =>
                    play.updateCharacter("openingSituation", value)
                  }
                />
              </div>
            </details>

            <details className="setup-fold">
              <summary className="label-caps">유저 프로필</summary>
              <div className="mt-4 flex items-start gap-4">
                <div>
                  <p className="text-sm font-medium text-[var(--ink)]">사진</p>
                  <div className="mt-2">
                    <AvatarCircle
                      src={play.state.userPersona.photo}
                      name={play.state.userPersona.name}
                      size="lg"
                      editable
                      onChange={play.setUserPhoto}
                    />
                  </div>
                  <p className="mt-2 text-xs text-[var(--ink-dim)]">
                    원을 눌러 사진을 넣으세요.
                  </p>
                </div>
                <div className="min-w-0 flex-1 space-y-4">
                  <CharField
                    label="유저 이름"
                    value={play.state.userPersona.name}
                    max={FIELD_LIMITS.userName}
                    onChange={(value) => play.updateUser("name", value)}
                    placeholder="하준"
                  />
                  <CharField
                    label="유저 설정"
                    multiline
                    value={play.state.userPersona.setting}
                    max={FIELD_LIMITS.userSetting}
                    onChange={(value) => play.updateUser("setting", value)}
                    placeholder="나는 누구인지"
                  />
                </div>
              </div>
            </details>

            <details className="setup-fold">
              <summary className="label-caps">세계관 · 프롤로그</summary>
              <div className="mt-4 space-y-4">
                <CharField
                  label="세계관"
                  multiline
                  rows={7}
                  value={play.state.worldSetting}
                  max={FIELD_LIMITS.worldSetting}
                  onChange={play.setWorldSetting}
                  placeholder={WORLD_PLACEHOLDER}
                  hint="세계관은 요약에 넣지 않고, 매 턴 그대로 주입됩니다."
                />
                <CharField
                  label="프롤로그"
                  multiline
                  rows={8}
                  value={play.state.prologue}
                  max={FIELD_LIMITS.prologue}
                  onChange={play.setPrologue}
                  placeholder="예시 세계관을 고르면 대화 전에 읽을 프롤로그가 들어갑니다."
                  hint="미리 만들어진 시나리오의 도입부입니다. 대화 시작 전에 보여 주고, 모델에도 주입됩니다."
                />
              </div>
            </details>

            <details className="setup-fold">
              <summary className="label-caps">등장인물</summary>
              <div className="mt-4">
                <CastEditor
                  notes={play.state.castNotes}
                  onAdd={play.addCastNote}
                  onUpdate={play.updateCastNote}
                  onRemove={play.removeCastNote}
                />
              </div>
            </details>

            <details className="setup-fold">
              <summary className="label-caps">기억</summary>
              <div className="mt-4">
                <MemoryPanel
                  state={play.state}
                  onSummaryChange={play.setStorySummary}
                  onCompress={compressMemory}
                  compressing={compressing}
                />
              </div>
            </details>

            <button type="submit" className="btn-primary w-full" disabled={!canStart}>
              {storyStarted ? "채팅으로 돌아가기" : "채팅 시작"}
            </button>
          </>
        ) : null}
      </form>
    </AppFrame>
  );
}

export default function SetupPage() {
  return (
    <Suspense
      fallback={
        <PageShell>
          <p className="mono-readout text-sm text-[var(--ink-dim)]">불러오는 중…</p>
        </PageShell>
      }
    >
      <SetupBody />
    </Suspense>
  );
}
