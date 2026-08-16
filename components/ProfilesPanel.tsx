"use client";

import { useState } from "react";
import AvatarCircle from "@/components/AvatarCircle";
import CharField from "@/components/CharField";
import { useConfirm } from "@/components/ConfirmDialog";
import PersonaList from "@/components/PersonaList";
import { FIELD_LIMITS, PERSONAS_MAX } from "@/lib/constants";
import { personaTitle } from "@/lib/persona";
import type { PlayController } from "@/hooks/usePlayState";
import type { SavedPersona } from "@/lib/types";

const EMPTY_DRAFT = {
  id: "",
  label: "",
  name: "",
  setting: "",
  photo: "",
};

type ProfilesPanelProps = {
  play: PlayController;
};

export default function ProfilesPanel({ play }: ProfilesPanelProps) {
  const confirm = useConfirm();
  const [draft, setDraft] = useState(EMPTY_DRAFT);
  const editing = Boolean(draft.id);
  const canSave =
    Boolean(draft.name.trim()) &&
    (editing || play.personas.length < PERSONAS_MAX);

  function openNew() {
    setDraft({ ...EMPTY_DRAFT });
  }

  function openExisting(id: string) {
    const persona = play.personas.find((item) => item.id === id);
    if (!persona) return;
    setDraft({
      id: persona.id,
      label: persona.label,
      name: persona.name,
      setting: persona.setting,
      photo: persona.photo,
    });
  }

  function save() {
    play.upsertPersona({
      id: draft.id || undefined,
      label: draft.label,
      name: draft.name,
      setting: draft.setting,
      photo: draft.photo,
    });
    if (!draft.id) setDraft({ ...EMPTY_DRAFT });
  }

  function remove(persona: SavedPersona) {
    confirm.ask({
      message: `${personaTitle(persona)} 프로필을 지울까요? 이미 시작한 이야기는 그대로입니다.`,
      confirmLabel: "삭제",
      danger: true,
      run: () => {
        play.deletePersona(persona.id);
        if (draft.id === persona.id) setDraft({ ...EMPTY_DRAFT });
      },
    });
  }

  return (
    <>
      <div className="page-scroll mx-auto w-full max-w-2xl px-6 py-12">
        <p className="label-caps">프로필</p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight">내가 누구인지</h1>
        <p className="mt-3 text-sm text-[var(--ink-dim)]">
          이야기는 세계와 역할입니다. 프로필은 나와 따로 만들어 두고, 새 이야기를 시작할
          때 고릅니다. 여기서 고쳐도 이미 진행 중인 대화는 바뀌지 않습니다.
        </p>

        <section className="mt-8">
          <div className="flex items-end justify-between gap-3">
            <p className="label-caps">목록</p>
            <button type="button" className="btn-secondary" onClick={openNew}>
              새 프로필
            </button>
          </div>
          <div className="mt-3">
            <PersonaList
              personas={play.personas}
              activeId={draft.id || null}
              onPick={openExisting}
              onRemove={(id) => {
                const persona = play.personas.find((item) => item.id === id);
                if (persona) remove(persona);
              }}
            />
          </div>
        </section>

        <section className="mt-10 space-y-4">
          <p className="label-caps">{editing ? "프로필 수정" : "새 프로필"}</p>
          <div className="flex items-start gap-4">
            <div>
              <p className="text-sm font-medium text-[var(--ink)]">사진</p>
              <div className="mt-2">
                <AvatarCircle
                  src={draft.photo}
                  name={draft.name || draft.label}
                  size="lg"
                  editable
                  onChange={(photo) => setDraft((current) => ({ ...current, photo }))}
                />
              </div>
            </div>
            <div className="min-w-0 flex-1 space-y-4">
              <CharField
                label="목록 이름"
                value={draft.label}
                max={FIELD_LIMITS.personaLabel}
                onChange={(label) => setDraft((current) => ({ ...current, label }))}
                placeholder="헌터 — 20세"
                hint="목록에 보이는 이름입니다. 예: 아카데미 학생 — 17세"
              />
              <CharField
                label="이야기에서 부를 이름"
                value={draft.name}
                max={FIELD_LIMITS.userName}
                onChange={(name) => setDraft((current) => ({ ...current, name }))}
                placeholder="하준"
                required
              />
            </div>
          </div>
          <CharField
            label="나는 누구인지"
            multiline
            rows={8}
            value={draft.setting}
            max={FIELD_LIMITS.userSetting}
            onChange={(setting) => setDraft((current) => ({ ...current, setting }))}
            placeholder="나이, 성격, 숨기는 것, 이 몸이 아는 것"
            hint="세계관은 적지 마세요. 내가 누구인지만 적습니다."
          />
          <button
            type="button"
            className="btn-primary w-full"
            disabled={!canSave}
            onClick={save}
          >
            {editing ? "프로필 저장" : "프로필 만들기"}
          </button>
        </section>
      </div>
      {confirm.dialog}
    </>
  );
}
