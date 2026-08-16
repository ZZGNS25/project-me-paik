"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import AppFrame from "@/components/AppFrame";
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
          if (canStart) router.push("/");
        }}
      >
        <div className="flex items-end justify-between gap-3">
          <div>
            <p className="label-caps">설정</p>
            <h1 className="mt-1 text-3xl font-semibold">캐릭터와 세계관</h1>
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
                <p className="font-semibold">{preset.label}</p>
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
                <p className="font-semibold">
                  {item.character.name.trim() || "이름 없는 설정"}
                </p>
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
            <p className="text-sm font-medium text-[var(--ink)]">금지</p>
            <p className="mt-1 text-xs text-[var(--ink-dim)]">
              말투와 세계관을 보고 자동으로 정합니다. 직접 고치지 않아도 됩니다.
            </p>
            <p className="forbidden-box">
              {play.state.character.forbidden ||
                "이름이나 말투를 적으면 여기에 규칙이 생깁니다."}
            </p>
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
        </section>

        <section className="paper-card space-y-4 p-6">
          <div className="flex items-center justify-between">
            <p className="label-caps">등장인물 메모</p>
            <button
              type="button"
              className="ghost-link"
              onClick={play.addCastNote}
            >
              추가
            </button>
          </div>
          {play.state.castNotes.length === 0 ? (
            <p className="text-sm text-[var(--ink-dim)]">
              중요한 인물만 직접 추가하세요. 자동으로 넣지 않습니다.
            </p>
          ) : (
            play.state.castNotes.map((note) => (
              <div key={note.id} className="grid gap-3 sm:grid-cols-[8rem_1fr_auto]">
                <input
                  className="field-input mt-0"
                  placeholder="이름"
                  value={note.name}
                  maxLength={FIELD_LIMITS.castName}
                  onChange={(event) =>
                    play.updateCastNote(note.id, "name", event.target.value)
                  }
                />
                <input
                  className="field-input mt-0"
                  placeholder="한 줄 메모"
                  value={note.note}
                  maxLength={FIELD_LIMITS.castNote}
                  onChange={(event) =>
                    play.updateCastNote(note.id, "note", event.target.value)
                  }
                />
                <button
                  type="button"
                  className="ghost-link self-center"
                  onClick={() => play.removeCastNote(note.id)}
                >
                  삭제
                </button>
              </div>
            ))
          )}
        </section>

        <MemoryPanel
          state={play.state}
          onSummaryChange={play.setStorySummary}
          onCompress={compressMemory}
          compressing={compressing}
        />

        <button type="submit" className="btn-primary w-full" disabled={!canStart}>
          작성 화면으로
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
