"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useConfirm } from "@/components/ConfirmDialog";
import PersonaFormModal, { type PersonaDraft } from "@/components/PersonaFormModal";
import PersonaList from "@/components/PersonaList";
import { PERSONAS_MAX } from "@/lib/constants";
import { personaTitle, STORY_PERSONA_EDIT } from "@/lib/persona";
import type { PlayController } from "@/hooks/usePlayState";
import type { SavedPersona } from "@/lib/types";

const EMPTY_DRAFT: PersonaDraft = {
  id: "",
  label: "",
  name: "",
  setting: "",
  photo: "",
};

type ProfilesPanelProps = {
  play: PlayController;
  returnHref?: string | null;
  editId?: string | null;
  startNew?: boolean;
};

function storyDraft(play: PlayController): PersonaDraft {
  const setting = play.settings.find((item) => item.id === play.currentSettingId);
  const linked = setting?.personaId
    ? play.personas.find((item) => item.id === setting.personaId)
    : undefined;
  const user = play.state.userPersona;
  return {
    id: linked?.id ?? "",
    label: linked?.label ?? "",
    name: user.name,
    setting: user.setting,
    photo: user.photo,
  };
}

function personaDraft(persona: SavedPersona): PersonaDraft {
  return {
    id: persona.id,
    label: persona.label,
    name: persona.name,
    setting: persona.setting,
    photo: persona.photo,
  };
}

export default function ProfilesPanel({
  play,
  returnHref,
  editId,
  startNew = false,
}: ProfilesPanelProps) {
  const router = useRouter();
  const confirm = useConfirm();
  const [editingNow, setEditingNow] = useState(editId === STORY_PERSONA_EDIT);
  const [formOpen, setFormOpen] = useState(
    () => startNew || Boolean(editId),
  );
  const [draft, setDraft] = useState<PersonaDraft>(() => {
    if (editId === STORY_PERSONA_EDIT) return storyDraft(play);
    if (!editId) return { ...EMPTY_DRAFT };
    const persona = play.personas.find((item) => item.id === editId);
    if (!persona) return { ...EMPTY_DRAFT };
    return personaDraft(persona);
  });
  const editing = editingNow || Boolean(draft.id);
  const canSave =
    Boolean(draft.name.trim()) &&
    (editingNow || editing || play.personas.length < PERSONAS_MAX);
  const returnLabel = returnHref === "/setup" ? "시나리오로" : "이야기로";
  const canAdd = play.personas.length < PERSONAS_MAX;

  function patchDraft(patch: Partial<PersonaDraft>) {
    setDraft((current) => ({ ...current, ...patch }));
  }

  function closeForm() {
    setFormOpen(false);
    setEditingNow(false);
    setDraft({ ...EMPTY_DRAFT });
  }

  function openNew() {
    if (!canAdd) return;
    setEditingNow(false);
    setDraft({ ...EMPTY_DRAFT });
    setFormOpen(true);
  }

  function openExisting(id: string) {
    const persona = play.personas.find((item) => item.id === id);
    if (!persona) return;
    setEditingNow(false);
    setDraft(personaDraft(persona));
    setFormOpen(true);
  }

  function save() {
    const wasNew = !draft.id && !editingNow;
    let savedId = draft.id;

    if (editingNow) {
      savedId = play.saveStoryPersona({
        label: draft.label,
        name: draft.name,
        setting: draft.setting,
        photo: draft.photo,
      }) ?? draft.id;
    } else {
      savedId =
        play.upsertPersona({
          id: draft.id || undefined,
          label: draft.label,
          name: draft.name,
          setting: draft.setting,
          photo: draft.photo,
        }) ?? draft.id;
    }

    if (returnHref) {
      if (wasNew && savedId) play.applyPersona(savedId);
      router.push(returnHref);
      return;
    }
    closeForm();
  }

  function remove(persona: SavedPersona) {
    confirm.ask({
      title: `${personaTitle(persona)} 프로필을 지울까요?`,
      message: "이미 시작한 이야기는 그대로입니다.",
      confirmLabel: "삭제",
      danger: true,
      run: () => {
        play.deletePersona(persona.id);
        if (draft.id === persona.id) closeForm();
      },
    });
  }

  const formTitle = editingNow
    ? "지금 프로필 수정"
    : editing
      ? "프로필 수정"
      : "새 프로필";
  const formCopy = editingNow
    ? "지금 이 이야기에서 쓰는 나입니다. 저장하면 다음 대사부터 바뀌고, 목록에도 남습니다."
    : editing
      ? "여기서 고쳐도 이미 진행 중인 대화는 바뀌지 않습니다."
      : "이야기는 세계와 역할입니다. 프로필은 나와 따로 만들어 두고, 새 이야기를 시작할 때 고릅니다.";

  return (
    <>
      <div className="page-scroll mx-auto w-full max-w-2xl px-6 py-12">
        <div className="flex items-end justify-between gap-3">
          <div>
            <p className="label-caps">프로필</p>
            <h1 className="mt-2 text-3xl font-semibold tracking-tight">내가 누구인지</h1>
          </div>
          <button
            type="button"
            className="btn-primary"
            disabled={!canAdd}
            onClick={openNew}
          >
            새 프로필
          </button>
        </div>
        {returnHref ? (
          <button
            type="button"
            className="btn-secondary mt-4"
            onClick={() => router.push(returnHref)}
          >
            {returnLabel}
          </button>
        ) : null}
        <p className="mt-3 text-sm text-[var(--ink-dim)]">
          이야기는 세계와 역할입니다. 프로필은 나와 따로 만들어 두고, 새 이야기를 시작할 때
          고릅니다. 여기서 고쳐도 이미 진행 중인 대화는 바뀌지 않습니다.
        </p>

        <section className="mt-8">
          <p className="label-caps">목록</p>
          <div className="mt-3">
            <PersonaList
              personas={play.personas}
              activeId={formOpen ? draft.id || null : null}
              onPick={openExisting}
              onEdit={openExisting}
              onAdd={canAdd ? openNew : undefined}
              onRemove={(id) => {
                const persona = play.personas.find((item) => item.id === id);
                if (persona) remove(persona);
              }}
            />
          </div>
        </section>
      </div>
      {formOpen ? (
        <PersonaFormModal
          title={formTitle}
          copy={formCopy}
          draft={draft}
          saveLabel={editing ? "프로필 저장" : "프로필 만들기"}
          canSave={canSave}
          onChange={patchDraft}
          onSave={save}
          onCancel={closeForm}
        />
      ) : null}
      {confirm.dialog}
    </>
  );
}
