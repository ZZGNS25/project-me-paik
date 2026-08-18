"use client";

import { memo } from "react";
import AvatarCircle from "@/components/AvatarCircle";
import Icon from "@/components/Icon";
import MarkupText from "@/components/MarkupText";
import { isUserSpeaker, parseModelReply } from "@/lib/parseMessage";
import type { CastNote } from "@/lib/types";

export type PlayLinesProps = {
  messageId?: string;
  content: string;
  characterName?: string;
  characterPhoto?: string;
  userName?: string;
  userPhoto?: string;
  castNotes?: CastNote[];
  fromUser?: boolean;
  streaming?: boolean;
  editing?: boolean;
  editDraft?: string;
  actionsDisabled?: boolean;
  showActions?: boolean;
  onPickMe?: () => void;
  onEditDraft?: (value: string) => void;
  onStartEdit?: () => void;
  onSaveEdit?: () => void;
  onCancelEdit?: () => void;
  onResend?: () => void;
  onRegenerate?: () => void;
  onPin?: () => void;
  pinFlashed?: boolean;
  onTruncate?: () => void;
  replyPage?: { index: number; count: number };
  onSetReplyVersion?: (index: number) => void;
};

function samePerson(a?: string, b?: string) {
  return Boolean(a?.trim() && b?.trim() && a.trim() === b.trim());
}

