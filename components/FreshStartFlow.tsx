"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { useOverlayLeave } from "@/hooks/useOverlayLeave";
import { defaultSavedChatTitle } from "@/lib/savedChat";
import { FIELD_LIMITS } from "@/lib/constants";

type FreshStartFlowProps = {
  savedFull?: boolean;
  onCancel: () => void;
  onConfirm: (save: boolean, title: string) => void;
};

export default function FreshStartFlow({
  savedFull = false,
  onCancel,
  onConfirm,
}: FreshStartFlowProps) {
  const [mounted, setMounted] = useState(false);
  const [step, setStep] = useState<"ask" | "title">("ask");
  const [save, setSave] = useState(true);
  const [title, setTitle] = useState(defaultSavedChatTitle);
  const { leaveClass, dismiss } = useOverlayLeave();

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") dismiss(onCancel);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [dismiss, onCancel]);

  if (!mounted) return null;

  return createPortal(
    <div
      className={`confirm-layer ${leaveClass}`}
      role="dialog"
      aria-modal="true"
      aria-label={step === "ask" ? "대화를 새로 시작할까요?" : "어떤 제목으로 저장할까요?"}
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) dismiss(onCancel);
      }}
    >
      {step === "ask" ? (
        <div className="confirm-card is-center">
          <p className="confirm-heading">대화를 새로 시작할까요?</p>
          <p className="confirm-copy">
            {savedFull
              ? "이어하기가 가득 찼습니다. 저장하면 가장 오래된 대화가 사라집니다."
              : "저장한 대화는 ‘이어하기’에서 언제든 다시 할 수 있어요"}
          </p>
          <label className="confirm-check">
            <input
              type="checkbox"
              checked={save}
              onChange={(event) => setSave(event.target.checked)}
            />
            현재 대화 저장하기
          </label>
          <div className="confirm-actions is-split">
            <button type="button" className="btn-quiet" onClick={() => dismiss(onCancel)}>
              취소
            </button>
            <button
              type="button"
              className="btn-primary"
              onClick={() => {
                if (save) setStep("title");
                else dismiss(() => onConfirm(false, ""));
              }}
            >
              확인
            </button>
          </div>
        </div>
      ) : (
        <div className="confirm-card is-center">
          <p className="confirm-heading">어떤 제목으로 저장할까요?</p>
          <p className="confirm-copy">한 번 저장한 대화는 이어하면 자동으로 저장돼요</p>
          <div className="save-title-field">
            <input
              className="save-title-input"
              value={title}
              maxLength={FIELD_LIMITS.storyTitle}
              autoFocus
              onChange={(event) => setTitle(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  event.preventDefault();
                  dismiss(() => onConfirm(true, title.trim() || defaultSavedChatTitle()));
                }
              }}
            />
            {title ? (
              <button
                type="button"
                className="save-title-clear"
                aria-label="제목 지우기"
                onClick={() => setTitle("")}
              >
                ×
              </button>
            ) : null}
          </div>
          <div className="confirm-actions is-split">
            <button type="button" className="btn-quiet" onClick={() => dismiss(onCancel)}>
              취소
            </button>
            <button
              type="button"
              className="btn-primary"
              disabled={!title.trim()}
              onClick={() =>
                dismiss(() => onConfirm(true, title.trim() || defaultSavedChatTitle()))
              }
            >
              완료
            </button>
          </div>
        </div>
      )}
    </div>,
    document.body,
  );
}
