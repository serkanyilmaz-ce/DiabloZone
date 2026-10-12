-- Separate immutable source archives leave every existing game snapshot intact.
create table system_archives (
  id uuid primary key default gen_random_uuid(),
  source_version text not null, source_commit text not null check(source_commit ~ '^[a-f0-9]{40}$'),
  season_id integer not null references seasons(id), channel text not null check(channel in ('live','ptr')),
  input_sha256 text not null unique check(input_sha256 ~ '^[a-f0-9]{64}$'),
  state text not null default 'draft' check(state in ('draft','published')),
  record_count integer not null check(record_count > 0),created_at timestamptz not null default now()
);
create table system_records (
  archive_id uuid not null references system_archives(id),kind text not null,
  id text not null,slug text not null,name text not null,payload jsonb not null,
  primary key(archive_id,kind,id),unique(archive_id,slug),
  check(kind in ('ParagonBoard','ParagonNode','ParagonGlyph','ParagonGlyphAffix','Recipe','Season','GameBalance'))
);
create index system_record_names on system_records(archive_id,kind,name);
create function protect_system_archive() returns trigger language plpgsql as $$
declare archive uuid;
begin
  if tg_table_name='system_archives' then
    if tg_op <> 'INSERT' and old.state='published' then raise exception 'Published system archive is immutable'; end if;
    if tg_op='INSERT' and new.state='published' then raise exception 'Insert a draft before publication'; end if;
    if tg_op='UPDATE' and new.state='published' then
      if (select count(*) from system_records where archive_id=new.id) <> new.record_count then raise exception 'System archive count mismatch'; end if;
    end if;
  else
    if tg_op <> 'INSERT' then
      perform 1 from system_archives where id=old.archive_id for update;
      if exists(select 1 from system_archives where id=old.archive_id and state='published') then raise exception 'Published system records are immutable'; end if;
    end if;
    if tg_op <> 'DELETE' then
      archive:=new.archive_id;
      -- Lock the parent so publication cannot race a record mutation.
      perform 1 from system_archives where id=archive for update;
      if exists(select 1 from system_archives where id=archive and state='published') then raise exception 'Published system records are immutable'; end if;
    end if;
  end if;
  if tg_op='DELETE' then return old; end if;
  return new;
end $$;
create trigger immutable_system_archives before insert or update or delete on system_archives for each row execute function protect_system_archive();
create trigger immutable_system_records before insert or update or delete on system_records for each row execute function protect_system_archive();
