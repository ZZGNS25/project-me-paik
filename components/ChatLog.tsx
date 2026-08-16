import AvatarCircle from "@/components/AvatarCircle";
import PrologueCard from "@/components/PrologueCard";
import { parseModelReply } from "@/lib/parseMessage";
import type { ChatMessage } from "@/lib/types";

type ChatLogProps = {
  messages: ChatMessage[];
  prologue?: string;
  characterPhoto?: string;
  characterName?: string;
  userPhoto?: string;
  userName?: string;
};

export default function ChatLog({
  messages,
  prologue,
  characterPhoto,
  characterName,
  userPhoto,
  userName,
}: ChatLogProps) {
  if (messages.length === 0) {
    return (
      <div className="flex flex-1 items-center justify-center overflow-y-auto px-6 py-8">
        {prologue?.trim() ? (
          <PrologueCard text={prologue} />
        ) : (
          <p className="max-w-sm text-center text-sm leading-relaxed text-[var(--ink-dim)]">
            설정의 캐릭터·세계관이 매 턴 주입됩니다. 첫 대사를 보내면
            나레이션과 말풍선으로 나뉘어 보여요.
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
          <div key={message.id} className="flex items-end justify-end gap-2">
            <div className="bubble-user max-w-[80%]">
              <p className="text-xs text-[var(--blue-soft)]">
                {userName || "나"}
              </p>
              <p className="mt-1 whitespace-pre-wrap">{message.content}</p>
            </div>
            <AvatarCircle src={userPhoto} name={userName || "나"} size="sm" />
          </div>
        ) : (
          <ModelBlock
            key={message.id}
            content={message.content}
            photo={characterPhoto}
            name={characterName}
          />
        ),
      )}
    </div>
  );
}

function ModelBlock({
  content,
  photo,
  name,
}: {
  content: string;
  photo?: string;
  name?: string;
}) {
  const lines = parseModelReply(content);

  return (
    <div className="flex max-w-[85%] items-start gap-2">
      <AvatarCircle src={photo} name={name} size="sm" />
      <div className="flex min-w-0 flex-col gap-2">
      {lines.map((line, index) => {
        if (line.kind === "narration") {
          return (
            <p key={index} className="narration">
              {line.text}
            </p>
          );
        }

        if (line.kind === "speech") {
          return (
            <div key={index} className="bubble-model">
              <p className="text-xs text-[var(--blue-soft)]">{line.name}</p>
              <p className="mt-1 whitespace-pre-wrap">「{line.text}」</p>
            </div>
          );
        }

        return (
          <div key={index} className="fallback-box">
            {line.text}
          </div>
        );
      })}
      </div>
    </div>
  );
}
