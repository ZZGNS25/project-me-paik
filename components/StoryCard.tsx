"use client";

import ProfileCard from "@/components/ProfileCard";

export type StoryCardAction = {
  label: string;
  kind: "primary" | "secondary" | "danger";
  onClick: () => void;
  disabled?: boolean;
};

type StoryCardProps = {
  variant?: "story-card" | "history-card";
  name: string;
  oneLiner?: string;
  photo?: string;
  meta?: string;
  peek?: string;
  onRename?: (title: string) => void;
  actions: StoryCardAction[];
};

const BUTTON_CLASS = {
  primary: "btn-primary",
  secondary: "btn-secondary",
  danger: "btn-danger",
} as const;

export default function StoryCard({
  variant = "story-card",
  name,
  oneLiner,
  photo,
  meta,
  peek,
  onRename,
  actions,
}: StoryCardProps) {
  return (
    <div className={variant}>
      <ProfileCard
        name={name}
        oneLiner={oneLiner}
        photo={photo}
        meta={meta}
        onRename={onRename}
      />
      {peek ? <p className="story-peek">{peek}</p> : null}
      <div className="story-actions">
        {actions.map((action) => (
          <button
            key={action.label}
            type="button"
            className={BUTTON_CLASS[action.kind]}
            disabled={action.disabled}
            onClick={action.onClick}
          >
            {action.label}
          </button>
        ))}
      </div>
    </div>
  );
}
