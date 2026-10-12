import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readableTooltip} from '../src/lib/tooltip.js';
import {englishUi} from '../src/lib/ui-translations.js';
test('Readable tooltips remove formatting and preserve unknown values without evaluating source',()=>{
  const raw='{c_label}Mana Cost: {/c}{c_resource}{Resource Cost}{/c}\r\n{if:ADVANCED_TOOLTIP}Lucky Hit: [{Combat Effect Chance}|%|]{/if}\nDeal {payload:DAMAGE} damage. 10% bonus.';
  assert.equal(readableTooltip(raw),'Mana Cost: —\nLucky Hit: —\nDeal — damage. 10% bonus.');
  assert(raw.includes('{payload:DAMAGE}'));assert.equal(readableTooltip(undefined),'');
  assert.equal(readableTooltip('{c_red}A{/c_red} {u}B{/u} {if:x}C{/if}'), 'A B C');
});
test('UI localization preserves numeric counts, separators and source identifiers',()=>{
  assert.equal(englishUi('12.117 kayıt · Sayfa 2 / 500'),'12.117 records · Page 2 / 500');
  assert.equal(englishUi('Büyücü · Çekirdek'),'Sorcerer · Core');
  assert.equal(englishUi('  Yetenekler  '),'  Skills  ');
  assert.equal(englishUi('3.2.1.73552'),'3.2.1.73552');
});
