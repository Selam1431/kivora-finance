import test from 'node:test';
import assert from 'node:assert/strict';
import { currentCalendarMonth, defaultTransactionFilters, readTransactionFilters, saveTransactionFilters, updateTransactionFilters } from '../transactionFilters.js';

function createStorage() {
  const values = new Map();
  return { getItem: key => values.get(key) ?? null, setItem: (key, value) => values.set(key, String(value)) };
}

test('first-use calendar filter opens to the current local month, not transaction history', () => {
  const storage = createStorage();
  const now = new Date(2026, 10, 5, 10);
  assert.deepEqual(readTransactionFilters(storage, now), { searchTerm: '', filterType: 'all', month: '2026-11', monthExplicit: false, startDate: '', endDate: '' });
  assert.equal(currentCalendarMonth(now), '2026-11');
});

test('calendar month, search, and type filter persist across reloads', () => {
  const storage = createStorage();
  const filters = { searchTerm: 'market', filterType: 'payment', month: '2024-01', monthExplicit: true, startDate: '2024-01-05', endDate: '2024-01-25' };
  saveTransactionFilters(storage, filters);
  assert.deepEqual(readTransactionFilters(storage, new Date(2026, 10, 5)), filters);
});

test('invalid saved month falls back to the current month', () => {
  const storage = createStorage();
  saveTransactionFilters(storage, { ...defaultTransactionFilters(new Date(2026, 10, 5)), month: '2023-13' });
  assert.equal(readTransactionFilters(storage, new Date(2026, 10, 5)).month, '2026-11');
});

test('search migrates a previously saved amount query into the unified search field', () => {
  const storage = createStorage();
  storage.setItem('kivoraTransactionFilters', JSON.stringify({ searchTerm: '', amount: '-100.50', month: '2026-11' }));
  assert.equal(readTransactionFilters(storage, new Date(2026, 10, 5)).searchTerm, '-100.50');
});

test('a search clears the automatic current-month filter but preserves a month chosen by the user', () => {
  const now = new Date(2026, 10, 5, 10);
  const initial = defaultTransactionFilters(now);
  assert.equal(updateTransactionFilters(initial, { searchTerm: '-100.50' }, now).month, '');
  const chosenMonth = updateTransactionFilters(initial, { month: '2024-01', monthExplicit: true }, now);
  assert.equal(updateTransactionFilters(chosenMonth, { searchTerm: '-100.50' }, now).month, '2024-01');
});
