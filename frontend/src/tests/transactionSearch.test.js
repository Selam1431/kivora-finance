import test from 'node:test';
import assert from 'node:assert/strict';
import { filterTransactions, getTransactionDateRangeError, parseAmountCents } from '../transactionSearch.js';

const records = [
  { id: 'deposit-100', date: '2026-04-10', time: '09:00:00', description: 'Salary', vendor: 'Acme', amount: 100 },
  { id: 'deposit-100-50', date: '2026-04-10', time: '08:00:00', description: 'Refund', vendor: 'Acme', amount: 100.5 },
  { id: 'deposit-1000', date: '2026-04-11', time: '09:00:00', description: 'Bonus', vendor: 'Acme', amount: 1000 },
  { id: 'payment-100-50', date: '2026-04-12', time: '12:00:00', description: 'Groceries', vendor: 'Fresh Mart', amount: -100.5 },
  { id: 'payment-100-50-later', date: '2026-04-13', time: '08:00:00', description: 'Fuel', vendor: 'City Fuel', amount: -100.5 },
  { id: 'payment-100', date: '2026-04-14', time: '15:00:00', description: 'Lunch', vendor: 'Cafe', amount: -100 },
];

const ids = result => result.map(transaction => transaction.id);

test('positive amount query matches deposits by exact numeric value', () => {
  assert.deepEqual(ids(filterTransactions(records, { searchTerm: '100' })), ['deposit-100']);
});

test('negative amount query matches payments with the signed amount', () => {
  assert.deepEqual(ids(filterTransactions(records, { searchTerm: '-100' })), ['payment-100']);
});

test('decimal amount query matches exact cents without floating-point comparison errors', () => {
  assert.equal(parseAmountCents('100.50'), 10050n);
  assert.deepEqual(ids(filterTransactions(records, { searchTerm: '100.50' })), ['deposit-100-50']);
  assert.deepEqual(ids(filterTransactions(records, { searchTerm: '-100.50' })), ['payment-100-50-later', 'payment-100-50']);
});

test('amount matching is exact and does not match numeric substrings', () => {
  assert.deepEqual(ids(filterTransactions(records, { searchTerm: '100' })), ['deposit-100']);
  assert.deepEqual(ids(filterTransactions(records, { searchTerm: '1000' })), ['deposit-1000']);
  assert.equal(filterTransactions(records, { searchTerm: '$100' }).length, 0);
  assert.equal(filterTransactions(records, { searchTerm: '1,000' }).length, 0);
});

test('Start Date and End Date are inclusive and validate reversed ranges', () => {
  assert.deepEqual(ids(filterTransactions(records, { startDate: '2026-04-12' })), ['payment-100', 'payment-100-50-later', 'payment-100-50']);
  assert.deepEqual(ids(filterTransactions(records, { endDate: '2026-04-11' })), ['deposit-1000', 'deposit-100', 'deposit-100-50']);
  assert.deepEqual(ids(filterTransactions(records, { startDate: '2026-04-11', endDate: '2026-04-12' })), ['payment-100-50', 'deposit-1000']);
  assert.equal(getTransactionDateRangeError({ startDate: '2026-04-12', endDate: '2026-04-11' }), 'Start Date must be on or before End Date.');
  assert.deepEqual(filterTransactions(records, { startDate: '2026-04-12', endDate: '2026-04-11' }), []);
});

test('Description and Vendor each support case-insensitive partial matching', () => {
  assert.deepEqual(ids(filterTransactions(records, { searchTerm: 'grocer' })), ['payment-100-50']);
  assert.deepEqual(ids(filterTransactions(records, { searchTerm: 'FRESH' })), ['payment-100-50']);
});

test('multiple filters combine and newest matching transactions remain first', () => {
  assert.deepEqual(ids(filterTransactions(records, {
    startDate: '2026-04-12',
    endDate: '2026-04-13',
    searchTerm: '-100.50',
    filterType: 'payment',
    month: '2026-04',
  })), ['payment-100-50-later', 'payment-100-50']);
});

test('blank optional search fields are ignored', () => {
  assert.deepEqual(ids(filterTransactions(records, { searchTerm: '', startDate: '', endDate: '' })), [
    'payment-100', 'payment-100-50-later', 'payment-100-50', 'deposit-1000', 'deposit-100', 'deposit-100-50',
  ]);
});

test('no match returns an empty list for the helpful table empty state', () => {
  assert.deepEqual(filterTransactions(records, { searchTerm: 'no such vendor' }), []);
});

test('default current-month display does not hide older transactions until the month is explicitly selected', () => {
  assert.equal(filterTransactions(records, { month: '2026-04', monthExplicit: false }).length, records.length);
  assert.equal(filterTransactions(records, { month: '2026-04', monthExplicit: true }).length, records.length);
  assert.deepEqual(filterTransactions(records, { month: '2026-03', monthExplicit: true }), []);
});
