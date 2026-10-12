import {test} from 'node:test';
import assert from 'node:assert/strict';
import {parseExpression,evaluateExpression} from '../src/lib/expression.js';
test('Numeric grammar preserves precedence, variables, conditionals and lazy branches',()=>{
  const solve=(raw:string,inputs:Record<string,number>={})=>evaluateExpression(parseExpression(raw).ast,inputs);
  assert.equal(solve('1 + 2 * 3'),7);assert.equal(solve('(1+2)*3'),9);assert.equal(solve('10-3-2'),5);
  assert.equal(solve('-2 * +3 + .5e1'),-1);
  const parsed=parseExpression('(CurrentWorldTier > 3) ? 1 : 0');assert.deepEqual(parsed.symbols,['CurrentWorldTier']);
  assert.equal(evaluateExpression(parsed.ast,{CurrentWorldTier:4}),1);assert.equal(evaluateExpression(parsed.ast,{CurrentWorldTier:3}),0);
  assert.equal(solve('1 ? 4 : 1/0'),4);assert.equal(solve('0 && missing'),0);assert.equal(solve('1 || missing'),1);
  assert.equal(solve('0 ? 1 : 0 ? 2 : 3'),3);
  assert.throws(()=>solve('x+1'),/Eksik girdi/);assert.throws(()=>solve('1/0'),/Sıfıra/);
  assert.throws(()=>solve('1e308*1e308'),/Sonlu/);
});
test('Unsupported syntax and resource limits fail without executing source text',()=>{
  for(const raw of ['globalThis.x','x=1','constructor.constructor(1)','Math.max(1,2)','LookupTable(4)','[0]','"text"','1;2','1/**/2','1,2','1e999',''])assert.throws(()=>parseExpression(raw));
  assert.throws(()=>parseExpression('('.repeat(60)+'1'+')'.repeat(60)),/derinlik/);
  assert.throws(()=>parseExpression('1+'.repeat(300)+'1'),/token/);
  assert.throws(()=>evaluateExpression(parseExpression('x').ast,{x:NaN}),/Sonlu/);
});
