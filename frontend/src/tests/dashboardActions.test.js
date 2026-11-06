import test from 'node:test';
import assert from 'node:assert/strict';
import { runDashboardQuickAction } from '../dashboardActions.js';

test('Dashboard quick actions navigate to Transactions and Reports', () => {
  const destinations = [];
  const actions = { openTransaction: () => {}, navigate: page => destinations.push(page) };
  runDashboardQuickAction('ledger', actions);
  runDashboardQuickAction('reports', actions);
  assert.deepEqual(destinations, ['transactions', 'reports']);
});

test('Dashboard quick actions open the existing form with the selected transaction type', () => {
  const selectedTypes = [];
  const actions = { openTransaction: type => selectedTypes.push(type), navigate: () => {} };
  runDashboardQuickAction('deposit', actions);
  runDashboardQuickAction('payment', actions);
  assert.deepEqual(selectedTypes, ['deposit', 'payment']);
});
