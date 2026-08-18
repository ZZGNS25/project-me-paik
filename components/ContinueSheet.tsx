"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import Icon from "@/components/Icon";
import { useOverlayLeave } from "@/hooks/useOverlayLeave";
import { SAVED_CHATS_MAX, continuePreview, continueStamp } from "@/lib/savedChat";
import { storyTitle } from "@/lib/storyTitle";
import type { SettingRecord } from "@/lib/types";

type ContinueSheetProps = {
  stories: SettingRecord[];
  currentId?: string | null;
  onPick: (id: string) => void;
  onRename?: (id: string, title: string) => void;
  onDelete?: (id: string) => void;
  onClose: () => void;
};

export default function ContinueSheet({
  stories,
  currentId,
  onPick,
  onRename,
  onDelete,
  onClose,
}: ContinueSheetProps) {
  const [menuId, setMenuId] = useState<string | null>(null);
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [draft, setDraft] = useState("");
  const { leaveClass, dismiss } = useOverlayLeave();

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") {
        if (renamingId) {
          setRenamingId(null);
          return;
        }
        if (menuId) {
          setMenuId(null);
          return;
        }
        dismiss(onClose);
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [dismiss, menuId, onClose, renamingId]);

  if (typeof document === "undefined") return null;

  return createPortal(
    <div
      className={`continue-layer ${leaveClass}`}
      role="dialog"
      aria-modal="true"
      aria-label="이어하기"
    >
      <div className="continue-page">
        <div className="continue-head">
          <button
            type="button"
            className="continue-back"
            onClick={() => dismiss(onClose)}
            aria-label="닫기"
          >
            <Icon name="prev" size={18} />
          </button>
          <h2 className="continue-title">이어하기</h2>
        </div>
        <p className="continue-count">
          {stories.length}/{SAVED_CHATS_MAX}
        </p>
        {stories.length === 0 ? (
          <p className="continue-empty">아직 저장한 대화가 없습니다.</p>
        ) : (
          <ul className="continue-list">
            {stories.map((item) => {
              const stamp = continueStamp(item.updatedAt);
              const preview = continuePreview(item);
              const renaming = renamingId === item.id;
              return (
                <li
                  key={item.id}
                  className={`continue-row ${item.id === currentId ? "is-active" : ""}`}
                >
                  {renaming ? (
                    <form
                      className="continue-rename"
                      onSubmit={(event) => {
                        event.preventDefault();
                        const next = draft.trim();
                        if (next) onRename?.(item.id, next);
                        setRenamingId(null);
                      }}
                    >
                      <input
                        className="save-title-input"
                        value={draft}
                        autoFocus
                        onChange={(event) => setDraft(event.target.value)}
                        onBlur={() => setRenamingId(null)}
                      />
                    </form>
                  ) : (
                    <button
                      type="button"
                      className="continue-hit"
                      onClick={() => dismiss(() => onPick(item.id))}
                    >
                      <span className="continue-name">{storyTitle(item)}</span>
                      <span className="continue-meta">
                        {stamp ? `${stamp} | ${preview}` : preview}
                      </span>
                    </button>
                  )}
                  <div className="continue-more">
                    <button
                      type="button"
                      className="icon-btn is-tiny"
                      aria-label="더보기"
                      onClick={() =>
                        setMenuId((current) => (current === item.id ? null : item.id))
                      }
                    >
                      <Icon name="more" size={16} />
                    </button>
                    {menuId === item.id ? (
                      <div className="continue-menu">
                        {onRename ? (
                          <button
                            type="button"
                            onClick={() => {
                              setDraft(storyTitle(item));
                              setRenamingId(item.id);
                              setMenuId(null);
                            }}
                          >
                            이름 바꾸기
                          </button>
                        ) : null}
                        {onDelete ? (
                          <button
                            type="button"
                            className="is-danger"
                            onClick={() => {
                              setMenuId(null);
                              onDelete(item.id);
                            }}
                          >
                            삭제
                          </button>
                        ) : null}
                      </div>
                    ) : null}
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>,
    document.body,
  );
}
