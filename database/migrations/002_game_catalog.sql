-- Expand the catalogue without changing any existing published snapshot.
alter table records drop constraint records_kind_check;
alter table records add constraint records_kind_check
  check(kind in ('skills','items','aspects','affixes','skill-tree','classes'));
create unique index records_snapshot_slug on records(snapshot_id,kind,slug) where slug is not null;
create unique index game_snapshot_input on snapshots((manifest->>'inputSha256'))
  where state='published' and manifest->>'kind'='game_data';

create table record_links (
  snapshot_id uuid not null,
  source_kind text not null, source_id text not null,
  target_kind text not null, target_id text not null,
  relation text not null check(relation in ('class_skill','item_affix','aspect_affix','tree_class','tree_skill','skill_modifier')),
  primary key(snapshot_id,source_kind,source_id,target_kind,target_id,relation),
  foreign key(snapshot_id,source_kind,source_id) references records(snapshot_id,kind,id),
  foreign key(snapshot_id,target_kind,target_id) references records(snapshot_id,kind,id)
);
create trigger immutable_dataset before insert or update or delete on record_links
  for each row execute function protect_published_snapshot();
