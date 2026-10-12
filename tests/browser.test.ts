import assert from 'node:assert/strict';
import test from 'node:test';
import { matchesEntry, pageSlice } from '../src/lib/browser';
test('Turkish search normalizes case/diacritics and intersects words with filters', () => {
  const entry = {text:'BÜYÜCÜ ateş hasarı',filters:{class:'sorcerer'}};
  assert.equal(matchesEntry(entry,'buyucu ates',{class:'sorcerer'}),true);
  assert.equal(matchesEntry(entry,'buyucu ates',{class:'druid'}),false);
  assert.equal(matchesEntry(entry,'buyucu buz',{}),false);
});
test('pagination clamps malformed/out-of-bounds pages and preserves all records', () => {
  const values=Array.from({length:49},(_,index)=>index);
  assert.deepEqual(pageSlice(values,3).entries,[48]);
  assert.equal(pageSlice(values,99).page,3);
  assert.equal(pageSlice(values,NaN).page,1);
  assert.deepEqual(pageSlice([],99),{page:1,pages:1,entries:[]});
});
