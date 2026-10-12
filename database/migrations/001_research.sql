-- PostgreSQL. Forum/Auth tables are intentionally outside the active product.
create table seasons (
  id integer primary key check (id > 0), name text,
  status text not null check (status in ('target','announced','live','archived')),
  source_url text check (source_url ~ '^https://')
);
create table builds (
  id text primary key, season_id integer not null references seasons(id),
  patch text, channel text not null check (channel in ('live','ptr','unknown')),
  observed_at timestamptz, unique(id, season_id)
);
create table snapshots (
  id uuid primary key default gen_random_uuid(), build_id text not null references builds(id),
  created_at timestamptz not null default now(), state text not null default 'draft' check (state in ('draft','published')),
  manifest jsonb not null default '{}' check (jsonb_typeof(manifest)='object')
);
create table sources (
  id uuid primary key default gen_random_uuid(), snapshot_id uuid not null references snapshots(id),
  kind text not null check (kind in ('official','datamine','normalized_export','local_manifest','measurement')),
  locator text not null, sha256 text check (sha256 ~ '^[a-f0-9]{64}$'), observed_at timestamptz not null default now(),
  unique(id, snapshot_id), unique(snapshot_id, locator)
);
create table records (
  snapshot_id uuid not null references snapshots(id), kind text not null check(kind in ('skills','items','aspects','affixes','skill-tree')),
  id text not null, slug text, name text, source_id uuid not null,
  payload jsonb not null check(jsonb_typeof(payload)='object'), primary key(snapshot_id,kind,id),
  foreign key(source_id,snapshot_id) references sources(id,snapshot_id)
);
create index records_lookup on records(kind,slug,snapshot_id);
create table mechanics (
  id uuid primary key default gen_random_uuid(), snapshot_id uuid not null references snapshots(id),
  slug text not null, domain text not null check(domain in ('damage','defense','resources','timing','procs','loot','crafting','seasonal')),
  title text not null, status text not null check(status in ('unknown','hypothesis','datamined','measured','verified','contradicted')),
  assumptions jsonb not null default '[]' check(jsonb_typeof(assumptions)='array'), unique(id,snapshot_id),unique(snapshot_id,slug)
);
create table formulas (
  id uuid primary key default gen_random_uuid(), snapshot_id uuid not null references snapshots(id),
  mechanic_id uuid not null, source_id uuid not null, raw_expression text not null,
  interpretation text, unit text, validation_status text not null check(validation_status in ('unresolved','interpreted','tested','verified','contradicted')),
  unique(id,snapshot_id),
  foreign key(mechanic_id,snapshot_id) references mechanics(id,snapshot_id),
  foreign key(source_id,snapshot_id) references sources(id,snapshot_id)
);
create table formula_dependencies (
  formula_id uuid not null, snapshot_id uuid not null, symbol text not null,
  dependency_formula_id uuid, resolution text not null check(resolution in ('unknown','input','constant','formula')),
  constant_value numeric, unit text, primary key(formula_id,symbol),
  foreign key(formula_id,snapshot_id) references formulas(id,snapshot_id),
  foreign key(dependency_formula_id,snapshot_id) references formulas(id,snapshot_id),
  check((resolution='constant')=(constant_value is not null)),
  check((resolution='formula')=(dependency_formula_id is not null)),
  check(formula_id is distinct from dependency_formula_id)
);
create table rng_models (
  id uuid primary key default gen_random_uuid(), snapshot_id uuid not null references snapshots(id),
  mechanic_id uuid not null, source_id uuid not null,
  distribution text not null check(distribution in ('unknown','bernoulli','binomial','geometric','weighted_choice','empirical')),
  probability numeric check(probability between 0 and 1),
  independence_status text not null check(independence_status in ('unknown','assumed','tested','rejected')),
  parameters jsonb not null default '{}', notes text,
  foreign key(mechanic_id,snapshot_id) references mechanics(id,snapshot_id),
  foreign key(source_id,snapshot_id) references sources(id,snapshot_id)
);
create table experiments (
  id uuid primary key default gen_random_uuid(), snapshot_id uuid not null references snapshots(id),
  mechanic_id uuid not null, protocol text not null, conditions jsonb not null default '{}',
  status text not null check(status in ('planned','running','completed','invalidated')),
  sample_size integer check(sample_size >= 0), uncertainty jsonb, result_notes text,
  foreign key(mechanic_id,snapshot_id) references mechanics(id,snapshot_id), unique(id,snapshot_id)
);
create table observations (
  id uuid primary key default gen_random_uuid(), snapshot_id uuid not null,
  experiment_id uuid not null, sequence integer not null check(sequence >= 0),
  value numeric not null, unit text not null, event_conditions jsonb not null default '{}',
  foreign key(experiment_id,snapshot_id) references experiments(id,snapshot_id), unique(experiment_id,sequence)
);
-- Published datasets are immutable, including through direct SQL writes.
create function protect_published_snapshot() returns trigger language plpgsql as $$
declare snapshot_uuid uuid; snapshot_state text;
begin
  if TG_OP <> 'INSERT' then
    snapshot_uuid := OLD.snapshot_id;
    select state into snapshot_state from snapshots where id=snapshot_uuid for share;
    if snapshot_state='published' then
      raise exception 'Published snapshots are immutable';
    end if;
  end if;
  if TG_OP <> 'DELETE' then
    snapshot_uuid := NEW.snapshot_id;
    select state into snapshot_state from snapshots where id=snapshot_uuid for share;
    if snapshot_state='published' then
      raise exception 'Published snapshots are immutable';
    end if;
  end if;
  if TG_OP = 'DELETE' then return OLD; else return NEW; end if;
end $$;
do $$ declare table_name text; begin
  foreach table_name in array array['sources','records','mechanics','formulas','formula_dependencies','rng_models','experiments','observations'] loop
    execute format('create trigger immutable_dataset before insert or update or delete on %I for each row execute function protect_published_snapshot()',table_name);
  end loop;
end $$;
create function protect_snapshot() returns trigger language plpgsql as $$
begin
  if OLD.state='published' then raise exception 'Published snapshots are immutable'; end if;
  if TG_OP='DELETE' then return OLD; else return NEW; end if;
end $$;
create trigger immutable_snapshot before update or delete on snapshots for each row execute function protect_snapshot();
create function protect_build() returns trigger language plpgsql as $$
begin
  if exists(select 1 from snapshots where build_id=OLD.id and state='published') then
    raise exception 'Published build context is immutable';
  end if;
  if TG_OP='DELETE' then return OLD; else return NEW; end if;
end $$;
create trigger immutable_build before update or delete on builds for each row execute function protect_build();

insert into seasons(id,name,status,source_url) values (15,'Season of Hell''s Legacy','announced','https://news.blizzard.com/en-us/article/24295394/celebrate-30-years-of-diablo-in-season-of-hell-s-legacy');
-- Announcement metadata only; no invented Season 15 mechanics or drop rates.
insert into builds(id,season_id,patch,channel) values ('73552',15,'3.2.1','live');
