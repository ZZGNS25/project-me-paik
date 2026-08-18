import { isPresetNamed } from "./presets";
import type { SettingRecord } from "./types";

export function isUnusedBlank(
  setting: SettingRecord,
  opts?: { excludePresets?: boolean },
) {
  if (opts?.excludePresets && isPresetNamed(setting.character.name)) return false;
  return (
    !setting.character.name.trim() &&
    !setting.character.photo &&
    !setting.worldSetting.trim() &&
    setting.chatLog.length === 0
  );
}

export function sortByUpdatedAt<T extends { updatedAt: string }>(items: T[]) {
  return items.slice().sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
}

export function listSavedChats(settings: SettingRecord[]) {
  return sortByUpdatedAt(settings.filter((item) => item.chatLog.length > 0));
}

export function oldestSavedChat(
  settings: SettingRecord[],
  exceptId?: string | null,
) {
  const saved = listSavedChats(settings);
  const drop = exceptId ? saved.filter((item) => item.id !== exceptId) : saved;
  return drop[drop.length - 1] ?? null;
}

export function listOngoing(settings: SettingRecord[]) {
  return sortByUpdatedAt(
    settings.filter((item) => item.character.name.trim() && item.chatLog.length > 0),
  );
}

export function listWaiting(settings: SettingRecord[]) {
  return sortByUpdatedAt(
    settings.filter(
      (item) =>
        item.character.name.trim() &&
        item.chatLog.length === 0 &&
        !isPresetNamed(item.character.name),
    ),
  );
}

export function listMine(settings: SettingRecord[]) {
  return sortByUpdatedAt(
    settings.filter(
      (item) =>
        item.character.name.trim() &&
        (item.chatLog.length > 0 || !isPresetNamed(item.character.name)),
    ),
  );
}

export function listLocalNamed(settings: SettingRecord[]) {
  return settings.filter((item) => item.character.name.trim());
}
