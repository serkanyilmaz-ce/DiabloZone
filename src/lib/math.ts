export interface DamageModel {
  base: number;
  additive: number;
  criticalAdditive: number;
  vulnerableAdditive: number;
  multipliers: number[];
  criticalMultiplier: number;
  vulnerableMultiplier: number;
  criticalChance: number;
  vulnerableUptime: number;
}
const nonnegative = (value: number, name: string) => {
  if (!Number.isFinite(value) || value < 0) throw new RangeError(`${name}: sonlu ve negatif olmayan bir sayı gerekli.`);
};
export function validateDamage(model: DamageModel): void {
  for (const [name, value] of Object.entries(model)) {
    if (Array.isArray(value)) value.forEach(part => nonnegative(part, name));
    else nonnegative(value, name);
  }
  if (model.criticalChance > 1 || model.vulnerableUptime > 1) throw new RangeError('Olasılık 0 ile 1 arasında olmalı.');
}
export function damageForEvent(model: DamageModel, critical: boolean, vulnerable: boolean): number {
  validateDamage(model);
  const additive = 1 + model.additive + (critical ? model.criticalAdditive : 0) + (vulnerable ? model.vulnerableAdditive : 0);
  const independent = model.multipliers.reduce((product, bonus) => product * (1 + bonus), 1);
  const result = model.base * additive * independent * (critical ? model.criticalMultiplier : 1) * (vulnerable ? model.vulnerableMultiplier : 1);
  if (!Number.isFinite(result)) throw new RangeError('Hesap sayısal sınırı aştı. Girdileri küçült.');
  return result;
}
// Assumes independent critical and vulnerable events; not an assertion about D4.
export function expectedDamage(model: DamageModel): number {
  return [false, true].reduce((sum, critical) => sum + [false, true].reduce((subtotal, vulnerable) => {
    const probability = (critical ? model.criticalChance : 1 - model.criticalChance) * (vulnerable ? model.vulnerableUptime : 1 - model.vulnerableUptime);
    return subtotal + probability * damageForEvent(model, critical, vulnerable);
  }, 0), 0);
}
export function successWithin(probability: number, trials: number): number {
  nonnegative(probability, 'Olasılık'); nonnegative(trials, 'Deneme sayısı');
  if (probability > 1 || !Number.isSafeInteger(trials)) throw new RangeError('Olasılık [0,1], deneme sayısı güvenli bir tam sayı olmalı.');
  if (trials === 0 || probability === 0) return 0;
  if (probability === 1) return 1;
  return -Math.expm1(trials * Math.log1p(-probability));
}
export function trialsForConfidence(probability: number, confidence: number): number | null {
  nonnegative(probability, 'Olasılık'); nonnegative(confidence, 'Hedef olasılık');
  if (probability > 1 || confidence > 1) throw new RangeError('Olasılıklar [0,1] aralığında olmalı.');
  if (confidence === 0) return 0;
  if (probability === 1) return 1;
  if (probability === 0 || confidence === 1) return null;
  return Math.ceil(Math.log1p(-confidence) / Math.log1p(-probability));
}
