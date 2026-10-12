import assert from 'node:assert/strict';
import test from 'node:test';
import { damageForEvent, expectedDamage, successWithin, trialsForConfidence, type DamageModel } from '../src/lib/math';
const model: DamageModel = { base: 100, additive: 1, criticalAdditive: .5, vulnerableAdditive: .25, multipliers: [.2,.3], criticalMultiplier: 1.5, vulnerableMultiplier: 1.2, criticalChance: .4, vulnerableUptime: .6 };
test('conditional bonuses apply only to the corresponding event', () => {
  assert.ok(Math.abs(damageForEvent(model,false,false)-312) < 1e-10);
  assert.ok(Math.abs(damageForEvent(model,true,false)-585) < 1e-10);
  assert.ok(Math.abs(damageForEvent(model,false,true)-421.2) < 1e-10);
  assert.ok(Math.abs(damageForEvent(model,true,true)-772.2) < 1e-10);
});
test('expected value enumerates conditional events instead of multiplying naive averages', () => {
  const weighted = .6*.4*312 + .4*.4*585 + .6*.6*421.2 + .4*.6*772.2;
  assert.ok(Math.abs(expectedDamage(model)-weighted) < 1e-10);
  assert.equal(expectedDamage({...model,criticalChance:0,vulnerableUptime:0}),damageForEvent(model,false,false));
});
test('independent factors differ from a shared additive bucket', () => {
  assert.ok(Math.abs(damageForEvent({...model, additive:0, multipliers:[.2,.3]},false,false)-156) < 1e-10);
  assert.equal(damageForEvent({...model, additive:.5, multipliers:[]},false,false),150);
});
test('invalid probability, negative values and numeric overflow are rejected', () => {
  for (const change of [{criticalChance:1.1},{base:NaN},{base:-1},{base:Infinity},{base:1e308,additive:10}]) {
    assert.throws(()=>expectedDamage({...model,...change}),RangeError);
  }
});
test('Bernoulli trials handle edges and stable small probabilities', () => {
  assert.equal(successWithin(1,0),0); assert.equal(successWithin(1,1),1); assert.equal(successWithin(0,100),0);
  assert.ok(Math.abs(successWithin(.5,2)-.75)<1e-14);
  assert.ok(Math.abs(successWithin(1e-12,1e6)-9.999995e-7)<1e-14);
  assert.equal(trialsForConfidence(.5,.75),2);
  assert.equal(trialsForConfidence(0,.95),null); assert.equal(trialsForConfidence(.5,1),null);
  assert.throws(()=>successWithin(.5,1.5)); assert.throws(()=>successWithin(1.2,1));
});
