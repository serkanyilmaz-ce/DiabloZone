import test from 'node:test';
import assert from 'node:assert/strict';
import { archiveSnapshot, archiveMechanics } from '../src/lib/archive-client';
const id='00000000-0000-4000-8000-000000000001';
test('archive UI rejects mixed seasons, malformed data and mismatched snapshots',()=>{
  assert.equal(archiveSnapshot({data:[]}),null);
  const snapshot={id,build_id:'73552',season_id:15,channel:'live',manifest:{kind:'research'}};
  assert.deepEqual(archiveSnapshot({data:[snapshot]}),snapshot);
  assert.throws(()=>archiveSnapshot({data:[{...snapshot,channel:'ptr'}]}));
  assert.throws(()=>archiveSnapshot({data:[{...snapshot,season_id:14}]}));
  assert.throws(()=>archiveSnapshot({data:[{...snapshot,id:'invalid'}]}));
  assert.throws(()=>archiveSnapshot({data:[{...snapshot,manifest:{kind:'game_data'}}]}));
  assert.throws(()=>archiveMechanics({snapshot:{id:'another'},data:[]},id));
  assert.throws(()=>archiveMechanics({snapshot:{id},data:[{slug:'damage',title:'Hasar',status:'invented'}]},id));
});
