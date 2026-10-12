import test from 'node:test';
import assert from 'node:assert/strict';
// @ts-expect-error: source tooling is a native JavaScript CLI.
import { parseTree, sourceVersion, references } from '../scripts/source/inventory.mjs';

test('source inventory preserves filenames and pinned blob identity without fetching unrelated assets', () => {
  const id='a'.repeat(40);
  const records=parseTree(`100644 blob ${id}\tjson/base/meta/PlayerClass/Axe Bad Data.pcl.json\n100644 blob ${id}\ttexture/example.png\n`);
  assert.equal(records.length,1);
  assert.equal(records[0].gitBlob,id);
  assert.equal(records[0].kind,'PlayerClass');
  assert.match(records[0].file,/Axe Bad Data/);
  assert.throws(()=>parseTree(`100644 blob ${id}\tjson/base/../secret.json`));
});

test('exact build and file references reject unknown or unsafe source context', () => {
  assert.deepEqual(sourceVersion('3.2.1.73552\n'),{version:'3.2.1.73552',patch:'3.2.1',build:'73552'});
  assert.throws(()=>sourceVersion('unknown'));
  assert.throws(()=>sourceVersion('3.2.1'));
  const ref={__targetFileName__:'base/meta/Power/Sorcerer_Fireball.pow',__raw__:123,groupName:'Power'};
  assert.equal(references({nested:[ref,ref]}).length,1);
  assert.throws(()=>references({__targetFileName__:'../../private'}));
});
