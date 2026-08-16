import {
  FIELD_LIMITS,
  STORAGE_KEY,
  createEmptyPlayState,
  createEmptySetting,
  createEmptyStore,
} from "./constants";
import { buildForbidden } from "./forbidden";
import { normalizePins } from "./memory";
import { WORLD_PRESETS } from "./presets";
import type { AppStore, PlayState, SettingRecord } from "./types";

let lastSaved = "";

const OLD_CAST_NOTES: Record<string, string> = {
  강태민: "청룡 길드장. 이익을 먼저 계산한다.",
  한소라: "B급 힐러. 밝고 잔소리가 많다.",
  박진우: "정보상. 반말, 값을 먼저 부른다.",
  이도현: "겁 많은 F급 신입. 유저와 동기.",
  김재혁: "협회 감사관. 원칙을 안 굽힌다.",
  "카엘 반트": "검술 수석. 라이벌, 자존심이 세다.",
  "루나 이브": "금서고 조수. 책을 사람보다 믿는다.",
  마르코: "속성 마법 교수. 잔소리는 길다.",
  "이리스 로엔": "소문 많은 후배. 호기심이 과하다.",
  드레이크: "과묵한 원장. 정치를 더 본다.",
  로엔: "호위 기사. 충직하고 말이 적다.",
  "벨로드 공작": "유저의 아버지. 차갑고 가문을 우선한다.",
  유리아: "시녀. 유일한 편한 상대.",
  "알렌 왕자": "약혼 후보. 겉은 다정, 속은 정치.",
  미르: "점성술사. 유저의 영혼이 이상하다고 본다.",
};

const OLD_WORLD_PREFIX: Record<string, string> = {
  서윤하: "시대/장소: 게이트가 열린 현대 한국",
  "에델 라이트": "시대/장소: 마법과 검술이 공존하는 왕국, 성창 아카데미.",
  세레나: "시대/장소: 검과 마법이 있는 중세풍 대륙. 벨로드 공작가와 왕도가 중심이다.",
};

const OLD_PROLOGUE_PREFIX: Record<string, string> = {
  서윤하: "십 년 전 한강 위로 검은 균열이 열렸다",
  "에델 라이트": "성창 아카데미는 왕국의 검과 마법이 한자리에",
  세레나: "벨로드 공작은 대륙에서 가장 오래된 가문",
};

const OLD_APPEARANCE: Record<string, string> = {
  서윤하: "검은 숏컷, 회색 코트, 칼자국 난 장갑.",
  "에델 라이트": "백금발 장발, 남색 제복, 은테 안경.",
  세레나: "밤색 웨이브, 연보라 드레스, 작은 티아라.",
};

const OLD_SPEECH: Record<string, string> = {
  서윤하:
    "반말, 짧은 문장, 차갑다. 감정은 안 드러낸다. 이모지 금지. 하십시오·바랍니다 같은 안내문 말투 금지.",
  "에델 라이트": "존댓말, 또박또박. 빈말은 안 한다. 이모지 금지.",
  세레나: "존댓말, 부드러운 문장. 빈정은 돌려 말한다.",
};

const OLD_OPENING: Record<string, string> = {
  서윤하:
    "E급 연습 던전 앞에서 신입인 유저를 기다리고 있다. 오늘은 생존 훈련이다.",
  "에델 라이트":
    "입학식 다음 날, 결투장에서 편입생인 유저의 실력을 확인하고 있다.",
  세레나:
    "벨로드 저택 온실에서 환생한 유저를 마주친다. 오늘은 약혼 이야기가 오가는 날이다.",
};

