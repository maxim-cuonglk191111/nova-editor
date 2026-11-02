-- 0024 — AI tab chat history (task 040, doc/AI-PANEL.md §7).
--
-- The AI tab keeps threads per project and user. Threads are ai_conversations, messages are
-- ai_messages (both exist since 0002 / 0003 and already receive the plain log written by
-- POST /api/ai). A message of the tab can be a proposal (a list of changes with Apply / Discard),
-- an error, or plain text, and an applied proposal links to the version-history snapshot taken
-- just before it ("Restore" in the thread).
--
-- Additive and idempotent: every new column is nullable or has a default, old rows keep reading
-- as kind = 'text'. No change to schema_json. RLS stays on with no policies (service role only).

alter table ai_messages add column if not exists kind        text not null default 'text';
alter table ai_messages add column if not exists context     jsonb;            -- what the message was about: scope, page, element, section
alter table ai_messages add column if not exists proposal    jsonb;            -- { lines: [...], payload?: {...} } (payload only while pending)
alter table ai_messages add column if not exists status      text;             -- 'pending' | 'applied' | 'discarded' (proposals)
alter table ai_messages add column if not exists snapshot_id uuid references project_snapshots(id) on delete set null;
alter table ai_messages add column if not exists duration_ms integer;          -- how long the answer took
alter table ai_messages add column if not exists meta        jsonb;            -- small extras: generate flag, apply result, undo checks, needs-account

do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'ai_messages_kind_check') then
    alter table ai_messages add constraint ai_messages_kind_check check (kind in ('text', 'proposal', 'error'));
  end if;
  if not exists (select 1 from pg_constraint where conname = 'ai_messages_status_check') then
    alter table ai_messages add constraint ai_messages_status_check check (status is null or status in ('pending', 'applied', 'discarded'));
  end if;
end $$;

create index if not exists idx_ai_messages_snapshot on ai_messages (snapshot_id) where snapshot_id is not null;
