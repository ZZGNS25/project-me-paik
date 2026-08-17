"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import AvatarCircle from "@/components/AvatarCircle";
import PersonaPicker from "@/components/PersonaPicker";
import ProfileCard from "@/components/ProfileCard";
import { useConfirm } from "@/components/ConfirmDialog";
import { useStartFresh } from "@/hooks/useStartFresh";
import type { PlayController } from "@/hooks/usePlayState";
import { deletePlayFromCloud } from "@/lib/cloud";
import { WORLD_PRESETS, isPresetNamed, type PresetId } from "@/lib/presets";
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

  const mine = play.settings
    .filter(
      (item) =>
        item.character.name.trim() &&
        (item.chatLog.length > 0 || !isPresetNamed(item.character.name)),
    )
    .slice()
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));

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
    if (setting.cloudSessionId) {
      try {
        await deletePlayFromCloud(setting.cloudSessionId);
      } catch {
        // 로컬은 지운다.
      }
    }
    play.deleteSetting(setting.id);
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
              <div key={item.id} className="story-card">
                <ProfileCard
                  name={storyTitle(item)}
                  oneLiner={item.character.oneLiner}
                  photo={item.character.photo}
                  meta={item.chatLog.length > 0 ? `${item.turnCount}턴` : "아직 시작 전"}
                  onRename={(title) => play.renameSetting(item.id, title)}
                />
                <div className="story-actions">
                  <button
                    type="button"
                    className="btn-primary"
                    onClick={() => {
                      play.selectSetting(item.id);
                      router.push(`/setup?id=${encodeURIComponent(item.id)}`);
                    }}
                  >
                    다듬기
                  </button>
                  <button
                    type="button"
                    className="btn-secondary"
                    onClick={() => {
                      play.selectSetting(item.id);
                      router.push("/chat");
                    }}
                  >
                    {item.chatLog.length > 0 ? "이야기로" : "채팅 시작"}
                  </button>
                  {play.settings.length > 1 ? (
                    <button
                      type="button"
                      className="btn-danger"
                      onClick={() =>
                        confirm.ask({
                          message: "이 시나리오를 지울까요? 대화가 있으면 함께 사라집니다.",
                          confirmLabel: "삭제",
                          danger: true,
                          run: () => void removeMine(item),
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
          skipLabel="없이 시작"
          onPick={(id) => {
            const pending = pendingStart;
            setPendingStart(null);
            goPreset(pending.presetId, pending.next, id);
          }}
          onAdd={() => {
            setPendingStart(null);
            router.push("/?view=profiles&from=setup");
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
