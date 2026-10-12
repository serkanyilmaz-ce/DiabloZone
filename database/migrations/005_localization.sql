create table localization_sets (
  id uuid primary key default gen_random_uuid(),
  game_snapshot_id uuid not null references snapshots(id),
  system_archive_id uuid not null references system_archives(id),
  locale text not null check(locale in ('tr','en')),
  source_version text not null, data_source_version text not null,
  input_sha256 text not null unique check(input_sha256 ~ '^[a-f0-9]{64}$'),
  context jsonb not null,entry_count integer not null check(entry_count>0),
  state text not null default 'draft' check(state in ('draft','published')),
  created_at timestamptz not null default now()
);
create table localized_entities (
  localization_set_id uuid not null references localization_sets(id),
  record_key text not null check(record_key ~ '^(skills|items|affixes|aspects|systems):[0-9]+(:mod:[0-9]+)?$'),
  payload jsonb not null,primary key(localization_set_id,record_key)
);
create function protect_localization_set() returns trigger language plpgsql as $$
begin
  if tg_table_name='localization_sets' then
    if tg_op <> 'INSERT' and old.state='published' then raise exception 'Published localization set is immutable'; end if;
    if tg_op='INSERT' and new.state='published' then raise exception 'Draft required before publication'; end if;
    if tg_op='UPDATE' and new.state='published' then
      if (select count(*) from localized_entities where localization_set_id=new.id)<>new.entry_count then raise exception 'Localization count mismatch'; end if;
      if not exists(select 1 from snapshots where id=new.game_snapshot_id and state='published' and manifest->>'sourceVersion'=new.data_source_version) then raise exception 'Published source snapshot required'; end if;
      if not exists(select 1 from system_archives where id=new.system_archive_id and state='published' and source_version=new.data_source_version) then raise exception 'Published source system archive required'; end if;
    end if;
  else
    if tg_op <> 'INSERT' then
      perform 1 from localization_sets where id=old.localization_set_id for update;
      if exists(select 1 from localization_sets where id=old.localization_set_id and state='published') then raise exception 'Published localized entities are immutable'; end if;
    end if;
    if tg_op <> 'DELETE' then
      perform 1 from localization_sets where id=new.localization_set_id for update;
      if exists(select 1 from localization_sets where id=new.localization_set_id and state='published') then raise exception 'Published localized entities are immutable'; end if;
    end if;
  end if;
  if tg_op='DELETE' then return old; end if; return new;
end $$;
create trigger immutable_localization_sets before insert or update or delete on localization_sets for each row execute function protect_localization_set();
create trigger immutable_localized_entities before insert or update or delete on localized_entities for each row execute function protect_localization_set();
