"use client";

import { useEffect, useRef } from "react";

type ComposerProps = {
  value: string;
  onChange: (value: string) => void;
  onSubmit: () => void;
  onStop?: () => void;
  disabled?: boolean;
  placeholder?: string;
};

export default function Composer({
  value,
  onChange,
  onSubmit,
  onStop,
  disabled = false,
  placeholder = "말을 이어 보세요",
}: ComposerProps) {
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const locked = disabled || Boolean(onStop);

  useEffect(() => {
    const input = inputRef.current;
    if (!input) return;
    input.style.height = "auto";
    input.style.height = `${Math.min(input.scrollHeight, 128)}px`;
  }, [value]);

  function insertStar() {
    const input = inputRef.current;
    if (!input || locked) return;
    const start = input.selectionStart ?? value.length;
    const end = input.selectionEnd ?? value.length;
    const selected = value.slice(start, end);
    const next = selected
      ? `${value.slice(0, start)}*${selected}*${value.slice(end)}`
      : `${value.slice(0, start)}*${value.slice(end)}`;
    onChange(next);
    const cursor = selected ? start + selected.length + 2 : start + 1;
    requestAnimationFrame(() => {
      input.focus();
      input.setSelectionRange(cursor, cursor);
    });
  }

  return (
    <form
      className="composer"
      onSubmit={(event) => {
        event.preventDefault();
        if (!onStop) onSubmit();
      }}
    >
      <textarea
        ref={inputRef}
        className="composer-input"
        rows={1}
        placeholder={placeholder}
        value={value}
        disabled={locked}
        enterKeyHint="send"
        autoComplete="off"
        onChange={(event) => onChange(event.target.value)}
        onKeyDown={(event) => {
          if (event.key === "Enter" && !event.shiftKey) {
            event.preventDefault();
            if (!onStop) onSubmit();
          }
        }}
      />
      <button
        type="button"
        className="composer-star"
        disabled={locked}
        onClick={insertStar}
        aria-label="별 넣기"
        title="*행동*"
      >
        <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor" aria-hidden="true">
          <path d="M12 2.8 13.4 10 21 12l-7.6 2L12 21.2 10.6 14 3 12l7.6-2Z" />
        </svg>
      </button>
      {onStop ? (
        <button
          type="button"
          className="composer-send"
          onClick={onStop}
          aria-label="멈추기"
          title="멈추기"
        >
          <svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor" aria-hidden="true">
            <rect x="7" y="7" width="10" height="10" rx="1.6" />
          </svg>
        </button>
      ) : (
        <button
          type="submit"
          className="composer-send"
          disabled={disabled || !value.trim()}
          aria-label="전송"
        >
          <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor" aria-hidden="true">
            <path d="M8 5.2v13.6L20 12 8 5.2Z" />
          </svg>
        </button>
      )}
    </form>
  );
}
