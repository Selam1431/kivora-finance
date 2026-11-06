import test from 'node:test';
import assert from 'node:assert/strict';
import { calculateSavingsRate, formatCurrency, getCalendarMonths, getGreeting, getMonthlyChange, getSavedProfileName, getMonthTotals } from '../dashboardMetrics.js';

const fixedNow = new Date(2026, 10, 5, 9, 30);
const tx = (date, amount) => ({ date, amount });

test('greeting uses the saved name and the local hour', () => {
  assert.equal(getGreeting('Ari Stone', new Date(2026, 10, 5, 8)), 'Good morning, Ari Stone');
  assert.equal(getGreeting('Ari Stone', new Date(2026, 10, 5, 14)), 'Good afternoon, Ari Stone');
  assert.equal(getGreeting('Ari Stone', new Date(2026, 10, 5, 20)), 'Good evening, Ari Stone');
  assert.equal(getGreeting('', new Date(2026, 10, 5, 20)), 'Good evening, there');
});

test('saved profile storage feeds the personalized greeting, with a neutral fallback when absent', () => {
  const values = new Map();
  const storage = { getItem: key => values.get(key) || null, setItem: (key, value) => values.set(key, value) };
  assert.equal(getSavedProfileName(storage), '');
  storage.setItem('kivoraFirstName', 'Ari');
  storage.setItem('kivoraLastName', 'Stone');
  assert.equal(getGreeting(getSavedProfileName(storage), new Date(2026, 10, 5, 8)), 'Good morning, Ari Stone');
});

test('six-month series includes consecutive local calendar months and zero months', () => {
  const months = getCalendarMonths([tx('2026-06-04', 200), tx('2026-11-02', -50)], fixedNow);
  assert.deepEqual(months.map(month => month.key), ['2026-06', '2026-07', '2026-08', '2026-09', '2026-10', '2026-11']);
  assert.deepEqual(months.map(month => month.income), [200, 0, 0, 0, 0, 0]);
  assert.deepEqual(months.map(month => month.payments), [0, 0, 0, 0, 0, 50]);
});

test('monthly changes require history and a non-zero previous-month baseline', () => {
  assert.equal(getMonthlyChange([], 'income', fixedNow), null);
  assert.equal(getMonthlyChange([tx('2026-10-10', 100), tx('2026-11-02', 150)], 'income', fixedNow), 50);
  assert.equal(getMonthlyChange([tx('2026-10-10', -100), tx('2026-11-02', -75)], 'payments', fixedNow), -25);
  assert.equal(getMonthlyChange([tx('2026-10-10', -100), tx('2026-11-02', 75)], 'income', fixedNow), null);
  assert.equal(getMonthlyChange([tx('2026-10-10', 0), tx('2026-11-02', 75)], 'income', fixedNow), null);
  assert.equal(getMonthlyChange([tx('2026-11-02', 75)], 'income', fixedNow), null);
});

test('savings rate handles zero income, negative savings, and values above 100%', () => {
  assert.equal(calculateSavingsRate(0, 0), null);
  assert.equal(calculateSavingsRate(0, 50), null);
  assert.equal(calculateSavingsRate(100, -25), -25);
  assert.equal(calculateSavingsRate(100, 125), 125);
  const noDepositMonth = getMonthTotals([tx('2026-11-01', -30)], '2026-11');
  assert.equal(calculateSavingsRate(noDepositMonth.income, noDepositMonth.income - noDepositMonth.payments), null);
  const overspentMonth = getMonthTotals([tx('2026-11-01', 100), tx('2026-11-02', -140)], '2026-11');
  assert.equal(calculateSavingsRate(overspentMonth.income, overspentMonth.income - overspentMonth.payments), -40);
});

test('currency formatting changes display only and retains the supplied numeric amount', () => {
  const formatted = formatCurrency(125.5, 'EUR');
  assert.match(formatted, /EUR|€/);
  assert.match(formatted, /125/);
});
