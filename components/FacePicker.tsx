"use client";

import { FACE_LIBRARY } from "@/lib/faceLibrary";

type FacePickerProps = {
  current?: string;
  onPick: (src: string) => void;
  onFile: () => void;
  onClose: () => void;
};

export default function FacePicker({
  current = "",
  onPick,
  onFile,
  onClose,
}: FacePickerProps) {
  const selected = current.trim();

  return (
    <div
      className="photo-layer"
      role="dialog"
      aria-modal="true"
      aria-label="얼굴 고르기"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div className="paper-card face-picker">
        <p className="label-caps">얼굴</p>
        <p className="face-picker-lead">고르거나, 내 파일을 올립니다.</p>
        <div className="face-picker-grid">
          {FACE_LIBRARY.map((src) => {
            const on = selected === src;
            return (
              <button
                key={src}
                type="button"
                className={`face-picker-item ${on ? "is-on" : ""}`}
                aria-pressed={on}
                aria-label="이 얼굴 쓰기"
                onClick={() => onPick(src)}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={src} alt="" width={72} height={72} />
              </button>
            );
          })}
        </div>
        <div className="face-picker-actions">
          <button type="button" className="btn-secondary" onClick={onFile}>
            파일에서
          </button>
          <button type="button" className="btn-quiet" onClick={onClose}>
            닫기
          </button>
        </div>
      </div>
    </div>
  );
}
