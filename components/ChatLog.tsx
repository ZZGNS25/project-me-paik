"use client";

import { useEffect, useRef, useState } from "react";
import AvatarCircle from "@/components/AvatarCircle";
import Icon from "@/components/Icon";
import MarkupText from "@/components/MarkupText";
import PrologueCard from "@/components/PrologueCard";
import { isUserSpeaker, parseModelReply } from "@/lib/parseMessage";
import type { CastNote, ChatMessage } from "@/lib/types";

type ChatLogProps = {
  messages: ChatMessage[];
  prologue?: string;
  characterPhoto?: string;
  characterName?: string;
  userPhoto?: string;
  userName?: string;
  castNotes?: CastNote[];
  pendingUserText?: string;
  streamingText?: string;
  actionsDisabled?: boolean;
  onTruncateFrom?: (messageId: string) => void;
  onRegenerate?: (userMessageId: string) => void;
  onPinTurn?: (user: ChatMessage, model?: ChatMessage) => void;
  onEditMessage?: (messageId: string, content: string) => void;
  onPickMe?: () => void;
};

const NEAR_BOTTOM = 96;

export default function ChatLog({
  messages,
  prologue,
  characterPhoto,
  characterName,
  userPhoto,
  userName,
  castNotes = [],
  pendingUserText,
  streamingText,
  actionsDisabled = false,
  onTruncateFrom,
  onRegenerate,
  onPinTurn,
  onEditMessage,
  onPickMe,
}: ChatLogProps) {
  const feedRef = useRef<HTMLDivElement>(null);
  const endRef = useRef<HTMLDivElement>(null);
  const pinToBottom = useRef(true);
  const [away, setAway] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editDraft, setEditDraft] = useState("");
  const hasThread = messages.length > 0 || Boolean(pendingUserText);
  const showActions = Boolean(
    onTruncateFrom || onRegenerate || onPinTurn || onEditMessage,
  );

  function measure() {
    const el = feedRef.current;
    if (!el) return;
    const near = el.scrollHeight - el.scrollTop - el.clientHeight < NEAR_BOTTOM;
    pinToBottom.current = near;
    setAway(!near);
  }

  function jumpToBottom() {
    pinToBottom.current = true;
    setAway(false);
    endRef.current?.scrollIntoView({ block: "end" });
  }

  useEffect(() => {
    if (!pinToBottom.current) return;
    endRef.current?.scrollIntoView({
      block: "end",
      behavior: streamingText ? "auto" : "smooth",
    });
  }, [messages, pendingUserText, streamingText]);

  function startEdit(id: string, content: string) {
    setEditingId(id);
    setEditDraft(content);
  }

  function saveEdit() {
    if (!editingId || !editDraft.trim()) return;
    onEditMessage?.(editingId, editDraft);
    setEditingId(null);
  }

  if (!hasThread) {
    return (
      <div className="chat-feed-wrap">
        <div className="chat-feed">
          <div className="chat-feed-inner is-empty">
            {prologue?.trim() ? (
              <PrologueCard text={prologue} />
            ) : (
              <p className="chat-empty">첫 말을 건네 보세요.</p>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="chat-feed-wrap">
      <div className="chat-feed" ref={feedRef} onScroll={measure}>
        <div className="chat-feed-inner">
          {prologue?.trim() ? <PrologueCard text={prologue} compact /> : null}
          {groupTurns(messages).map((turn) => {
            const model = turn.model;
            const regenId =
              turn.user.role === "user" && model ? turn.user.id : undefined;
            return (
            <div key={turn.user.id} className="chat-thread">
              {turn.user.role === "user" ? (
                <PlayLines
                  messageId={turn.user.id}
                  content={turn.user.content}
                  characterName={characterName}
                  characterPhoto={characterPhoto}
                  userName={userName}
                  userPhoto={userPhoto}
                  castNotes={castNotes}
                  fromUser
                  editing={editingId === turn.user.id}
                  editDraft={editDraft}
                  actionsDisabled={actionsDisabled}
                  showActions={showActions && !pendingUserText && !streamingText}
                  onPickMe={onPickMe}
                  onEditDraft={setEditDraft}
                  onStartEdit={() => startEdit(turn.user.id, turn.user.content)}
                  onSaveEdit={saveEdit}
                  onCancelEdit={() => setEditingId(null)}
                  onPin={onPinTurn ? () => onPinTurn(turn.user, model) : undefined}
                  onTruncate={
                    onTruncateFrom ? () => onTruncateFrom(turn.user.id) : undefined
                  }
                />
              ) : null}
              {model ? (
                <PlayLines
                  messageId={model.id}
                  content={model.content}
                  characterName={characterName}
                  characterPhoto={characterPhoto}
                  userName={userName}
                  userPhoto={userPhoto}
                  castNotes={castNotes}
                  editing={editingId === model.id}
                  editDraft={editDraft}
                  actionsDisabled={actionsDisabled}
                  showActions={showActions && !pendingUserText && !streamingText}
                  onEditDraft={setEditDraft}
                  onStartEdit={() => startEdit(model.id, model.content)}
                  onSaveEdit={saveEdit}
                  onCancelEdit={() => setEditingId(null)}
                  onRegenerate={
                    onRegenerate && regenId
                      ? () => onRegenerate(regenId)
                      : undefined
                  }
                  onPin={onPinTurn ? () => onPinTurn(turn.user, model) : undefined}
                  onTruncate={
                    onTruncateFrom ? () => onTruncateFrom(model.id) : undefined
                  }
                />
              ) : null}
            </div>
            );
          })}
          {pendingUserText ? (
            <PlayLines
              content={pendingUserText}
              characterName={characterName}
              characterPhoto={characterPhoto}
              userName={userName}
              userPhoto={userPhoto}
              castNotes={castNotes}
              fromUser
              onPickMe={onPickMe}
            />
          ) : null}
          {streamingText ? (
            <PlayLines
              content={streamingText}
              characterName={characterName}
              characterPhoto={characterPhoto}
              userName={userName}
              userPhoto={userPhoto}
              castNotes={castNotes}
              streaming
            />
          ) : pendingUserText ? (
            <p className="streaming-wait">쓰는 중…</p>
          ) : null}
          <div ref={endRef} />
        </div>
      </div>
      {away ? (
        <button type="button" className="jump-bottom" onClick={jumpToBottom}>
          맨 아래로
        </button>
      ) : null}
    </div>
  );
}

function groupTurns(messages: ChatMessage[]) {
  const turns: { user: ChatMessage; model?: ChatMessage }[] = [];
  for (const message of messages) {
    if (message.role === "user") {
      turns.push({ user: message });
      continue;
    }
    const last = turns[turns.length - 1];
    if (last && !last.model) {
      last.model = message;
    } else {
      turns.push({ user: message, model: message });
    }
  }
  return turns;
}

function samePerson(a?: string, b?: string) {
  return Boolean(a?.trim() && b?.trim() && a.trim() === b.trim());
}

function PlayLines({
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
  onRegenerate,
  onPin,
  onTruncate,
}: {
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
  onRegenerate?: () => void;
  onPin?: () => void;
  onTruncate?: () => void;
}) {
  const lines = parseModelReply(content);
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
            <button type="button" className="btn-primary" onClick={onSaveEdit}>
              저장
            </button>
            <button type="button" className="btn-quiet" onClick={onCancelEdit}>
              취소
            </button>
          </div>
        </div>
      ) : (
        <div className="appear chat-turn-stack">
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
        <div className="chat-msg-actions">
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
          {onRegenerate ? (
            <button
              type="button"
              className="icon-btn is-tiny"
              disabled={actionsDisabled}
              onClick={onRegenerate}
              aria-label="답 다시 생성"
              title="다시 생성"
            >
              <Icon name="regen" size={15} />
            </button>
          ) : null}
          {onPin ? (
            <button
              type="button"
              className="icon-btn is-tiny"
              disabled={actionsDisabled}
              onClick={onPin}
              aria-label="사건 고정"
              title="고정"
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
}
