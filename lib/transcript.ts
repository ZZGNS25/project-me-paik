import { storyTitle } from "./storyTitle";
import type { SettingRecord } from "./types";

function safeFileName(value: string) {
  return value.replace(/[\\/:*?"<>|]+/g, " ").trim() || "이어롤";
}

export function buildTranscript(setting: SettingRecord) {
  const title = storyTitle(setting);
  const me = setting.userPersona.name.trim() || "나";
  const other = setting.character.name.trim() || "상대";
  const blocks: string[] = [
    title,
    `상대: ${other}`,
    `나: ${me}`,
  ];

  if (setting.worldSetting.trim()) {
    blocks.push("", "[세계관]", setting.worldSetting.trim());
  }
  if (setting.prologue.trim()) {
    blocks.push("", "[프롤로그]", setting.prologue.trim());
  }
  if (setting.chatLog.length > 0) {
    blocks.push("", "[대화]");
    for (const message of setting.chatLog) {
      blocks.push(message.role === "user" ? me : other, message.content, "");
    }
  }

  return blocks.join("\n").trim() + "\n";
}

export function downloadTranscript(setting: SettingRecord) {
  const title = storyTitle(setting);
  const blob = new Blob([buildTranscript(setting)], {
    type: "text/plain;charset=utf-8",
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `${safeFileName(title)}-${new Date().toISOString().slice(0, 10)}.txt`;
  link.click();
  URL.revokeObjectURL(url);
}
