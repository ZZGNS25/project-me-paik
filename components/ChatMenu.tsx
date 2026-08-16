"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import ShareButton from "@/components/ShareButton";

type ChatMenuProps = {
  profileName: string;
  saveLabel: string;
  saveDisabled?: boolean;
  extrasOpen?: boolean;
  deleteLastDisabled?: boolean;
  compressing?: boolean;
  pinLabel?: string;
  pinDisabled?: boolean;
  compressDisabled?: boolean;
  onPickProfile: () => void;
  onSave: () => void;
  onFresh: () => void;
  onContinue: () => void;
  onExtras: () => void;
  onCompress: () => void;
  onPin: () => void;
  onDeleteLast: () => void;
  onDeleteStory: () => void;
  onClose: () => void;
};

export default function ChatMenu({
  profileName,
  saveLabel,
  saveDisabled = false,
  extrasOpen = false,
  deleteLastDisabled = false,
  compressing = false,
  pinLabel = "고정",
  pinDisabled = false,
  compressDisabled = false,
  onPickProfile,
  onSave,
  onFresh,
  onContinue,
  onExtras,
  onCompress,
  onPin,
  onDeleteLast,
  onDeleteStory,
  onClose,
}: ChatMenuProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  if (!mounted) return null;

  return createPortal(
    <div
      className="chat-sheet-layer"
      role="dialog"
      aria-modal="true"
      aria-label="대화 메뉴"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div className="chat-sheet">
        <p className="label-caps px-2">이 대화</p>
        <button type="button" className="sheet-row" onClick={onPickProfile}>
          <span>
            <span className="sheet-row-title">대화 프로필</span>
            <span className="sheet-row-hint">목록에서 나를 고릅니다.</span>
          </span>
          <span className="sheet-row-value">
            {profileName}
            <span aria-hidden="true"> ›</span>
          </span>
        </button>
        <button type="button" className="sheet-row" onClick={onFresh}>
          <span>
            <span className="sheet-row-title">새로하기</span>
            <span className="sheet-row-hint">같은 세계로 대화를 처음부터 다시 엽니다.</span>
          </span>
        </button>
        <button type="button" className="sheet-row" onClick={onContinue}>
          <span>
            <span className="sheet-row-title">이어하기</span>
            <span className="sheet-row-hint">남긴 대화를 골라 이어갑니다.</span>
          </span>
          <span className="sheet-row-value">›</span>
        </button>
        <ShareButton align="row" />
        <button type="button" className="sheet-row" onClick={onExtras}>
          <span>
            <span className="sheet-row-title">인물 추가</span>
            <span className="sheet-row-hint">세계관과 엑스트라를 고칩니다.</span>
          </span>
          <span className="sheet-row-value">{extrasOpen ? "닫기" : ""}</span>
        </button>
        <button
          type="button"
          className="sheet-row"
          disabled={compressDisabled}
          onClick={onCompress}
        >
          <span>
            <span className="sheet-row-title">압축</span>
            <span className="sheet-row-hint">앞선 장면을 요약으로 남깁니다.</span>
          </span>
          <span className="sheet-row-value">{compressing ? "압축 중…" : ""}</span>
        </button>
        <button
          type="button"
          className="sheet-row"
          disabled={pinDisabled}
          onClick={onPin}
        >
          <span>
            <span className="sheet-row-title">고정</span>
            <span className="sheet-row-hint">마지막 턴을 기억에 남깁니다.</span>
          </span>
          <span className="sheet-row-value">{pinLabel === "고정" ? "" : pinLabel}</span>
        </button>
        <button
          type="button"
          className="sheet-row is-danger"
          disabled={deleteLastDisabled}
          onClick={onDeleteLast}
        >
          <span className="sheet-row-title">마지막 턴 삭제</span>
        </button>
        <button
          type="button"
          className="sheet-row is-danger"
          onClick={onDeleteStory}
        >
          <span>
            <span className="sheet-row-title">이야기 삭제</span>
            <span className="sheet-row-hint">이 세계와 대화를 목록에서 지웁니다.</span>
          </span>
        </button>
        <div className="sheet-foot">
          <button
            type="button"
            className="sheet-close"
            disabled={saveDisabled}
            onClick={onSave}
          >
            {saveLabel || "지금 남기기"}
          </button>
          <button type="button" className="sheet-close" onClick={onClose}>
            닫기
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}
