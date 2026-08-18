import { REPLY_VERSIONS_MAX } from "./constants";
import type { ChatMessage } from "./types";

const MARK = "\u2063eorol.v\u2063";

export function replyVersions(message: ChatMessage) {
  const versions =
    message.versions && message.versions.length > 0
      ? message.versions
      : [message.content];
  const max = versions.length - 1;
  const index = Math.min(Math.max(message.versionIndex ?? max, 0), max);
  return { versions, index, count: versions.length };
}

export function withNewReply(message: ChatMessage, text: string): ChatMessage {
  const { versions } = replyVersions(message);
  const next = [...versions, text].slice(-REPLY_VERSIONS_MAX);
  return {
    ...message,
    content: text,
    versions: next,
    versionIndex: next.length - 1,
  };
}

export function withReplyIndex(message: ChatMessage, index: number): ChatMessage {
  const { versions } = replyVersions(message);
  const next = Math.min(Math.max(index, 0), versions.length - 1);
  return {
    ...message,
    content: versions[next],
    versions,
    versionIndex: next,
  };
}

export function withEditedReply(message: ChatMessage, text: string): ChatMessage {
  const { versions, index } = replyVersions(message);
  if (versions.length < 2) {
    return { ...message, content: text };
  }
  const next = versions.slice();
  next[index] = text;
  return {
    ...message,
    content: text,
    versions: next,
    versionIndex: index,
  };
}

export function packMessageContent(message: ChatMessage) {
  const { versions, index } = replyVersions(message);
  if (versions.length < 2) return message.content;
  return MARK + JSON.stringify({ i: index, v: versions });
}

export function unpackMessageContent(raw: string): Pick<
  ChatMessage,
  "content" | "versions" | "versionIndex"
> {
  if (!raw.startsWith(MARK)) {
    return { content: raw };
  }
  try {
    const parsed = JSON.parse(raw.slice(MARK.length)) as {
      i?: number;
      v?: unknown;
    };
    const versions = Array.isArray(parsed.v)
      ? parsed.v.filter((item): item is string => typeof item === "string" && item.trim().length > 0)
      : [];
    if (versions.length < 2) return { content: raw };
    const index = Math.min(Math.max(parsed.i ?? versions.length - 1, 0), versions.length - 1);
    return {
      content: versions[index],
      versions,
      versionIndex: index,
    };
  } catch {
    return { content: raw };
  }
}
