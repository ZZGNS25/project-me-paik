"use client";

import { useEffect, useRef, useState } from "react";
import { readPhotoFile } from "@/lib/photo";

type AvatarSize = "sm" | "md" | "lg";

type AvatarCircleProps = {
  src?: string;
  name?: string;
  size?: AvatarSize;
  editable?: boolean;
  compact?: boolean;
  onChange?: (photo: string) => void;
};

const SIZE_CLASS: Record<AvatarSize, string> = {
  sm: "avatar-sm",
  md: "avatar-md",
  lg: "avatar-lg",
};

function AvatarSilhouette() {
  return (
    <svg className="avatar-silhouette" viewBox="0 0 24 24" aria-hidden="true">
      <circle cx="12" cy="8.1" r="3.7" fill="currentColor" />
      <path
        d="M5.4 19.4c.7-3.5 3.3-5.4 6.6-5.4s5.9 1.9 6.6 5.4"
        fill="currentColor"
      />
    </svg>
  );
}

export default function AvatarCircle({
  src,
  name = "",
  size = "md",
  editable = false,
  compact = false,
  onChange,
}: AvatarCircleProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const photo = src?.trim() ?? "";
  const [broken, setBroken] = useState(false);

  useEffect(() => {
    setBroken(false);
  }, [photo]);

  async function handleFile(file?: File) {
    if (!file || !onChange) return;
    try {
      onChange(await readPhotoFile(file));
    } catch {
      onChange("");
    }
  }

  const face =
    photo && !broken ? (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={photo}
        alt={name || "프로필"}
        className="avatar-image"
        width={88}
        height={88}
        loading="lazy"
        decoding="async"
        onError={() => setBroken(true)}
      />
    ) : (
      <AvatarSilhouette />
    );

  if (!editable) {
    return <span className={`avatar-circle ${SIZE_CLASS[size]}`}>{face}</span>;
  }

  return (
    <span className={`avatar-edit ${compact ? "is-compact" : ""}`}>
      <button
        type="button"
        className={`avatar-circle is-editable ${SIZE_CLASS[size]}`}
        onClick={() => inputRef.current?.click()}
        aria-label="프로필 사진 추가"
      >
        {face}
      </button>
      {photo && !broken ? (
        <button
          type="button"
          className="btn-quiet avatar-clear"
          onClick={() => onChange?.("")}
        >
          지우기
        </button>
      ) : null}
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="sr-only"
        onChange={(event) => {
          void handleFile(event.target.files?.[0]);
          event.target.value = "";
        }}
      />
    </span>
  );
}
