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
  onEditLast?: () => void;
  onDeleteLast?: () => void;
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
  onEditLast,
  onDeleteLast,
}: ChatLogProps) {
  const endRef = useRef<HTMLDivElement>(null);
  const hasThread = messages.length > 0 || Boolean(pendingUserText);

  useEffect(() => {
    endRef.current?.scrollIntoView({ block: "end" });
  }, [messages, pendingUserText, streamingText]);

  if (!hasThread) {
    return (
      <div className="flex flex-1 items-center justify-center overflow-y-auto px-6 py-8">
        {prologue?.trim() ? (
          <PrologueCard text={prologue} />
        ) : (
          <p className="max-w-sm text-center text-sm leading-relaxed text-[var(--ink-dim)]">
            @:나레이션, @이름:인물, *행동* 으로 적을 수 있습니다.
          </p>
        )}
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col gap-4 overflow-y-auto px-4 py-5 sm:px-6">
      {prologue?.trim() ? <PrologueCard text={prologue} compact /> : null}
      {messages.map((message) =>
        message.role === "user" ? (
          <UserBlock
            key={message.id}
            text={message.content}
            photo={userPhoto}
            name={userName}
          />
        ) : (
          <ModelBlock
            key={message.id}
            content={message.content}
            photo={characterPhoto}
            name={characterName}
          />
        ),
      )}
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
      {messages.length > 0 && !pendingUserText && !streamingText ? (
        <div className="chat-actions">
          {onEditLast ? (
            <button type="button" className="ghost-link" onClick={onEditLast}>
              마지막 말 수정
            </button>
          ) : null}
          {onDeleteLast ? (
            <button
              type="button"
              className="ghost-link is-danger"
              onClick={onDeleteLast}
            >
              마지막 턴 삭제
            </button>
          ) : null}
        </div>
      ) : null}
      <div ref={endRef} />
    </div>
  );
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
  const lines = parseModelReply(text);

  return (
    <div className="flex items-end justify-end gap-2">
      <div className="flex min-w-0 max-w-[85%] flex-col items-end gap-2">
        {lines.map((line, index) => (
          <UserLine key={index} line={line} fallbackName={name} />
        ))}
      </div>
      <AvatarCircle src={photo} name={name || "나"} size="sm" />
    </div>
  );
}

function UserLine({
  line,
  fallbackName,
}: {
  line: ParsedLine;
  fallbackName?: string;
}) {
  if (line.kind === "narration") {
    return (
      <p className="narration text-right">
        <MarkupText text={line.text} />
      </p>
    );
  }

  if (line.kind === "speech") {
    return (
      <div className="bubble-user">
        <p className="mark-name">@{line.name}</p>
        {line.text ? (
          <p className="mt-1 whitespace-pre-wrap">
            <MarkupText text={line.text} />
          </p>
        ) : null}
      </div>
    );
  }

  return (
    <div className="bubble-user">
      <p className="text-xs text-[var(--blue-soft)]">{fallbackName || "나"}</p>
      <p className="mt-1 whitespace-pre-wrap">
        <MarkupText text={line.text} />
      </p>
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

  return (
    <div className="flex max-w-[85%] items-start gap-2">
      <AvatarCircle src={photo} name={name} size="sm" />
      <div className="flex min-w-0 flex-col gap-2">
        {lines.map((line, index) => {
          const last = streaming && index === lines.length - 1;
          if (line.kind === "narration") {
            return (
              <p key={index} className={`narration ${last ? "is-streaming" : ""}`}>
                <MarkupText text={line.text} />
              </p>
            );
          }

          if (line.kind === "speech") {
            return (
              <div
                key={index}
                className={`bubble-model ${last ? "is-streaming" : ""}`}
              >
                <p className="mark-name">@{line.name}</p>
                {line.text ? (
                  <p className="mt-1 whitespace-pre-wrap">
                    <MarkupText text={line.text} />
                  </p>
                ) : null}
              </div>
            );
          }

          return (
            <div
              key={index}
              className={`fallback-box ${last ? "is-streaming" : ""}`}
            >
              <MarkupText text={line.text} />
            </div>
          );
        })}
      </div>
    </div>
  );
}
