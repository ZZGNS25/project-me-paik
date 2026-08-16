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

function SetupBody() {
  const router = useRouter();
  const auth = useAuth();
  const play = usePlayState();
  const [compressing, setCompressing] = useState(false);
  const [error, setError] = useState("");

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
          if (canStart) router.push(storyStarted ? "/chat" : "/");
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
          <button
            type="button"
            className="btn-secondary"
            onClick={play.createSetting}
          >
            새 설정
          </button>
        </div>

        <section>
          <p className="label-caps">예시로 시작</p>
          <div className="mt-3 grid gap-3 sm:grid-cols-3">
            {WORLD_PRESETS.map((preset) => (
              <button
                key={preset.id}
                type="button"
                className="preset-card"
                onClick={() => play.applyPreset(preset.id)}
              >
                <AvatarCircle
                  src={preset.character.photo}
                  name={preset.character.name}
                  size="sm"
                />
                <p className="mt-3 font-semibold">{preset.label}</p>
                <p className="mt-1 text-sm text-[var(--ink-dim)]">{preset.blurb}</p>
                <p className="mt-2 text-xs text-[var(--blue-soft)]">
                  등장인물 {preset.cast.length}명
                </p>
              </button>
            ))}
          </div>
        </section>

        <div className="space-y-2">
          {play.settings.map((item) => (
            <div
              key={item.id}
              className={`setting-row ${
                item.id === play.currentSettingId ? "is-active" : ""
              }`}
            >
              <button
                type="button"
                className="min-w-0 flex-1 text-left"
                onClick={() => play.selectSetting(item.id)}
              >
                <span className="flex items-center gap-3">
                  <AvatarCircle
                    src={item.character.photo}
                    name={item.character.name}
                    size="sm"
                  />
                  <p className="font-semibold">
                    {item.character.name.trim() || "이름 없는 설정"}
                  </p>
                </span>
                <p className="mt-1 truncate text-sm text-[var(--ink-dim)]">
                  {item.character.oneLiner || "한 줄 소개 없음"}
                  {item.turnCount > 0 ? ` · ${item.turnCount}턴` : ""}
                </p>
              </button>
              {play.settings.length > 1 ? (
                <button
                  type="button"
                  className="ghost-link"
                  onClick={() => play.deleteSetting(item.id)}
                >
                  삭제
                </button>
              ) : null}
            </div>
          ))}
        </div>

        {error ? <p className="alert-error">{error}</p> : null}
        <section className="paper-card space-y-4 p-6">
          <p className="label-caps">필수 프로필</p>
          <div className="flex items-center gap-4">
            <AvatarCircle
              src={play.state.character.photo}
              name={play.state.character.name}
              size="lg"
            />
            <p className="text-sm text-[var(--ink-dim)]">
              예시 세계관을 고르면 웹툰 화풍 사진이 들어갑니다.
            </p>
          </div>
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
            onChange={(value) => play.updateCharacter("openingSituation", value)}
          />
        </section>

        <section className="paper-card space-y-4 p-6">
          <p className="label-caps">유저 · 세계관</p>
          <div className="flex items-start gap-4">
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
            <div className="min-w-0 flex-1">
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
        </section>

        <section className="paper-card space-y-4 p-6">
          <CastEditor
            notes={play.state.castNotes}
            onAdd={play.addCastNote}
            onUpdate={play.updateCastNote}
            onRemove={play.removeCastNote}
          />
        </section>

        <MemoryPanel
          state={play.state}
          onSummaryChange={play.setStorySummary}
          onCompress={compressMemory}
          compressing={compressing}
        />

        <button type="submit" className="btn-primary w-full" disabled={!canStart}>
          {storyStarted ? "채팅으로 돌아가기" : "작성 화면으로"}
        </button>
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
