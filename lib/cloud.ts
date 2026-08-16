import { SHORT_TERM_TURNS } from "./constants";
import { normalizePins } from "./memory";
import { getSupabase } from "./supabase";
import type { CastNote, ChatMessage, PlayState, StoryPin } from "./types";

type SessionRow = {
  id: string;
  character_name: string;
  character_one_liner: string;
  speech_style: string;
  appearance: string;
  forbidden: string;
  opening_situation: string;
  user_name: string;
  user_setting: string;
  world_setting: string;
  prologue?: string;
  story_summary: string;
  story_pins?: string;
  character_photo?: string;
  user_photo?: string;
  turn_count: number;
  updated_at?: string;
};

export type SessionSummary = {
  id: string;
  characterName: string;
  oneLiner: string;
  photo: string;
  turnCount: number;
  updatedAt: string;
};

function toSessionPayload(userId: string, state: PlayState) {
  return {
    user_id: userId,
    character_name: state.character.name,
    character_one_liner: state.character.oneLiner,
    speech_style: state.character.speechStyle,
    appearance: state.character.appearance,
    forbidden: state.character.forbidden,
    opening_situation: state.character.openingSituation,
    user_name: state.userPersona.name,
    user_setting: state.userPersona.setting,
    world_setting: state.worldSetting,
    prologue: state.prologue,
    story_summary: state.storySummary,
    story_pins: JSON.stringify(state.storyPins ?? []),
    character_photo: state.character.photo,
    user_photo: state.userPersona.photo,
    turn_count: state.turnCount,
  };
}

export async function savePlayToCloud(userId: string, state: PlayState) {
  const supabase = getSupabase();
  const payload = toSessionPayload(userId, state);

  const query = state.cloudSessionId
    ? supabase
        .from("eorol_play_sessions")
        .update(payload)
        .eq("id", state.cloudSessionId)
        .select("id")
        .single()
    : supabase.from("eorol_play_sessions").insert(payload).select("id").single();

  const { data, error } = await query;
  if (error || !data) {
    throw new Error(error?.message || "세션을 저장하지 못했습니다.");
  }

  const sessionId = data.id as string;

  await supabase.from("eorol_cast_notes").delete().eq("session_id", sessionId);
  await supabase.from("eorol_chat_messages").delete().eq("session_id", sessionId);

  if (state.castNotes.length > 0) {
    const { error: castError } = await supabase.from("eorol_cast_notes").insert(
      state.castNotes.map((note) => ({
        session_id: sessionId,
        name: note.name,
        note: note.note,
      })),
    );
    if (castError) throw new Error(castError.message);
  }

  if (state.chatLog.length > 0) {
    const { error: chatError } = await supabase.from("eorol_chat_messages").insert(
      state.chatLog.map((message) => ({
        session_id: sessionId,
        role: message.role,
        content: message.content,
        created_at: message.createdAt,
      })),
    );
    if (chatError) throw new Error(chatError.message);
  }

  return sessionId;
}

export async function loadLatestPlayFromCloud(userId: string) {
  const supabase = getSupabase();
  const { data: session, error } = await supabase
    .from("eorol_play_sessions")
    .select("*")
    .eq("user_id", userId)
    .order("updated_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) throw new Error(error.message);
  if (!session) return null;
  return loadPlayBySession(session as SessionRow);
}

export async function listPlaySessions(userId: string): Promise<SessionSummary[]> {
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from("eorol_play_sessions")
    .select("id, character_name, character_one_liner, character_photo, turn_count, updated_at")
    .eq("user_id", userId)
    .order("updated_at", { ascending: false });

  if (error) throw new Error(error.message);

  return ((data ?? []) as SessionRow[]).map((row) => ({
    id: row.id,
    characterName: row.character_name || "이름 없음",
    oneLiner: row.character_one_liner,
    photo: row.character_photo ?? "",
    turnCount: row.turn_count,
    updatedAt: row.updated_at ?? "",
  }));
}

export async function deletePlayFromCloud(sessionId: string) {
  const supabase = getSupabase();
  const { error } = await supabase
    .from("eorol_play_sessions")
    .delete()
    .eq("id", sessionId);

  if (error) throw new Error(error.message);
}

export async function loadPlayById(sessionId: string) {
  const supabase = getSupabase();
  const { data: session, error } = await supabase
    .from("eorol_play_sessions")
    .select("*")
    .eq("id", sessionId)
    .maybeSingle();

  if (error) throw new Error(error.message);
  if (!session) return null;
  return loadPlayBySession(session as SessionRow);
}

async function loadPlayBySession(row: SessionRow) {
  const supabase = getSupabase();
  const [{ data: notes }, { data: messages }] = await Promise.all([
    supabase.from("eorol_cast_notes").select("*").eq("session_id", row.id),
    supabase
      .from("eorol_chat_messages")
      .select("*")
      .eq("session_id", row.id)
      .order("created_at", { ascending: true }),
  ]);

  const chatLog = toChatLog(
    (messages ?? []) as {
      id: string;
      role: ChatMessage["role"];
      content: string;
      created_at: string;
    }[],
  );

  return {
    cloudSessionId: row.id,
    character: {
      name: row.character_name,
      oneLiner: row.character_one_liner,
      speechStyle: row.speech_style,
      appearance: row.appearance,
      forbidden: row.forbidden,
      forbiddenManual: Boolean(row.forbidden.trim()),
      openingSituation: row.opening_situation,
      photo: row.character_photo ?? "",
    },
    userPersona: {
      name: row.user_name,
      setting: row.user_setting,
      photo: row.user_photo ?? "",
    },
    worldSetting: row.world_setting,
    prologue: row.prologue ?? "",
    storySummary: row.story_summary,
    storyPins: parsePins(row.story_pins),
    turnCount: row.turn_count,
    castNotes: ((notes ?? []) as CastNote[]).map((note) => ({
      id: note.id,
      name: note.name,
      note: note.note,
    })),
    chatLog,
    shortTermBuffer: chatLog.slice(-SHORT_TERM_TURNS * 2),
  };
}

function toChatLog(
  messages: { id: string; role: ChatMessage["role"]; content: string; created_at: string }[],
): ChatMessage[] {
  return messages.map((message) => ({
    id: message.id,
    role: message.role,
    content: message.content,
    createdAt: message.created_at,
  }));
}

function parsePins(raw?: string): StoryPin[] {
  if (!raw?.trim()) return [];
  try {
    return normalizePins(JSON.parse(raw) as unknown);
  } catch {
    return [];
  }
}
