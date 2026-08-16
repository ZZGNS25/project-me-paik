import { parseModelReply } from "@/lib/parseMessage";
import type { ChatMessage } from "@/lib/types";

type ChatLogProps = {
  messages: ChatMessage[];
};

export default function ChatLog({ messages }: ChatLogProps) {
  if (messages.length === 0) {
    return (
      <div className="flex flex-1 items-center justify-center px-6 text-center">
        <p className="max-w-sm text-sm leading-relaxed text-[var(--ink-dim)]">
          왼쪽 설정이 매 턴 주입됩니다. 첫 대사를 보내면 나레이션과 말풍선으로
          나뉘어 보여요.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col gap-4 overflow-y-auto px-4 py-5 sm:px-6">
      {messages.map((message) =>
        message.role === "user" ? (
          <div key={message.id} className="flex justify-end">
            <div className="bubble-user max-w-[80%]">
              <p className="text-xs text-[var(--blue-soft)]">나</p>
              <p className="mt-1 whitespace-pre-wrap">{message.content}</p>
            </div>
          </div>
        ) : (
          <ModelBlock key={message.id} content={message.content} />
        ),
      )}
    </div>
  );
}

function ModelBlock({ content }: { content: string }) {
  const lines = parseModelReply(content);

  return (
    <div className="flex max-w-[85%] flex-col gap-2">
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
  );
}
