"use client";

import { useState } from "react";
import AvatarCircle from "@/components/AvatarCircle";
import { FIELD_LIMITS } from "@/lib/constants";

type ProfileCardProps = {
  name: string;
  oneLiner?: string;
  photo?: string;
  meta?: string;
  status?: string;
  statusIdle?: boolean;
  size?: "sm" | "md" | "lg";
  onRename?: (title: string) => void;
};

export default function ProfileCard({
  name,
  oneLiner,
  photo,
  meta,
  status,
  statusIdle = false,
  size = "sm",
  onRename,
}: ProfileCardProps) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(name);
  const label = name.trim() || "이름 없음";

  function commit() {
    onRename?.(draft.trim());
    setEditing(false);
  }

  return (
    <div className="flex min-w-0 items-center gap-3">
      <AvatarCircle src={photo} name={name} size={size} />
      <div className="min-w-0">
        {editing && onRename ? (
          <form
            onSubmit={(event) => {
              event.preventDefault();
              commit();
            }}
          >
            <input
              className="field-input story-rename-input"
              value={draft}
              maxLength={FIELD_LIMITS.storyTitle}
              autoFocus
              aria-label="이야기 이름"
              onChange={(event) => setDraft(event.target.value)}
              onBlur={commit}
            />
          </form>
        ) : onRename ? (
          <button
            type="button"
            className="story-name-edit"
            title="이름 바꾸기"
            onClick={() => {
              setDraft(name);
              setEditing(true);
            }}
          >
            {label}
          </button>
        ) : (
          <p className="truncate font-semibold">{label}</p>
        )}
        {oneLiner ? (
          <p className="mt-0.5 truncate text-sm text-[var(--ink-dim)]">{oneLiner}</p>
        ) : null}
        {status ? (
          <p className={`chat-status ${statusIdle ? "is-idle" : ""}`}>{status}</p>
        ) : meta ? (
          <p className="mt-0.5 text-xs text-[var(--blue-soft)]">{meta}</p>
        ) : null}
      </div>
    </div>
  );
}
