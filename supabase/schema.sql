-- 이어롤 테이블. 무료 프로젝트 한도 때문에 기존 saju-me 프로젝트에 접두어로 추가합니다.
-- API 키는 저장하지 않습니다.

create or replace function public.eorol_set_updated_at()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

revoke all on function public.eorol_set_updated_at() from public, anon, authenticated;

create table if not exists public.eorol_play_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  character_name text not null default '',
  character_one_liner text not null default '',
  speech_style text not null default '',
  appearance text not null default '',
  forbidden text not null default '',
  opening_situation text not null default '',
  user_name text not null default '',
  user_setting text not null default '',
  world_setting text not null default '',
  prologue text not null default '',
  story_summary text not null default '',
  story_pins text not null default '[]',
  -- story_title: 대화 이름은 우선 브라우저 로컬에만 둡니다.
  character_photo text not null default '',
  user_photo text not null default '',
  turn_count integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.eorol_cast_notes (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.eorol_play_sessions (id) on delete cascade,
  name text not null default '',
  note text not null default '',
  created_at timestamptz not null default now()
);

create table if not exists public.eorol_chat_messages (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.eorol_play_sessions (id) on delete cascade,
  role text not null check (role in ('user', 'model')),
  content text not null,
  created_at timestamptz not null default now()
);

create index if not exists eorol_play_sessions_user_updated_idx
  on public.eorol_play_sessions (user_id, updated_at desc);

create index if not exists eorol_cast_notes_session_idx
  on public.eorol_cast_notes (session_id);

create index if not exists eorol_chat_messages_session_idx
  on public.eorol_chat_messages (session_id, created_at);

drop trigger if exists eorol_play_sessions_updated_at on public.eorol_play_sessions;
create trigger eorol_play_sessions_updated_at
before update on public.eorol_play_sessions
for each row execute function public.eorol_set_updated_at();

alter table public.eorol_play_sessions enable row level security;
alter table public.eorol_cast_notes enable row level security;
alter table public.eorol_chat_messages enable row level security;

create policy "eorol_own_sessions"
on public.eorol_play_sessions
for all
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create policy "eorol_own_cast_notes"
on public.eorol_cast_notes
for all
to authenticated
using (
  exists (
    select 1
    from public.eorol_play_sessions s
    where s.id = session_id
      and s.user_id = auth.uid()
  )
)
with check (
  exists (
    select 1
    from public.eorol_play_sessions s
    where s.id = session_id
      and s.user_id = auth.uid()
  )
);

create policy "eorol_own_messages"
on public.eorol_chat_messages
for all
to authenticated
using (
  exists (
    select 1
    from public.eorol_play_sessions s
    where s.id = session_id
      and s.user_id = auth.uid()
  )
)
with check (
  exists (
    select 1
    from public.eorol_play_sessions s
    where s.id = session_id
      and s.user_id = auth.uid()
  )
);
