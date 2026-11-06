import test from 'node:test';
import assert from 'node:assert/strict';
import { addAccount, formatTransactionDate, profileDisplayName, profileInitials, readAccounts, readPreferences, readProfile, saveAccounts, savePreferences, saveProfile, setAccountArchived, updateAccount } from '../settingsData.js';
import { formatCurrency } from '../dashboardMetrics.js';
import { getGreeting } from '../dashboardMetrics.js';

function createStorage(initial = {}) {
  const values = new Map(Object.entries(initial));
  return {
    getItem: key => values.has(key) ? values.get(key) : null,
    setItem: (key, value) => values.set(key, String(value)),
    values,
  };
}

test('saved profile updates one shared name, email, and matching initials without a demo fallback', () => {
  const storage = createStorage({ kivoraFirstName: 'Sel', kivoraLastName: 'Dijon', kivoraEmail: 'sel@example.com' });
  const saved = saveProfile(storage, { firstName: 'Sel', lastName: 'Dijon', email: 'sel.dijon@example.com' });
  assert.deepEqual(readProfile(storage), saved);
  assert.equal(profileDisplayName(saved), 'Sel Dijon');
  assert.equal(profileInitials(saved), 'SD');
  assert.equal(saved.email, 'sel.dijon@example.com');
  assert.equal(getGreeting(saved.firstName, new Date(2026, 10, 5, 9)), 'Good morning, Sel');
});

test('reading a profile never overwrites existing saved values', () => {
  const storage = createStorage({ kivoraFirstName: 'Sel', kivoraLastName: 'Dijon', kivoraEmail: 'sel@example.com' });
  const before = [...storage.values];
  assert.deepEqual(readProfile(storage), { firstName: 'Sel', lastName: 'Dijon', email: 'sel@example.com' });
  assert.deepEqual([...storage.values], before);
});

test('profile can be refreshed from storage and empty values do not restore demo email', () => {
  const storage = createStorage({ kivoraFirstName: 'Sel', kivoraLastName: 'Dijon' });
  assert.deepEqual(readProfile(storage), { firstName: 'Sel', lastName: 'Dijon', email: '' });
  assert.equal(profileInitials(readProfile(storage)), 'SD');
});

test('legacy demo email placeholder is hidden without rewriting saved storage', () => {
  const storage = createStorage({ kivoraFirstName: 'Sel', kivoraLastName: 'Dijon', kivoraEmail: 'jordan.davis@example.com' });
  assert.equal(readProfile(storage).email, '');
  assert.equal(storage.getItem('kivoraEmail'), 'jordan.davis@example.com');
});

test('preferences persist across reloads and currency formatting uses the selected code without conversion', () => {
  const storage = createStorage({ kivoraCurrency: 'USD' });
  const selected = savePreferences(storage, { currency: 'EUR', dateFormat: 'DD/MM/YYYY', weeklyInsights: false });
  assert.deepEqual(readPreferences(storage), selected);
  assert.equal(storage.getItem('kivoraCurrency'), 'EUR');
  assert.match(formatCurrency(125.5, selected.currency), /EUR|€/);
  assert.match(formatCurrency(125.5, selected.currency), /125/);
  assert.equal(formatTransactionDate('2026-11-05', selected.dateFormat), '05/11/2026');
});

test('transaction date formatter supports each preference and handles missing dates', () => {
  assert.equal(formatTransactionDate('2026-11-05', 'MM/DD/YYYY'), '11/05/2026');
  assert.equal(formatTransactionDate('2026-11-05', 'DD/MM/YYYY'), '05/11/2026');
  assert.equal(formatTransactionDate('2026-11-05', 'YYYY-MM-DD'), '2026-11-05');
  assert.equal(formatTransactionDate('2026-11-05', 'MMM D, YYYY', 'en-US'), 'Nov 5, 2026');
  assert.equal(formatTransactionDate('', 'YYYY-MM-DD'), '—');
});

test('accounts add, rename, archive, restore, and persist without balances', () => {
  const storage = createStorage();
  const added = addAccount([], 'Everyday', 'Checking', 'acct-1');
  const renamed = updateAccount(added, 'acct-1', 'Main checking', 'Checking');
  const archived = setAccountArchived(renamed, 'acct-1', true);
  saveAccounts(storage, archived);
  assert.deepEqual(readAccounts(storage), archived);
  assert.equal(readAccounts(storage)[0].archived, true);
  const restored = setAccountArchived(readAccounts(storage), 'acct-1', false);
  assert.equal(restored[0].name, 'Main checking');
  assert.equal(restored[0].archived, false);
  assert.equal('balance' in restored[0], false);
});
