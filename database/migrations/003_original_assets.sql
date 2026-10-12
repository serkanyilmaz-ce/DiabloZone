-- Graphics can originate from a different exact build than the game catalogue.
create table asset_sets (
  id uuid primary key default gen_random_uuid(),
  source_version text not null check(source_version ~ '^[0-9]+\.[0-9]+\.[0-9]+\.[0-9]+$'),
  data_source_version text not null, data_source_commit text not null check(data_source_commit ~ '^[a-f0-9]{40}$'),
  input_sha256 text not null unique check(input_sha256 ~ '^[a-f0-9]{64}$'),
  build_info_sha256 text not null check(build_info_sha256 ~ '^[a-f0-9]{64}$'),
  extractor_commit text not null check(extractor_commit ~ '^[a-f0-9]{40}$'),
  created_at timestamptz not null default now(),
  state text not null default 'draft' check(state in ('draft','published')),
  manifest jsonb not null check(jsonb_typeof(manifest)='object')
);
create table game_assets (
  asset_set_id uuid not null references asset_sets(id),
  handle bigint not null check(handle between 1 and 4294967294),
  status text not null check(status in ('extracted','unavailable','unresolved')),
  path text, sha256 text check(sha256 ~ '^[a-f0-9]{64}$'),
  width integer check(width>0), height integer check(height>0),
  atlas_sno integer, payload jsonb not null check(jsonb_typeof(payload)='object'),
  primary key(asset_set_id,handle),
  check((status='extracted')=(path is not null)),
  check((status='extracted')=(sha256 is not null)),
  check(status<>'extracted' or (width is not null and height is not null))
);
create function protect_published_asset_set() returns trigger language plpgsql as $$
declare target uuid;
begin
  if tg_table_name='asset_sets' then
    if tg_op<>'INSERT' and old.state='published' then raise exception 'Published asset set is immutable'; end if;
  else
    if tg_op<>'INSERT' and exists(select 1 from asset_sets where id=old.asset_set_id and state='published') then
      raise exception 'Published asset set is immutable';
    end if;
    if tg_op<>'DELETE' then
      target:=new.asset_set_id;
      if exists(select 1 from asset_sets where id=target and state='published') then raise exception 'Published asset set is immutable'; end if;
    end if;
  end if;
  if tg_op='DELETE' then return old; end if;
  return new;
end $$;
create trigger immutable_asset_sets before insert or update or delete on asset_sets for each row execute function protect_published_asset_set();
create trigger immutable_game_assets before insert or update or delete on game_assets for each row execute function protect_published_asset_set();
