import { getSupabase } from "./supabase";
import type { CastNote, ChatMessage, PlayState } from "./types";

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
  story_summary: string;
  turn_count: number;
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
    story_summary: state.storySummary,
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

  const row = session as SessionRow;

  const [{ data: notes }, { data: messages }] = await Promise.all([
    supabase.from("eorol_cast_notes").select("*").eq("session_id", row.id),
    supabase
      .from("eorol_chat_messages")
      .select("*")
      .eq("session_id", row.id)
      .order("created_at", { ascending: true }),
  ]);

  return {
    cloudSessionId: row.id,
    character: {
      name: row.character_name,
      oneLiner: row.character_one_liner,
      speechStyle: row.speech_style,
      appearance: row.appearance,
      forbidden: row.forbidden,
      openingSituation: row.opening_situation,
    },
    userPersona: {
      name: row.user_name,
      setting: row.user_setting,
    },
    worldSetting: row.world_setting,
    storySummary: row.story_summary,
    turnCount: row.turn_count,
    castNotes: ((notes ?? []) as CastNote[]).map((note) => ({
      id: note.id,
      name: note.name,
      note: note.note,
    })),
    chatLog: ((messages ?? []) as { id: string; role: ChatMessage["role"]; content: string; created_at: string }[]).map(
      (message) => ({
        id: message.id,
        role: message.role,
        content: message.content,
        createdAt: message.created_at,
      }),
    ),
  };
}
