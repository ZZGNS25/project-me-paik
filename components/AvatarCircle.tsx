"use client";

import { useRef } from "react";
import { readPhotoFile } from "@/lib/photo";

type AvatarSize = "sm" | "md" | "lg";

type AvatarCircleProps = {
  src?: string;
  name?: string;
  size?: AvatarSize;
  editable?: boolean;
  onChange?: (photo: string) => void;
};

const SIZE_CLASS: Record<AvatarSize, string> = {
  sm: "avatar-sm",
  md: "avatar-md",
  lg: "avatar-lg",
};

export default function AvatarCircle({
  src,
  name = "",
  size = "md",
  editable = false,
  onChange,
}: AvatarCircleProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const initial = name.trim().slice(0, 1) || (editable ? "+" : "");

  async function handleFile(file?: File) {
    if (!file || !onChange) return;
    try {
      onChange(await readPhotoFile(file));
    } catch {
      onChange("");
    }
  }

  const face = src ? (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt={name || "프로필"}
      className="avatar-image"
      width={88}
      height={88}
      loading="lazy"
      decoding="async"
    />
  ) : (
    <span className="avatar-fallback">{initial}</span>
  );

  if (!editable) {
    return <span className={`avatar-circle ${SIZE_CLASS[size]}`}>{face}</span>;
  }

  return (
    <span className="avatar-edit">
      <button
        type="button"
        className={`avatar-circle is-editable ${SIZE_CLASS[size]}`}
        onClick={() => inputRef.current?.click()}
        aria-label="프로필 사진 추가"
      >
        {face}
      </button>
      {src ? (
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
