"use client";

import { useEffect, useRef, useState } from "react";
import AvatarCircle from "@/components/AvatarCircle";
import MarkupText from "@/components/MarkupText";
import PrologueCard from "@/components/PrologueCard";
import { isUserSpeaker, parseModelReply } from "@/lib/parseMessage";
import type { ChatMessage } from "@/lib/types";

type ChatLogProps = {
  messages: ChatMessage[];
  prologue?: string;
  characterPhoto?: string;
  characterName?: string;
  userPhoto?: string;
  userName?: string;
  pendingUserText?: string;
  streamingText?: string;
  actionsDisabled?: boolean;
  onTruncateFrom?: (messageId: string) => void;
  onRegenerate?: (userMessageId: string) => void;
  onPinTurn?: (user: ChatMessage, model?: ChatMessage) => void;
};

const NEAR_BOTTOM = 96;

export default function ChatLog({
  messages,
  prologue,
  characterPhoto,
  characterName,
  userPhoto,
  userName,
  pendingUserText,
  streamingText,
  actionsDisabled = false,
  onTruncateFrom,
  onRegenerate,
  onPinTurn,
}: ChatLogProps) {
  const feedRef = useRef<HTMLDivElement>(null);
  const endRef = useRef<HTMLDivElement>(null);
  const pinToBottom = useRef(true);
  const [away, setAway] = useState(false);
  const hasThread = messages.length > 0 || Boolean(pendingUserText);
  const showActions = Boolean(onTruncateFrom || onRegenerate || onPinTurn);

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
          {groupTurns(messages).map((turn) => (
            <div key={turn.user.id} className="chat-thread">
              {turn.user.role === "user" ? (
                <PlayLines
                  content={turn.user.content}
                  characterName={characterName}
                  characterPhoto={characterPhoto}
                  userName={userName}
                  userPhoto={userPhoto}
                  fromUser
                />
              ) : null}
              {turn.model ? (
                <PlayLines
                  content={turn.model.content}
                  characterName={characterName}
                  characterPhoto={characterPhoto}
                  userName={userName}
                  userPhoto={userPhoto}
                />
              ) : null}
              {showActions && !pendingUserText && !streamingText ? (
                <div className="turn-actions">
                  {onTruncateFrom ? (
                    <button
                      type="button"
                      className="btn-danger"
                      disabled={actionsDisabled}
                      onClick={() => onTruncateFrom(turn.user.id)}
                    >
                      여기부터 삭제
                    </button>
                  ) : null}
                  {onRegenerate && turn.user.role === "user" ? (
                    <button
                      type="button"
                      className="btn-quiet"
                      disabled={actionsDisabled}
                      onClick={() => onRegenerate(turn.user.id)}
                    >
                      답 다시 생성
                    </button>
                  ) : null}
                  {onPinTurn ? (
                    <button
                      type="button"
                      className="btn-quiet"
                      disabled={actionsDisabled}
                      onClick={() => onPinTurn(turn.user, turn.model)}
                    >
                      사건 고정
                    </button>
                  ) : null}
                </div>
              ) : null}
            </div>
          ))}
          {pendingUserText ? (
            <PlayLines
              content={pendingUserText}
              characterName={characterName}
              characterPhoto={characterPhoto}
              userName={userName}
              userPhoto={userPhoto}
              fromUser
            />
          ) : null}
          {streamingText ? (
            <PlayLines
              content={streamingText}
              characterName={characterName}
              characterPhoto={characterPhoto}
              userName={userName}
              userPhoto={userPhoto}
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
  fromUser = false,
  streaming = false,
}: {
  content: string;
  characterName?: string;
  characterPhoto?: string;
  userName?: string;
  userPhoto?: string;
  fromUser?: boolean;
  streaming?: boolean;
}) {
  const lines = parseModelReply(content);
  const last = lines[lines.length - 1];

  return (
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
            : "";
        const label = mine ? userName || "나" : speaker || characterName;

        return (
          <div
            key={index}
            className={`chat-turn ${mine ? "is-user" : ""}`}
          >
            <div className={`chat-speech ${mine ? "is-user" : ""}`}>
              {mine ? null : <AvatarCircle src={photo} name={label} size="sm" />}
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
              {mine ? <AvatarCircle src={photo} name={label || "나"} size="sm" /> : null}
            </div>
          </div>
        );
      })}
    </div>
  );
}
