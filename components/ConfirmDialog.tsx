"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";

type ConfirmRequest = {
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
  message: string;
  confirmLabel?: string;
  altLabel?: string;
  danger?: boolean;
  onCancel: () => void;
  onAlt?: () => void;
  onConfirm: () => void;
};

export default function ConfirmDialog({
  message,
  confirmLabel = "확인",
  altLabel,
  danger = false,
  onCancel,
  onAlt,
  onConfirm,
}: ConfirmDialogProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") onCancel();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onCancel]);

  if (!mounted) return null;

  return createPortal(
    <div
      className="confirm-layer"
      role="dialog"
      aria-modal="true"
      aria-label={message}
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onCancel();
      }}
    >
      <div className="confirm-card">
        <p className="label-caps">이어롤</p>
        <p className="confirm-copy">{message}</p>
        <div className="confirm-actions">
          <button type="button" className="btn-quiet" onClick={onCancel}>
            취소
          </button>
          {onAlt && altLabel ? (
            <button type="button" className="btn-quiet" onClick={onAlt}>
              {altLabel}
            </button>
          ) : null}
          <button
            type="button"
            className={danger ? "btn-danger" : "btn-primary"}
            onClick={onConfirm}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}