export function backfillPresetMeta(record: SettingRecord): SettingRecord {
  const preset = WORLD_PRESETS.find(
    (item) => item.character.name === record.character.name.trim(),
  );
  const notes = (record.castNotes ?? []).map((note) => ({
    ...note,
    photo: note.photo ?? "",
  }));
  if (!preset) return { ...record, castNotes: notes };

  const name = preset.character.name;
  const oldHunterSpeech = "존댓말, 짧은 문장, 이모지 금지. 감정은 잘 안 드러낸다.";
  const castByName = new Map(preset.cast.map((item) => [item.name, item]));
  const worldPrefix = OLD_WORLD_PREFIX[name];
  const prologuePrefix = OLD_PROLOGUE_PREFIX[name];

  return {
    ...record,
    prologue:
      !record.prologue.trim() || record.prologue.startsWith(prologuePrefix ?? "\0")
        ? preset.prologue
        : record.prologue,
    worldSetting:
      worldPrefix && record.worldSetting.startsWith(worldPrefix)
        ? preset.worldSetting
        : record.worldSetting,
    character: {
      ...record.character,
      photo: record.character.photo || preset.character.photo,
      oneLiner:
        record.character.oneLiner === "S급 근접 헌터. 말은 짧고 차갑다."
          ? preset.character.oneLiner
          : record.character.oneLiner,
      speechStyle:
        record.character.speechStyle.trim() === oldHunterSpeech ||
        record.character.speechStyle.trim() === (OLD_SPEECH[name] ?? "")
          ? preset.character.speechStyle
          : record.character.speechStyle,
      appearance:
        record.character.appearance.trim() === (OLD_APPEARANCE[name] ?? "")
          ? preset.character.appearance
          : record.character.appearance,
      openingSituation:
        record.character.openingSituation.trim() === (OLD_OPENING[name] ?? "")
          ? preset.character.openingSituation
          : record.character.openingSituation,
    },
    userPersona: {
      ...record.userPersona,
      setting:
        record.userPersona.setting === "어제 각성한 신입 헌터. 아직 스킬 하나다." ||
        record.userPersona.setting === "이번 학기 편입생. 출신은 시골 남작 가문." ||
        record.userPersona.setting ===
          "현대인으로 살다 공작가 사람으로 환생했다. 전생은 숨긴다."
          ? preset.userPersona.setting
          : record.userPersona.setting,
    },
    castNotes: notes.map((note) => {
      const next = castByName.get(note.name.trim());
      if (!next) return note;
      const oldNote = OLD_CAST_NOTES[note.name.trim()];
      return {
        ...note,
        photo: note.photo || next.photo,
        note: oldNote && note.note === oldNote ? next.note : note.note,
      };
    }),
  };
}

function applyForbidden(record: SettingRecord): SettingRecord {
  const forbiddenManual = Boolean(record.character.forbiddenManual);
  return {
    ...record,
    title: record.title ?? "",
    shareId: record.shareId ?? null,
    prologue: record.prologue ?? "",
    storyPins: normalizePins(record.storyPins),
    castNotes: (record.castNotes ?? []).map((note) => ({
      id: note.id,
      name: note.name ?? "",
      note: clip(note.note ?? "", FIELD_LIMITS.castNote),
      photo: note.photo ?? "",
    })),
    worldSetting: clip(record.worldSetting ?? "", FIELD_LIMITS.worldSetting),
    userPersona: {
      ...record.userPersona,
      photo: record.userPersona.photo ?? "",
      setting: clip(record.userPersona.setting ?? "", FIELD_LIMITS.userSetting),
    },
    character: {
      ...record.character,
      photo: record.character.photo ?? "",
      speechStyle: clip(record.character.speechStyle ?? "", FIELD_LIMITS.speechStyle),
      appearance: clip(record.character.appearance ?? "", FIELD_LIMITS.appearance),
      openingSituation: clip(
        record.character.openingSituation ?? "",
        FIELD_LIMITS.openingSituation,
      ),
      forbiddenManual,
      forbidden: forbiddenManual
        ? clip(record.character.forbidden, FIELD_LIMITS.forbidden)
        : buildForbidden({
            name: record.character.name,
            speechStyle: record.character.speechStyle,
            appearance: record.character.appearance,
            worldSetting: record.worldSetting,
            openingSituation: record.character.openingSituation,
          }),
    },
  };
}

