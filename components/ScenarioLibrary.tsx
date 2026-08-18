"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import AvatarCircle from "@/components/AvatarCircle";
import PersonaPicker from "@/components/PersonaPicker";
import StoryCard from "@/components/StoryCard";
import { useConfirm } from "@/components/ConfirmDialog";
import { useStartFresh } from "@/hooks/useStartFresh";
import type { PlayController } from "@/hooks/usePlayState";
import { deleteSettingWithCloud } from "@/lib/deleteSetting";
import { WORLD_PRESETS, type PresetId } from "@/lib/presets";
import { listMine } from "@/lib/settingFilters";
import { storyTitle } from "@/lib/storyTitle";
import type { SettingRecord } from "@/lib/types";

type ScenarioLibraryProps = {
  play: PlayController;
};

export default function ScenarioLibrary({ play }: ScenarioLibraryProps) {
  const router = useRouter();
  const confirm = useConfirm();
  const fresh = useStartFresh();
  const [pendingStart, setPendingStart] = useState<{
    presetId: PresetId;
    next: "chat" | "edit";
  } | null>(null);

  const mine = listMine(play.settings);

  function goPreset(presetId: PresetId, next: "chat" | "edit", personaId?: string | null) {
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
    router.push(next === "edit" ? "/setup?focus=1" : "/chat");
  }

  function startPreset(presetId: PresetId, next: "chat" | "edit") {
    if (play.personas.length > 0) {
      setPendingStart({ presetId, next });
      return;
    }
    goPreset(presetId, next);
  }

  async function removeMine(setting: SettingRecord) {
    await deleteSettingWithCloud(play.deleteSetting, setting);
  }

  return (
    <>
      <div className="page-scroll mx-auto w-full max-w-3xl px-6 py-10">
        <div className="page-hero">
          <p className="label-caps">시나리오</p>
          <h1 className="mt-2 text-3xl font-semibold">세계와 역할을 고르세요</h1>
          <p className="mt-3 text-sm text-[var(--ink-dim)]">
            여기는 세계관입니다. 대화는 왼쪽 이야기에서 잇습니다.
          </p>
        </div>

        {mine.length > 0 ? (
          <section className="mt-8 space-y-3">
            <p className="label-caps">내 시나리오</p>
            {mine.map((item) => (
              <StoryCard
                key={item.id}
                name={storyTitle(item)}
                oneLiner={item.character.oneLiner}
                photo={item.character.photo}
                meta={item.chatLog.length > 0 ? `${item.turnCount}턴` : "아직 시작 전"}
                onRename={(title) => play.renameSetting(item.id, title)}
                actions={[
                  {
                    label: item.chatLog.length > 0 ? "이어가기" : "시작하기",
                    kind: "primary",
                    onClick: () => {
                      play.selectSetting(item.id);
                      router.push("/chat");
                    },
                  },
                  {
                    label: "다듬기",
                    kind: "secondary",
                    onClick: () => {
                      play.selectSetting(item.id);
                      router.push(`/setup?id=${encodeURIComponent(item.id)}`);
                    },
                  },
                  ...(play.settings.length > 1
                    ? [
                        {
                          label: "삭제",
                          kind: "danger" as const,
                          onClick: () =>
                            confirm.ask({
                              title: "이 시나리오를 지울까요?",
                              message: "대화가 있으면 함께 사라집니다.",
                              confirmLabel: "삭제",
                              danger: true,
                              run: () => void removeMine(item),
                            }),
                        },
                      ]
                    : []),
                ]}
              />
            ))}
          </section>
        ) : null}

        <section className="mt-8">
          <p className="label-caps">예시</p>
          <p className="mt-2 text-sm text-[var(--ink-dim)]">
            시작하기로 대화를 열고, 다듬기는 그 세계를 고칩니다.
          </p>
          <div className="cast-grid mt-4">
            {WORLD_PRESETS.map((preset) => (
              <article key={preset.id} className="cast-card">
                <AvatarCircle
                  src={preset.character.photo}
                  name={preset.character.name}
                  size="lg"
                />
                <div className="cast-start">
                  <p className="cast-world">{preset.label}</p>
                  <h2 className="cast-name">{preset.character.name}</h2>
                  <p className="cast-blurb">{preset.blurb}</p>
                </div>
                <div className="story-actions">
                  <button
                    type="button"
                    className="btn-primary"
                    onClick={() => startPreset(preset.id, "chat")}
                  >
                    시작하기
                  </button>
                  <button
                    type="button"
                    className="btn-secondary"
                    onClick={() => startPreset(preset.id, "edit")}
                  >
                    다듬기
                  </button>
                </div>
              </article>
            ))}
          </div>
          <div className="mt-4">
            <button type="button" className="btn-secondary" onClick={fresh.startStory}>
              직접 만들기
            </button>
          </div>
        </section>
      </div>
      {confirm.dialog}
      {fresh.dialog}
      {pendingStart ? (
        <PersonaPicker
          personas={play.personas}
          selectedId={play.lastPersonaId}
          skipLabel="기본 프로필로 시작"
          onPick={(id) => {
            const pending = pendingStart;
            setPendingStart(null);
            goPreset(pending.presetId, pending.next, id);
          }}
          onAdd={() => {
            setPendingStart(null);
            router.push("/?view=profiles&from=setup&new=1");
          }}
          onEdit={(id) => {
            setPendingStart(null);
            router.push(`/?view=profiles&from=setup&edit=${id}`);
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
