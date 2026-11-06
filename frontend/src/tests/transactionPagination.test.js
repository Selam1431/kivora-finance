import test from 'node:test';
import assert from 'node:assert/strict';
import { paginateTransactions } from '../transactionPagination.js';
import { filterTransactions } from '../transactionSearch.js';

const transactions = Array.from({ length: 21 }, (_, index) => ({
  id: `transaction-${index + 1}`,
  date: new Date(2026, 10, 21 - index).toISOString().slice(0, 10),
  time: '12:00:00',
  description: index % 2 ? 'Purchase' : 'Deposit',
  vendor: 'Test vendor',
  amount: index % 2 ? -25 : 100,
}));

test('shows ten transactions per page and reports accurate ranges across pages', () => {
  const first = paginateTransactions(transactions, 1);
  const second = paginateTransactions(transactions, 2);
  const last = paginateTransactions(transactions, 3);

  assert.deepEqual([first.start, first.end, first.totalPages, first.items.length], [1, 10, 3, 10]);
  assert.deepEqual([second.start, second.end, second.items.length], [11, 20, 10]);
  assert.deepEqual([last.start, last.end, last.items.length], [21, 21, 1]);
  assert.equal(first.items[0].id, 'transaction-1');
  assert.equal(second.items[0].id, 'transaction-11');
});

test('pagination clamps invalid page numbers and handles empty results', () => {
  assert.equal(paginateTransactions(transactions, 0).currentPage, 1);
  assert.equal(paginateTransactions(transactions, 99).currentPage, 3);
  assert.deepEqual(paginateTransactions([], 4), {
    currentPage: 1,
    totalPages: 1,
    start: 0,
    end: 0,
    items: [],
  });
});

test('filtered newest-first results paginate after all active filters are applied', () => {
  const filtered = filterTransactions(transactions, {
    searchTerm: 'deposit',
    month: '2026-11',
    monthExplicit: true,
    startDate: '2026-11-01',
    endDate: '2026-11-21',
  });
  const firstPage = paginateTransactions(filtered, 1);
  const secondPage = paginateTransactions(filtered, 2);

  assert.equal(filtered.length, 11);
  assert.equal(firstPage.totalPages, 2);
  assert.equal(firstPage.items.length, 10);
  assert.equal(secondPage.currentPage, 2);
  assert.equal(secondPage.items.length, 1);
  assert.deepEqual(firstPage.items.map(row => row.date), [...firstPage.items.map(row => row.date)].sort().reverse());
});
