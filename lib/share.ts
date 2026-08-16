import { getSupabase } from "./supabase";
import { storyTitle } from "./storyTitle";
import type {
  CastNote,
  CharacterProfile,
  SettingRecord,
  UserPersona,
} from "./types";

export type ShareSnapshot = {
  title: string;
  character: CharacterProfile;
  userPersona: UserPersona;
  worldSetting: string;
  prologue: string;
  castNotes: CastNote[];
};

export type ShareRecord = {
  id: string;
  title: string;
  characterName: string;
  snapshot: ShareSnapshot;
};

function toSnapshot(setting: SettingRecord): ShareSnapshot {
  return {
    title: storyTitle(setting),
    character: setting.character,
    userPersona: setting.userPersona,
    worldSetting: setting.worldSetting,
    prologue: setting.prologue,
    castNotes: setting.castNotes.map((note) => ({
      id: note.id,
      name: note.name,
      note: note.note,
      photo: note.photo ?? "",
    })),
  };
}

export function shareUrl(id: string, origin = "") {
  const base = origin || (typeof window !== "undefined" ? window.location.origin : "");
  return `${base}/s/${id}`;
}

export async function upsertShare(
  userId: string,
  setting: SettingRecord,
): Promise<string> {
  const supabase = getSupabase();
  const snapshot = toSnapshot(setting);
  const payload = {
    user_id: userId,
    title: snapshot.title,
    character_name: snapshot.character.name,
    payload: snapshot,
  };

  if (setting.shareId) {
    const { data, error } = await supabase
      .from("eorol_shares")
      .update(payload)
      .eq("id", setting.shareId)
      .eq("user_id", userId)
      .select("id")
      .maybeSingle();
    if (error) throw new Error(error.message);
    if (data?.id) return data.id as string;
  }

  const { data, error } = await supabase
    .from("eorol_shares")
    .insert(payload)
    .select("id")
    .single();
  if (error || !data) {
    throw new Error(error?.message || "공유 링크를 만들지 못했습니다.");
  }
  return data.id as string;
}

export async function loadShare(id: string): Promise<ShareRecord | null> {
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from("eorol_shares")
    .select("id, title, character_name, payload")
    .eq("id", id)
    .maybeSingle();

  if (error) throw new Error(error.message);
  if (!data) return null;

  const snapshot = data.payload as ShareSnapshot;
  if (!snapshot?.character) return null;

  return {
    id: data.id as string,
    title: (data.title as string) || snapshot.title || snapshot.character.name,
    characterName: data.character_name as string,
    snapshot,
  };
}

export async function copyText(text: string) {
  await navigator.clipboard.writeText(text);
}

export async function shareToApps(input: {
  title: string;
  text: string;
  url: string;
}) {
  if (typeof navigator === "undefined" || !navigator.share) {
    return { status: "unavailable" as const };
  }
  try {
    await navigator.share(input);
    return { status: "shared" as const };
  } catch (err) {
    if (err instanceof Error && err.name === "AbortError") {
      return { status: "aborted" as const };
    }
    return { status: "failed" as const };
  }
}

export function shareDestinations(url: string, text: string) {
  const encodedUrl = encodeURIComponent(url);
  const encodedText = encodeURIComponent(text);
  return [
    {
      id: "x",
      label: "X",
      href: `https://twitter.com/intent/tweet?url=${encodedUrl}&text=${encodedText}`,
    },
    {
      id: "facebook",
      label: "페이스북",
      href: `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`,
    },
    {
      id: "telegram",
      label: "텔레그램",
      href: `https://t.me/share/url?url=${encodedUrl}&text=${encodedText}`,
    },
    {
      id: "line",
      label: "라인",
      href: `https://social-plugins.line.me/lineit/share?url=${encodedUrl}`,
    },
  ] as const;
}

export function canShareToApps() {
  return typeof navigator !== "undefined" && typeof navigator.share === "function";
}