export function toPlayState(store: AppStore): PlayState {
  const current =
    store.settings.find((item) => item.id === store.currentSettingId) ??
    store.settings[0] ??
    createEmptySetting();

  return {
    apiKey: store.apiKey,
    character: {
      ...current.character,
      photo: current.character.photo ?? "",
    },
    userPersona: {
      ...current.userPersona,
      photo: current.userPersona.photo ?? "",
    },
    worldSetting: current.worldSetting,
    prologue: current.prologue ?? "",
    storySummary: current.storySummary,
    storyPins: normalizePins(current.storyPins),
    castNotes: current.castNotes,
    chatLog: current.chatLog,
    shortTermBuffer: current.shortTermBuffer,
    turnCount: current.turnCount,
    cloudSessionId: current.cloudSessionId,
  };
}

function isStore(value: unknown): value is AppStore {
  if (!value || typeof value !== "object") return false;
  const store = value as AppStore;
  return Array.isArray(store.settings) && typeof store.currentSettingId === "string";
}

function migrateLegacy(parsed: PlayState): AppStore {
  const id =
    typeof crypto !== "undefined" && crypto.randomUUID
      ? crypto.randomUUID()
      : "migrated";
  const setting: SettingRecord = {
    id,
    title: "",
    shareId: null,
    updatedAt: new Date().toISOString(),
    character: parsed.character ?? createEmptyPlayState().character,
    userPersona: parsed.userPersona ?? createEmptyPlayState().userPersona,
    worldSetting: parsed.worldSetting ?? "",
    prologue: parsed.prologue ?? "",
    storySummary: parsed.storySummary ?? "",
    storyPins: normalizePins(parsed.storyPins),
    castNotes: parsed.castNotes ?? [],
    chatLog: parsed.chatLog ?? [],
    shortTermBuffer: parsed.shortTermBuffer ?? [],
    turnCount: parsed.turnCount ?? 0,
    cloudSessionId: parsed.cloudSessionId ?? null,
  };

  return {
    apiKey: parsed.apiKey ?? "",
    currentSettingId: id,
    settings: [setting],
  };
}

export function loadStore(): AppStore {
  if (typeof window === "undefined") return createEmptyStore();

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return createEmptyStore();
    const parsed = JSON.parse(raw) as unknown;
    if (isStore(parsed) && parsed.settings.length > 0) {
      const next = {
        ...parsed,
        settings: parsed.settings.map((item) =>
          applyForbidden(backfillPresetMeta(item)),
        ),
      };
      lastSaved = raw;
      return next;
    }
    const migrated = migrateLegacy({
      ...createEmptyPlayState(),
      ...(parsed as PlayState),
    });
    return {
      ...migrated,
      settings: migrated.settings.map((item) =>
        applyForbidden(backfillPresetMeta(item)),
      ),
    };
  } catch {
    return createEmptyStore();
  }
}

export function saveStore(store: AppStore) {
  if (typeof window === "undefined") return;
  const raw = JSON.stringify(store);
  if (raw === lastSaved) return;
  lastSaved = raw;
  window.localStorage.setItem(STORAGE_KEY, raw);
}

export function loadPlayState(): PlayState {
  return toPlayState(loadStore());
}

export function savePlayState(state: PlayState) {
  const store = loadStore();
  const currentId = store.currentSettingId;
  const next: AppStore = {
    ...store,
    apiKey: state.apiKey,
    settings: store.settings.map((item) =>
      item.id === currentId
        ? {
            ...item,
            ...state,
            id: item.id,
            title: item.title,
            shareId: item.shareId ?? null,
            updatedAt: new Date().toISOString(),
          }
        : item,
    ),
  };
  saveStore(next);
}

export function clip(value: string, max: number) {
  return value.slice(0, max);
}