const PlayLines = memo(function PlayLines({
  content,
  characterName,
  characterPhoto,
  userName,
  userPhoto,
  castNotes = [],
  fromUser = false,
  streaming = false,
  editing = false,
  editDraft = "",
  actionsDisabled = false,
  showActions = false,
  onPickMe,
  onEditDraft,
  onStartEdit,
  onSaveEdit,
  onCancelEdit,
  onResend,
  onRegenerate,
  onPin,
  pinFlashed = false,
  onTruncate,
  replyPage,
  onSetReplyVersion,
}: PlayLinesProps) {
  const lines = parseModelReply(content, streaming);
  const last = lines[lines.length - 1];

  return (
    <div className={`chat-msg ${fromUser ? "is-user" : ""} ${editing ? "is-editing" : ""}`}>
      {editing ? (
        <div className={`chat-edit ${fromUser ? "is-user" : ""}`}>
          <textarea
            className="chat-edit-box"
            value={editDraft}
            rows={6}
            autoFocus
            onChange={(event) => onEditDraft?.(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Escape") onCancelEdit?.();
              if (event.key === "Enter" && (event.metaKey || event.ctrlKey)) {
                event.preventDefault();
                onSaveEdit?.();
              }
            }}
          />
          <div className="chat-edit-actions">
            <button
              type="button"
              className="chat-edit-cancel"
              onClick={onCancelEdit}
              aria-label="수정 취소"
              title="없던 일로"
            >
              <Icon name="close" size={18} />
            </button>
            <button
              type="button"
              className="chat-edit-save"
              disabled={!editDraft.trim()}
              onClick={onSaveEdit}
              aria-label="수정 저장"
              title="이 내용으로"
            >
              <Icon name="check" size={18} />
            </button>
          </div>
        </div>
      ) : (
        <div className="chat-turn-stack">
          {lines.map((line, index) => {
            const live = streaming && line === last;
            if (line.kind === "narration") {
              return (
                <p key={index} className={`scene-narration ${live ? "is-streaming" : ""}`}>
                  <MarkupText text={line.text} />
                </p>
              );
            }

            const speaker = line.kind === "speech" ? line.name : "";
            const mine =
              line.kind === "speech" ? isUserSpeaker(speaker, userName) : fromUser;
            const photo = mine
              ? userPhoto
              : samePerson(speaker, characterName)
                ? characterPhoto
                : castNotes.find((note) => samePerson(note.name, speaker))?.photo ||
                  "";
            const label = mine ? userName || "나" : speaker || characterName;

            return (
              <div
                key={index}
                className={`chat-turn ${mine ? "is-user" : ""}`}
              >
                <div className={`chat-speech ${mine ? "is-user" : ""}`}>
                  {mine ? null : <AvatarCircle src={photo} name={label} size="sm" />}
                  <div className={`chat-bubbles ${mine ? "is-user" : ""}`}>
                    {mine && onPickMe ? (
                      <button
                        type="button"
                        className="chat-speaker is-me"
                        onClick={onPickMe}
                      >
                        {userName?.trim() || "나"}
                      </button>
                    ) : (
                      <p className="chat-speaker">{label}</p>
                    )}
                    <div
                      className={`${
                        mine
                          ? "bubble-user"
                          : line.kind === "fallback"
                            ? "fallback-box"
                            : "bubble-model"
                      } ${live ? "is-streaming" : ""}`}
                    >
                      <p className="whitespace-pre-wrap">
                        <MarkupText text={line.text} />
                      </p>
                    </div>
                  </div>
                  {mine ? (
                    <AvatarCircle src={photo} name={label || "나"} size="sm" />
                  ) : null}
                </div>
              </div>
            );
          })}
        </div>
      )}
      {showActions && !editing ? (
        <div className={`chat-msg-actions ${replyPage && replyPage.count > 1 ? "is-shown" : ""}`}>
          {onStartEdit ? (
            <button
              type="button"
              className="icon-btn is-tiny"
              disabled={actionsDisabled}
              onClick={onStartEdit}
              aria-label="수정"
              title="수정"
            >
              <Icon name="edit" size={15} />
            </button>
          ) : null}
          {onResend ? (
            <button
              type="button"
              className="icon-btn is-tiny"
              disabled={actionsDisabled}
              onClick={onResend}
              aria-label="이 말로 다시"
              title="이 말로 다시"
            >
              <Icon name="resend" size={15} />
            </button>
          ) : null}
          {onRegenerate ? (
            <button
              type="button"
              className="icon-btn is-tiny"
              disabled={actionsDisabled}
              onClick={onRegenerate}
              aria-label="다시 생성"
              title="다시 생성"
            >
              <Icon name="regen" size={15} />
            </button>
          ) : null}
          {replyPage && replyPage.count > 1 && onSetReplyVersion ? (
            <div className="reply-pager">
              <button
                type="button"
                className="icon-btn is-tiny"
                disabled={actionsDisabled || replyPage.index <= 0}
                onClick={() => onSetReplyVersion(replyPage.index - 1)}
                aria-label="이전 답"
                title="이전 답"
              >
                <Icon name="prev" size={15} />
              </button>
              <span className="reply-pager-n">
                {replyPage.index + 1}/{replyPage.count}
              </span>
              <button
                type="button"
                className="icon-btn is-tiny"
                disabled={actionsDisabled || replyPage.index >= replyPage.count - 1}
                onClick={() => onSetReplyVersion(replyPage.index + 1)}
                aria-label="다음 답"
                title="다음 답"
              >
                <Icon name="next" size={15} />
              </button>
            </div>
          ) : null}
          {onPin ? (
            <button
              type="button"
              className={`icon-btn is-tiny ${pinFlashed ? "is-on" : ""}`}
              disabled={actionsDisabled}
              onClick={onPin}
              aria-label={pinFlashed ? "고정됨" : "사건 고정"}
              title={pinFlashed ? "고정됨" : "고정"}
            >
              <Icon name="pin" size={15} />
            </button>
          ) : null}
          {onTruncate ? (
            <button
              type="button"
              className="icon-btn is-tiny is-danger"
              disabled={actionsDisabled}
              onClick={onTruncate}
              aria-label="여기부터 삭제"
              title="여기부터 삭제"
            >
              <Icon name="trash" size={15} />
            </button>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}, function samePlayLines(prev, next) {
  return (
    prev.content === next.content &&
    prev.streaming === next.streaming &&
    prev.editing === next.editing &&
    prev.editDraft === next.editDraft &&
    prev.actionsDisabled === next.actionsDisabled &&
    prev.showActions === next.showActions &&
    prev.fromUser === next.fromUser &&
    prev.pinFlashed === next.pinFlashed &&
    prev.characterName === next.characterName &&
    prev.userName === next.userName &&
    prev.characterPhoto === next.characterPhoto &&
    prev.userPhoto === next.userPhoto &&
    prev.replyPage?.index === next.replyPage?.index &&
    prev.replyPage?.count === next.replyPage?.count
  );
});

export default PlayLines;
