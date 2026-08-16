"use client";

import { useState } from "react";
import CastEditor from "@/components/CastEditor";
import { FIELD_LIMITS, WORLD_PLACEHOLDER } from "@/lib/constants";
import type { CastNote } from "@/lib/types";

type StoryExtrasPanelProps = {
  worldSetting: string;
  castNotes: CastNote[];
  onWorldChange: (value: string) => void;
  onAddCast: () => void;
  onUpdateCast: (id: string, key: keyof CastNote, value: string) => void;
  onRemoveCast: (id: string) => void;
};

export default function StoryExtrasPanel({
  worldSetting,
  castNotes,
  onWorldChange,
  onAddCast,
  onUpdateCast,
  onRemoveCast,
}: StoryExtrasPanelProps) {
  const [fact, setFact] = useState("");

  function addFact() {
    const line = fact.trim();
    if (!line) return;
    const next = worldSetting.trim() ? `${worldSetting.trim()}\n${line}` : line;
    onWorldChange(next);
    setFact("");
  }

  return (
    <div className="story-extras space-y-5">
      <p className="text-sm text-[var(--ink-dim)]">
        지금 이야기에 바로 붙습니다. 다음 대사부터 반영됩니다.
      </p>
      <CastEditor
        notes={castNotes}
        onAdd={onAddCast}
        onUpdate={onUpdateCast}
        onRemove={onRemoveCast}
      />
      <div>
        <p className="label-caps">설정 한 줄 추가</p>
        <div className="mt-2 flex gap-2">
          <input
            className="field-input mt-0"
            placeholder="예: 한강에 게이트가 하나 더 열렸다"
            value={fact}
            maxLength={FIELD_LIMITS.castNote}
            onChange={(event) => setFact(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                event.preventDefault();
                addFact();
              }
            }}
          />
          <button
            type="button"
            className="btn-secondary shrink-0"
            onClick={addFact}
            disabled={!fact.trim()}
          >
            넣기
          </button>
        </div>
      </div>
      <label className="block">
        <span className="flex items-baseline justify-between gap-3">
          <span className="text-sm font-medium text-[var(--ink)]">세계관</span>
          <span className="mono-readout text-xs text-[var(--ink-dim)]">
            {worldSetting.length}/{FIELD_LIMITS.worldSetting}
          </span>
        </span>
        <textarea
          className="field-input"
          rows={5}
          value={worldSetting}
          maxLength={FIELD_LIMITS.worldSetting}
          placeholder={WORLD_PLACEHOLDER}
          onChange={(event) => onWorldChange(event.target.value)}
        />
      </label>
    </div>
  );
}
