"use client";

import { useEffect, useRef } from "react";
import AvatarCircle from "@/components/AvatarCircle";
import MarkupText from "@/components/MarkupText";
import PrologueCard from "@/components/PrologueCard";
import { parseModelReply } from "@/lib/parseMessage";
import type { ChatMessage, ParsedLine } from "@/lib/types";

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
  const endRef = useRef<HTMLDivElement>(null);
  const hasThread = messages.length > 0 || Boolean(pendingUserText);
  const showActions = Boolean(onTruncateFrom || onRegenerate || onPinTurn);

  useEffect(() => {
    endRef.current?.scrollIntoView({ block: "end", behavior: "smooth" });
  }, [messages, pendingUserText, streamingText]);

  if (!hasThread) {
    return (
      <div className="chat-feed">
        <div className="chat-feed-inner is-empty">
          {prologue?.trim() ? (
            <PrologueCard text={prologue} />
          ) : (
            <p className="chat-empty">첫 말을 건네 보세요.</p>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="chat-feed">
      <div className="chat-feed-inner">
        {prologue?.trim() ? <PrologueCard text={prologue} compact /> : null}
        {groupTurns(messages).map((turn) => (
          <div key={turn.user.id} className="chat-thread">
            {turn.user.role === "user" ? (
              <UserBlock
                text={turn.user.content}
                photo={userPhoto}
                name={userName}
              />
            ) : null}
            {turn.model ? (
              <ModelBlock
                content={turn.model.content}
                photo={characterPhoto}
                name={characterName}
              />
            ) : null}
            {showActions && !pendingUserText && !streamingText ? (
              <div className="turn-actions">
                {onTruncateFrom ? (
                  <button
                    type="button"
                    className="ghost-link is-danger"
                    disabled={actionsDisabled}
                    onClick={() => onTruncateFrom(turn.user.id)}
                  >
                    여기부터 삭제
                  </button>
                ) : null}
                {onRegenerate && turn.user.role === "user" ? (
                  <button
                    type="button"
                    className="ghost-link"
                    disabled={actionsDisabled}
                    onClick={() => onRegenerate(turn.user.id)}
                  >
                    답 다시 생성
                  </button>
                ) : null}
                {onPinTurn ? (
                  <button
                    type="button"
                    className="ghost-link"
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
          <UserBlock text={pendingUserText} photo={userPhoto} name={userName} />
        ) : null}
        {streamingText ? (
          <ModelBlock
            content={streamingText}
            photo={characterPhoto}
            name={characterName}
            streaming
          />
        ) : pendingUserText ? (
          <p className="streaming-wait">쓰는 중…</p>
        ) : null}
        <div ref={endRef} />
      </div>
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

function splitLines(lines: ParsedLine[]) {
  return {
    narrations: lines.filter((line) => line.kind === "narration"),
    speeches: lines.filter((line) => line.kind !== "narration"),
  };
}

function joinTexts(lines: ParsedLine[]) {
  return lines
    .map((line) => line.text)
    .filter(Boolean)
    .join("\n");
}

function UserBlock({
  text,
  photo,
  name,
}: {
  text: string;
  photo?: string;
  name?: string;
}) {
  const { narrations, speeches } = splitLines(parseModelReply(text));
  const scene = joinTexts(narrations);
  const speech = joinTexts(speeches);

  return (
    <div className="appear chat-turn is-user">
      {scene ? (
        <p className="scene-narration is-user">
          <MarkupText text={scene} />
        </p>
      ) : null}
      {speech ? (
        <div className="chat-speech is-user">
          <div className="bubble-user">
            <p className="whitespace-pre-wrap">
              <MarkupText text={speech} />
            </p>
          </div>
          <AvatarCircle src={photo} name={name || "나"} size="sm" />
        </div>
      ) : null}
    </div>
  );
}

function ModelBlock({
  content,
  photo,
  name,
  streaming = false,
}: {
  content: string;
  photo?: string;
  name?: string;
  streaming?: boolean;
}) {
  const lines = parseModelReply(content);
  const { narrations, speeches } = splitLines(lines);
  const last = lines[lines.length - 1];
  const scene = joinTexts(narrations);
  const speech = joinTexts(speeches);
  const speechKind = speeches.some((line) => line.kind === "fallback")
    ? "fallback-box"
    : "bubble-model";

  return (
    <div className="appear chat-turn">
      {scene ? (
        <p
          className={`scene-narration ${
            streaming && last?.kind === "narration" ? "is-streaming" : ""
          }`}
        >
          <MarkupText text={scene} />
        </p>
      ) : null}
      {speech ? (
        <div className="chat-speech">
          <AvatarCircle src={photo} name={name} size="sm" />
          <div
            className={`${speechKind} ${
              streaming && last?.kind !== "narration" ? "is-streaming" : ""
            }`}
          >
            <p className="whitespace-pre-wrap">
              <MarkupText text={speech} />
            </p>
          </div>
        </div>
      ) : null}
    </div>
  );
}
