"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { readPhotoFile } from "@/lib/photo";

type AvatarSize = "sm" | "md" | "lg";

type AvatarCircleProps = {
  src?: string;
  name?: string;
  size?: AvatarSize;
  editable?: boolean;
  compact?: boolean;
  zoom?: boolean;
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
  zoom = true,
  onChange,
}: AvatarCircleProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const photo = src?.trim() ?? "";
  const [broken, setBroken] = useState(false);
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const hasPhoto = Boolean(photo && !broken);
  const canPreview = hasPhoto && zoom;
  const label = name.trim() || "인물";

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    setBroken(false);
  }, [photo]);

  useEffect(() => {
    if (!open) return;
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

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
        alt={label}
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

  const circle = canPreview ? (
    <button
      type="button"
      className={`avatar-circle is-zoom ${SIZE_CLASS[size]}`}
      onClick={() => setOpen(true)}
      aria-label={`${label} 사진 크게 보기`}
    >
      {face}
    </button>
  ) : (
    <span className={`avatar-circle ${SIZE_CLASS[size]}`}>{face}</span>
  );

  const preview =
    open && mounted && canPreview
      ? createPortal(
          <div
            className="photo-layer"
            role="dialog"
            aria-modal="true"
            aria-label={`${label} 사진`}
            onMouseDown={(event) => {
              if (event.target === event.currentTarget) setOpen(false);
            }}
          >
            <div className="photo-preview">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={photo} alt={label} />
              <p>{label}</p>
              <button type="button" className="btn-quiet" onClick={() => setOpen(false)}>
                닫기
              </button>
            </div>
          </div>,
          document.body,
        )
      : null;

  if (!editable) {
    return (
      <>
        {circle}
        {preview}
      </>
    );
  }

  return (
    <span className={`avatar-edit ${compact ? "is-compact" : ""}`}>
      {circle}
      <span className="avatar-edit-actions">
        <button
          type="button"
          className="btn-quiet avatar-change"
          onClick={() => inputRef.current?.click()}
        >
          {hasPhoto ? "바꾸기" : "추가"}
        </button>
        {hasPhoto ? (
          <button
            type="button"
            className="btn-quiet avatar-clear"
            onClick={() => onChange?.("")}
          >
            지우기
          </button>
        ) : null}
      </span>
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
      {preview}
    </span>
  );
}
