"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import AppHeader from "@/components/AppHeader";
import CharField from "@/components/CharField";
import PageShell from "@/components/PageShell";
import { usePlayState } from "@/hooks/usePlayState";
import { FIELD_LIMITS, WORLD_PLACEHOLDER } from "@/lib/constants";

export default function SetupPage() {
  const router = useRouter();
  const play = usePlayState();

  useEffect(() => {
    if (play.ready && !play.state.apiKey) {
      router.replace("/");
    }
  }, [play.ready, play.state.apiKey, router]);

  if (!play.ready) {
    return (
      <PageShell>
        <p className="mono-readout text-sm text-[var(--ink-dim)]">불러오는 중…</p>
      </PageShell>
    );
  }

  const canStart = Boolean(play.state.character.name.trim());

  return (
    <PageShell>
      <AppHeader title="캐릭터 설정" />

      <form
        className="mt-8 space-y-8"
        onSubmit={(event) => {
          event.preventDefault();
          if (canStart) router.push("/chat");
        }}
      >
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
          <CharField
            label="금지"
            multiline
            value={play.state.character.forbidden}
            max={FIELD_LIMITS.forbidden}
            onChange={(value) => play.updateCharacter("forbidden", value)}
            placeholder="마법을 쓰지 않는다"
          />
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

        <button type="submit" className="btn-primary w-full" disabled={!canStart}>
          채팅 시작
        </button>
      </form>
    </PageShell>
  );
}
