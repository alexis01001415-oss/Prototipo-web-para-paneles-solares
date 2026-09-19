import { test } from 'node:test';
import assert from 'node:assert/strict';
import { calculateQuote, DEFAULT_QUOTE_INPUT } from '../src/quote-model';

test('monthly and bimonthly equivalents give identical proposals', () => {
  const base = calculateQuote(DEFAULT_QUOTE_INPUT);
  assert.equal(base.annualConsumption, 6000);
  assert.equal(base.panelCount, 7);
  assert.deepEqual(base, calculateQuote({ ...DEFAULT_QUOTE_INPUT, amount: 500, period: 'monthly' }));
});
test('bill mode deducts non-compensable charges', () => {
  const result = calculateQuote({ ...DEFAULT_QUOTE_INPUT, mode: 'bill', amount: 4000 });
  assert.equal(result.annualConsumption, 5400);
  assert.equal(result.annualEnergyCost, 21600);
});
test('438 combinations respect roof, savings and coverage bounds', () => {
  for (let amount = 1; amount <= 10000; amount += 137) {
    for (const roofArea of [0, 1, 3.2, 6.4, 40, 150]) {
      const q = calculateQuote({ ...DEFAULT_QUOTE_INPUT, amount, roofArea });
      assert.ok(q.areaRequired <= roofArea + 1e-8);
      assert.ok(q.savingsLow <= q.savingsHigh);
      assert.ok(q.savingsHigh <= q.annualEnergyCost * .95 + 1e-8);
      assert.ok(q.coverageHigh <= 100 && q.coverageLow >= 0);
      assert.ok(Number.isInteger(q.panelCount));
    }
  }
});
test('no roof or consumption gives no installation cost and no savings', () => {
  for (const patch of [{ roofArea: 0 }, { amount: 0 }]) {
    const q = calculateQuote({ ...DEFAULT_QUOTE_INPUT, ...patch });
    assert.equal(q.panelCount, 0); assert.equal(q.priceHigh, 0); assert.equal(q.savingsHigh, 0);
  }
});
test('invalid and non-finite values are rejected', () => {
  for (const patch of [{ amount: NaN }, { amount: -1 }, { tariff: 0 }, { roofArea: Infinity }, { nonEnergyPercent: 101 }]) {
    assert.throws(() => calculateQuote({ ...DEFAULT_QUOTE_INPUT, ...patch }), RangeError);
  }
});
