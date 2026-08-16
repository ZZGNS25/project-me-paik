"use client";

import { useState } from "react";
import { FIELD_LIMITS } from "@/lib/constants";
import type { PlayState, StoryPin } from "@/lib/types";
import CharField from "./CharField";
import ProfileCard from "./ProfileCard";

type MemoryPanelProps = {
  state: PlayState;
  onSummaryChange: (value: string) => void;
  onCompress: () => void;
  compressing: boolean;
  onAddPin?: (text: string) => void;
  onUpdatePin?: (id: string, text: string) => void;
  onRemovePin?: (id: string) => void;
};

export default function MemoryPanel({
  state,
  onSummaryChange,
  onCompress,
  compressing,
  onAddPin,
  onUpdatePin,
  onRemovePin,
}: MemoryPanelProps) {
  const [pinDraft, setPinDraft] = useState("");

  function addPin() {
    const text = pinDraft.trim();
    if (!text || !onAddPin) return;
    onAddPin(text);
    setPinDraft("");
  }

  return (
    <aside className="paper-panel flex flex-col gap-5 overflow-y-auto p-5">
      <section>
        <p className="label-caps">필수 프로필</p>
        <div className="mt-2">
          <ProfileCard
            name={state.character.name}
            oneLiner={state.character.oneLiner || "한 줄 소개가 아직 없습니다."}
            photo={state.character.photo}
            size="md"
          />
        </div>
        <dl className="mt-4 space-y-2 text-sm text-[var(--ink-soft)]">
          <div>
            <dt className="text-[var(--ink-dim)]">말투</dt>
            <dd>{state.character.speechStyle || "—"}</dd>
          </div>
          <div>
            <dt className="text-[var(--ink-dim)]">금지</dt>
            <dd>{state.character.forbidden || "—"}</dd>
          </div>
        </dl>
        <p className="mt-3 text-xs text-[var(--ink-dim)]">
          말투와 금지는 요약과 따로 유지됩니다.
        </p>
      </section>

      <section>
        <p className="label-caps">세계관</p>
        <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-[var(--ink-soft)]">
          {state.worldSetting || "아직 적지 않았습니다."}
        </p>
      </section>

      <section>
        <p className="label-caps">등장인물 메모</p>
        <ul className="mt-2 space-y-2 text-sm text-[var(--ink-soft)]">
          {state.castNotes.length === 0 ? (
            <li>없음</li>
          ) : (
            state.castNotes.map((note) => (
              <li key={note.id}>
                <span className="text-[var(--ink)]">{note.name || "이름 없음"}</span>
                {note.note ? ` · ${note.note}` : ""}
              </li>
            ))
          )}
        </ul>
      </section>

      <section>
        <p className="label-caps">고정된 사건</p>
        <p className="mt-2 text-xs text-[var(--ink-dim)]">
          중요 사건만 남기세요. 기억 압축을 해도 지워지지 않습니다.
        </p>
        <ul className="mt-3 space-y-2">
          {state.storyPins.length === 0 ? (
            <li className="text-sm text-[var(--ink-dim)]">아직 없습니다.</li>
          ) : (
            state.storyPins.map((pin) => (
              <PinRow
                key={pin.id}
                pin={pin}
                onChange={onUpdatePin}
                onRemove={onRemovePin}
              />
            ))
          )}
        </ul>
        {onAddPin ? (
          <div className="mt-3 flex gap-2">
            <input
              className="field-input mt-0"
              value={pinDraft}
              maxLength={FIELD_LIMITS.storyPin}
              placeholder="예: 한강 게이트가 하나 더 열렸다"
              onChange={(event) => setPinDraft(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  event.preventDefault();
                  addPin();
                }
              }}
            />
            <button
              type="button"
              className="btn-secondary shrink-0"
              onClick={addPin}
              disabled={!pinDraft.trim() || state.storyPins.length >= FIELD_LIMITS.storyPinsMax}
            >
              고정
            </button>
          </div>
        ) : null}
      </section>

      <section>
        <CharField
          label="스토리 요약"
          value={state.storySummary}
          max={FIELD_LIMITS.storySummary}
          onChange={onSummaryChange}
          multiline
          rows={6}
          placeholder="진행중 / 결정된 것 / 미결"
        />
        <p className="mt-2 text-xs text-[var(--ink-dim)]">
          턴 {state.turnCount} · 단기 버퍼 {state.shortTermBuffer.length}개
        </p>
        <button
          type="button"
          className="btn-secondary mt-3 w-full"
          onClick={onCompress}
          disabled={compressing || state.shortTermBuffer.length === 0}
        >
          {compressing ? "압축 중…" : "기억 압축"}
        </button>
      </section>
    </aside>
  );
}

function PinRow({
  pin,
  onChange,
  onRemove,
}: {
  pin: StoryPin;
  onChange?: (id: string, text: string) => void;
  onRemove?: (id: string) => void;
}) {
  return (
    <li className="flex items-start gap-2">
      <input
        className="field-input mt-0"
        value={pin.text}
        maxLength={FIELD_LIMITS.storyPin}
        onChange={(event) => onChange?.(pin.id, event.target.value)}
      />
      {onRemove ? (
        <button
          type="button"
          className="btn-danger shrink-0"
          onClick={() => onRemove(pin.id)}
        >
          삭제
        </button>
      ) : null}
    </li>
  );
}
