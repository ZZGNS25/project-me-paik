"use client";

import { useEffect, useRef, useState } from "react";
import PlayLines from "@/components/PlayLines";
import PrologueCard from "@/components/PrologueCard";
import { replyVersions } from "@/lib/messageVersions";
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
  streamingForId?: string | null;
  actionsDisabled?: boolean;
  onTruncateFrom?: (messageId: string) => void;
  onResend?: (userMessageId: string, text: string) => void;
  onRegenerate?: (userMessageId: string) => void;
  onPinTurn?: (user: ChatMessage, model?: ChatMessage) => void;
  onEditMessage?: (messageId: string, content: string) => void;
  onSetReplyVersion?: (modelId: string, index: number) => void;
  onPickMe?: () => void;
  pinFlashId?: string | null;
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
  streamingForId,
  actionsDisabled = false,
  onTruncateFrom,
  onResend,
  onRegenerate,
  onPinTurn,
  onEditMessage,
  onSetReplyVersion,
  onPickMe,
  pinFlashId,
}: ChatLogProps) {
  const feedRef = useRef<HTMLDivElement>(null);
  const endRef = useRef<HTMLDivElement>(null);
  const pinToBottom = useRef(true);
  const [away, setAway] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editDraft, setEditDraft] = useState("");
  const hasThread = messages.length > 0 || Boolean(pendingUserText);
  const showActions = Boolean(
    onTruncateFrom ||
      onResend ||
      onRegenerate ||
      onPinTurn ||
      onEditMessage ||
      onSetReplyVersion,
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
    const id = requestAnimationFrame(() => {
      endRef.current?.scrollIntoView({
        block: "end",
        behavior: streamingText ? "auto" : "smooth",
      });
    });
    return () => cancelAnimationFrame(id);
  }, [messages, pendingUserText, streamingText]);

  function startEdit(id: string, content: string) {
    setEditingId(id);
    setEditDraft(content);
  }

  function saveEdit() {
    if (!editingId || !editDraft.trim()) return;
    onEditMessage?.(editingId, editDraft);
    setEditingId(null);
    setEditDraft("");
  }

  function cancelEdit() {
    setEditingId(null);
    setEditDraft("");
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
              turn.user.role === "user" ? turn.user.id : undefined;
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
                  onCancelEdit={cancelEdit}
                  onResend={
                    onResend && regenId
                      ? () => onResend(regenId, turn.user.content)
                      : undefined
                  }
                  onPin={onPinTurn ? () => onPinTurn(turn.user, model) : undefined}
                  pinFlashed={pinFlashId === turn.user.id}
                  onTruncate={
                    onTruncateFrom ? () => onTruncateFrom(turn.user.id) : undefined
                  }
                />
              ) : null}
              {model ? (
                <PlayLines
                  messageId={model.id}
                  content={
                    streamingForId === model.id && streamingText
                      ? streamingText
                      : model.content
                  }
                  characterName={characterName}
                  characterPhoto={characterPhoto}
                  userName={userName}
                  userPhoto={userPhoto}
                  castNotes={castNotes}
                  streaming={streamingForId === model.id && Boolean(streamingText)}
                  editing={editingId === model.id}
                  editDraft={editDraft}
                  actionsDisabled={actionsDisabled}
                  showActions={showActions && !pendingUserText && !streamingText}
                  replyPage={
                    streamingForId === model.id && streamingText
                      ? undefined
                      : replyVersions(model)
                  }
                  onSetReplyVersion={
                    onSetReplyVersion
                      ? (index) => onSetReplyVersion(model.id, index)
                      : undefined
                  }
                  onEditDraft={setEditDraft}
                  onStartEdit={() => startEdit(model.id, model.content)}
                  onSaveEdit={saveEdit}
                  onCancelEdit={cancelEdit}
                  onRegenerate={
                    onRegenerate && regenId
                      ? () => onRegenerate(regenId)
                      : undefined
                  }
                  onPin={onPinTurn ? () => onPinTurn(turn.user, model) : undefined}
                  pinFlashed={pinFlashId === turn.user.id}
                  onTruncate={
                    onTruncateFrom ? () => onTruncateFrom(model.id) : undefined
                  }
                />
              ) : null}
            </div>
            );
          })}
          {pendingUserText || (streamingText && !streamingForId) ? (
            <div className="chat-thread">
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
              {streamingText && !streamingForId ? (
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
            </div>
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
