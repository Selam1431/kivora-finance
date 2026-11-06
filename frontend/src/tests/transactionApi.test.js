import test from 'node:test';
import assert from 'node:assert/strict';
import { calculatePaymentProjection, checkPaymentBalance, deleteTransaction, toTransactionPayload, updateTransaction, validateTransactionDraft } from '../transactionApi.js';

const draft = { description: '  Salary  ', vendor: ' Acme ', amount: '125.50', date: '2026-11-05', time: '09:30', type: 'deposit' };

function financeFetcher({ balance, transactions = [] }) {
  return async path => ({
    ok: true,
    status: 200,
    json: async () => path === '/api/reports/summary'
      ? { netBalance: balance, totalDeposits: 0, totalPayments: 0 }
      : transactions,
  });
}

test('draft validation requires text, date, time, and a positive entered amount', () => {
  assert.equal(validateTransactionDraft(draft), null);
  assert.equal(validateTransactionDraft({ ...draft, description: '  ' }), 'Enter a description.');
  assert.equal(validateTransactionDraft({ ...draft, vendor: '' }), 'Enter a vendor or source.');
  assert.equal(validateTransactionDraft({ ...draft, date: '' }), 'Choose a transaction date.');
  assert.equal(validateTransactionDraft({ ...draft, time: '' }), 'Choose a transaction time.');
  assert.equal(validateTransactionDraft({ ...draft, amount: '0' }), 'Enter an amount greater than zero.');
  assert.equal(validateTransactionDraft({ ...draft, amount: '-10' }), 'Enter an amount greater than zero.');
});

test('edit payload trims fields and signs deposits and payments correctly', () => {
  assert.deepEqual(toTransactionPayload(draft), {
    date: '2026-11-05', time: '09:30:00', description: 'Salary', vendor: 'Acme', amount: 125.5,
  });
  assert.equal(toTransactionPayload({ ...draft, type: 'payment' }).amount, -125.5);
});

test('edit sends PUT to the persisted UUID and refreshes only after success', async () => {
  const calls = [];
  let refreshes = 0;
  await updateTransaction('4f6d9372-f8ee-471b-8a8d-1678e9f3cbda', toTransactionPayload(draft), {
    fetcher: async (...args) => { calls.push(args); return { ok: true, status: 200 }; },
    onSuccess: () => { refreshes += 1; },
  });
  assert.equal(calls.length, 1);
  assert.equal(calls[0][0], '/api/transactions/4f6d9372-f8ee-471b-8a8d-1678e9f3cbda');
  assert.equal(calls[0][1].method, 'PUT');
  assert.deepEqual(JSON.parse(calls[0][1].body), toTransactionPayload(draft));
  assert.equal(refreshes, 1);
});

test('canceling delete performs no request and does not refresh', async () => {
  let requests = 0;
  let refreshes = 0;
  const result = await deleteTransaction('4f6d9372-f8ee-471b-8a8d-1678e9f3cbda', {
    confirmed: false,
    fetcher: async () => { requests += 1; return { ok: true, status: 204 }; },
    onSuccess: () => { refreshes += 1; },
  });
  assert.deepEqual(result, { cancelled: true });
  assert.equal(requests, 0);
  assert.equal(refreshes, 0);
});

test('delete handles 204 without parsing JSON and refreshes after confirmation', async () => {
  let call;
  let refreshes = 0;
  await deleteTransaction('4f6d9372-f8ee-471b-8a8d-1678e9f3cbda', {
    confirmed: true,
    fetcher: async (...args) => {
      call = args;
      return { ok: true, status: 204, json: () => { throw new Error('204 has no JSON body'); } };
    },
    onSuccess: () => { refreshes += 1; },
  });
  assert.equal(call[0], '/api/transactions/4f6d9372-f8ee-471b-8a8d-1678e9f3cbda');
  assert.equal(call[1].method, 'DELETE');
  assert.equal(refreshes, 1);
});

test('failed edit and delete surface errors without refreshing', async () => {
  let refreshes = 0;
  const failingFetcher = async () => ({ ok: false, status: 500, text: async () => 'Server unavailable' });
  await assert.rejects(updateTransaction('id-1', toTransactionPayload(draft), {
    fetcher: failingFetcher, onSuccess: () => { refreshes += 1; },
  }), /Server unavailable/);
  await assert.rejects(deleteTransaction('id-1', {
    confirmed: true, fetcher: failingFetcher, onSuccess: () => { refreshes += 1; },
  }), /Server unavailable/);
  assert.equal(refreshes, 0);
});

test('a payment within the fresh available balance needs no warning', async () => {
  const result = await checkPaymentBalance({ amount: -75 }, null, {
    fetcher: financeFetcher({ balance: 100 }),
  });
  assert.equal(result.allowed, true);
  assert.equal(result.warning, null);
});

test('an insufficient balance reports the attempted payment, excess, and projected balance', async () => {
  const result = await checkPaymentBalance({ amount: -80 }, null, {
    fetcher: financeFetcher({ balance: 30 }),
  });
  assert.equal(result.allowed, false);
  assert.deepEqual(result.warning, {
    availableBalance: 30,
    attemptedPayment: 80,
    amountOverBalance: 50,
    projectedBalance: -50,
    requiresConfirmation: true,
  });
});

test('a zero balance warns before any nonzero payment', async () => {
  const result = await checkPaymentBalance({ amount: -20 }, null, {
    fetcher: financeFetcher({ balance: 0 }),
  });
  assert.equal(result.allowed, false);
  assert.equal(result.warning.availableBalance, 0);
  assert.equal(result.warning.amountOverBalance, 20);
});

test('an already negative balance includes its deficit in the warning', async () => {
  const projection = calculatePaymentProjection(-15, -5);
  assert.equal(projection.availableBalance, -15);
  assert.equal(projection.projectedBalance, -20);
  assert.equal(projection.amountOverBalance, 20);
  assert.equal(projection.requiresConfirmation, true);
});

test('editing a payment reverses its fresh original contribution before projection', async () => {
  const result = await checkPaymentBalance({ amount: -60 }, 'saved-payment', {
    fetcher: financeFetcher({
      balance: -10,
      transactions: [{ id: 'saved-payment', amount: -50 }],
    }),
  });
  assert.equal(result.warning.availableBalance, 40);
  assert.equal(result.warning.projectedBalance, -20);
  assert.equal(result.warning.amountOverBalance, 20);
});

test('Continue Anyway allows saving after a fresh negative projection check', async () => {
  const result = await checkPaymentBalance({ amount: -120 }, null, {
    confirmedNegative: true,
    fetcher: financeFetcher({ balance: 100 }),
  });
  assert.equal(result.allowed, true);
  assert.equal(result.warning.projectedBalance, -20);
});
