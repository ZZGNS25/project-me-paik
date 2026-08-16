"use client";

import { useEffect, useRef } from "react";

type ComposerProps = {
  value: string;
  onChange: (value: string) => void;
  onSubmit: () => void;
  disabled?: boolean;
  placeholder?: string;
};

export default function Composer({
  value,
  onChange,
  onSubmit,
  disabled = false,
  placeholder = "말을 이어 보세요",
}: ComposerProps) {
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    const input = inputRef.current;
    if (!input) return;
    input.style.height = "auto";
    input.style.height = `${Math.min(input.scrollHeight, 128)}px`;
  }, [value]);

  return (
    <form
      className="composer"
      onSubmit={(event) => {
        event.preventDefault();
        onSubmit();
      }}
    >
      <textarea
        ref={inputRef}
        className="composer-input"
        rows={1}
        placeholder={placeholder}
        value={value}
        disabled={disabled}
        enterKeyHint="send"
        autoComplete="off"
        onChange={(event) => onChange(event.target.value)}
        onKeyDown={(event) => {
          if (event.key === "Enter" && !event.shiftKey) {
            event.preventDefault();
            onSubmit();
          }
        }}
      />
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
    </form>
  );
}
