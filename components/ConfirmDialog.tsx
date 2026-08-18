"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { useOverlayLeave } from "@/hooks/useOverlayLeave";

type ConfirmRequest = {
  title?: string;
  message: string;
  confirmLabel?: string;
  altLabel?: string;
  danger?: boolean;
  run: () => void | Promise<void>;
  runAlt?: () => void | Promise<void>;
};

export function useConfirm() {
  const [request, setRequest] = useState<ConfirmRequest | null>(null);

  const dialog = request ? (
    <ConfirmDialog
      title={request.title}
      message={request.message}
      confirmLabel={request.confirmLabel}
      altLabel={request.altLabel}
      danger={request.danger}
      onCancel={() => setRequest(null)}
      onAlt={
        request.runAlt
          ? () => {
              const run = request.runAlt;
              setRequest(null);
              void run?.();
            }
          : undefined
      }
      onConfirm={() => {
        const run = request.run;
        setRequest(null);
        void run();
      }}
    />
  ) : null;

  return {
    ask(next: ConfirmRequest) {
      setRequest(next);
    },
    dialog,
  };
}

type ConfirmDialogProps = {
  title?: string;
  message: string;
  confirmLabel?: string;
  altLabel?: string;
  danger?: boolean;
  onCancel: () => void;
  onAlt?: () => void;
  onConfirm: () => void;
};

export default function ConfirmDialog({
  title,
  message,
  confirmLabel = "확인",
  altLabel,
  danger = false,
  onCancel,
  onAlt,
  onConfirm,
}: ConfirmDialogProps) {
  const [mounted, setMounted] = useState(false);
  const { leaveClass, dismiss } = useOverlayLeave();
  const heading = title || message;

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
      aria-label={heading}
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) dismiss(onCancel);
      }}
    >
      <div className="confirm-card is-center">
        <p className="confirm-heading">{heading}</p>
        {title ? <p className="confirm-copy">{message}</p> : null}
        <div className="confirm-actions is-split">
          <button type="button" className="btn-quiet" onClick={() => dismiss(onCancel)}>
            취소
          </button>
          {onAlt && altLabel ? (
            <button type="button" className="btn-quiet" onClick={() => dismiss(onAlt)}>
              {altLabel}
            </button>
          ) : null}
          <button
            type="button"
            className={danger ? "btn-danger" : "btn-primary"}
            onClick={() => dismiss(onConfirm)}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}
