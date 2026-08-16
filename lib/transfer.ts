import { createEmptySetting } from "./constants";
import { normalizePins } from "./memory";
import type { SettingRecord } from "./types";

export const TRANSFER_KIND = "earrole-settings";

type TransferFile = {
  kind: string;
  version: number;
  exportedAt: string;
  settings: SettingRecord[];
};

function isRecord(value: unknown): value is SettingRecord {
  if (!value || typeof value !== "object") return false;
  const item = value as SettingRecord;
  return Boolean(item.character && item.userPersona && Array.isArray(item.chatLog));
}

export function buildExport(settings: SettingRecord[]): TransferFile {
  return {
    kind: TRANSFER_KIND,
    version: 1,
    exportedAt: new Date().toISOString(),
    settings: settings.map((item) => ({
      ...item,
      cloudSessionId: null,
    })),
  };
}

export function parseImport(raw: string): SettingRecord[] {
  const data = JSON.parse(raw) as TransferFile;
  if (data?.kind !== TRANSFER_KIND || !Array.isArray(data.settings)) {
    throw new Error("이어롤 설정 파일이 아닙니다.");
  }

  const empty = createEmptySetting();
  return data.settings.filter(isRecord).map((item) => ({
    ...empty,
    ...item,
    title: item.title ?? "",
    shareId: null,
    storyPins: normalizePins(item.storyPins),
    castNotes: (item.castNotes ?? []).map((note) => ({
      ...note,
      photo: note.photo ?? "",
    })),
    cloudSessionId: null,
  }));
}

export function downloadExport(settings: SettingRecord[]) {
  const file = buildExport(settings);
  const blob = new Blob([JSON.stringify(file, null, 2)], {
    type: "application/json",
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `earrole-${new Date().toISOString().slice(0, 10)}.json`;
  link.click();
  URL.revokeObjectURL(url);
}
