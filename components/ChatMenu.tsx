"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import ShareButton from "@/components/ShareButton";

type ChatMenuProps = {
  profileName: string;
  saveLabel: string;
  saveDisabled?: boolean;
  extrasOpen?: boolean;
  compressing?: boolean;
  compressDisabled?: boolean;
  pinLabel: string;
  pinDisabled?: boolean;
  editDisabled?: boolean;
  deleteDisabled?: boolean;
  onPickProfile: () => void;
  onSave: () => void;
  onFresh: () => void;
  onExtras: () => void;
  onCompress: () => void;
  onPin: () => void;
  onEditLast: () => void;
  onDeleteLast: () => void;
  onClose: () => void;
};

export default function ChatMenu({
  profileName,
  saveLabel,
  saveDisabled = false,
  extrasOpen = false,
  compressing = false,
  compressDisabled = false,
  pinLabel,
  pinDisabled = false,
  editDisabled = false,
  deleteDisabled = false,
  onPickProfile,
  onSave,
  onFresh,
  onExtras,
  onCompress,
  onPin,
  onEditLast,
  onDeleteLast,
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
            <span className="sheet-row-hint">미리 만든 나 중에서 고릅니다.</span>
          </span>
          <span className="sheet-row-value">
            {profileName}
            <span aria-hidden="true"> ›</span>
          </span>
        </button>
        <button type="button" className="sheet-row" onClick={onFresh}>
          <span>
            <span className="sheet-row-title">새로하기</span>
            <span className="sheet-row-hint">지금 대화를 저장할지 묻습니다.</span>
          </span>
        </button>
        <button
          type="button"
          className="sheet-row"
          disabled={saveDisabled}
          onClick={onSave}
        >
          <span className="sheet-row-title">저장</span>
          <span className="sheet-row-value">{saveLabel}</span>
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
            <span className="sheet-row-hint">지난 장면을 요약으로 남깁니다.</span>
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
            <span className="sheet-row-hint">마지막 턴을 잊지 않게 둡니다.</span>
          </span>
          <span className="sheet-row-value">{pinLabel === "고정됨" ? "고정됨" : ""}</span>
        </button>
        <button
          type="button"
          className="sheet-row"
          disabled={editDisabled}
          onClick={onEditLast}
        >
          <span className="sheet-row-title">마지막 말 수정</span>
        </button>
        <button
          type="button"
          className="sheet-row is-danger"
          disabled={deleteDisabled}
          onClick={onDeleteLast}
        >
          <span className="sheet-row-title">마지막 턴 삭제</span>
        </button>
        <button type="button" className="sheet-close" onClick={onClose}>
          닫기
        </button>
      </div>
    </div>,
    document.body,
  );
}
