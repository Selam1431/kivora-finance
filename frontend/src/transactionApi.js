export function validateTransactionDraft({ description, vendor, amount, date, time }) {
  if (!String(description || '').trim()) return 'Enter a description.';
  if (!String(vendor || '').trim()) return 'Enter a vendor or source.';
  if (!date) return 'Choose a transaction date.';
  if (!time) return 'Choose a transaction time.';
  const numericAmount = Number(amount);
  if (!Number.isFinite(numericAmount) || numericAmount <= 0) return 'Enter an amount greater than zero.';
  return null;
}

export function toTransactionPayload({ description, vendor, amount, date, time, type }) {
  const numericAmount = Math.abs(Number(amount));
  return {
    date,
    time: time.length === 5 ? `${time}:00` : time,
    description: description.trim(),
    vendor: vendor.trim(),
    amount: type === 'deposit' ? numericAmount : -numericAmount,
  };
}

async function ensureSuccess(response, action) {
  if (response.ok) return;
  let detail = '';
  try {
    const body = await response.text();
    if (body) {
      try {
        const parsed = JSON.parse(body);
        detail = parsed.detail || parsed.message || parsed.title || body;
      } catch {
        detail = body;
      }
    }
  } catch {
    // Use the status fallback when the error response has no readable body.
  }
  throw new Error(detail || `${action} failed (HTTP ${response.status}).`);
}

async function readJson(response, action) {
  await ensureSuccess(response, action);
  try {
    return await response.json();
  } catch {
    throw new Error(`${action} returned invalid data.`);
  }
}

const toCents = value => Math.round(Number(value) * 100);

export function calculatePaymentProjection(currentBalance, paymentAmount, originalContribution = 0) {
  const values = [currentBalance, paymentAmount, originalContribution].map(Number);
  if (!values.every(Number.isFinite)) {
    throw new Error('Unable to validate this payment against a valid balance.');
  }

  const [balanceCents, paymentCents, originalCents] = values.map(toCents);
  const availableCents = balanceCents - originalCents;
  const projectedCents = availableCents + paymentCents;

  return {
    availableBalance: availableCents / 100,
    attemptedPayment: Math.abs(paymentCents) / 100,
    amountOverBalance: Math.max(0, -projectedCents) / 100,
    projectedBalance: projectedCents / 100,
    requiresConfirmation: paymentCents < 0 && projectedCents < 0,
  };
}

export async function checkPaymentBalance(payload, transactionId, {
  confirmedNegative = false,
  fetcher = fetch,
} = {}) {
  const proposedAmount = Number(payload?.amount);
  if (!Number.isFinite(proposedAmount)) {
    throw new Error('Unable to validate this payment amount.');
  }
  if (proposedAmount >= 0) return { allowed: true, warning: null };

  const summaryResponse = await fetcher('/api/reports/summary');
  const summary = await readJson(summaryResponse, 'Checking your available balance');
  const currentBalance = Number(summary?.netBalance);
  if (!Number.isFinite(currentBalance)) {
    throw new Error('The latest financial summary does not include a valid balance.');
  }

  let originalContribution = 0;
  if (transactionId) {
    const transactionsResponse = await fetcher('/api/transactions');
    const transactions = await readJson(transactionsResponse, 'Checking the transaction being edited');
    if (!Array.isArray(transactions)) {
      throw new Error('The latest transaction history could not be verified.');
    }
    const original = transactions.find(item => String(item.id) === String(transactionId));
    if (!original || !Number.isFinite(Number(original.amount))) {
      throw new Error('The transaction being edited could not be verified. Refresh and try again.');
    }
    originalContribution = Number(original.amount);
  }

  const projection = calculatePaymentProjection(currentBalance, proposedAmount, originalContribution);
  const warning = projection.requiresConfirmation ? projection : null;
  return { allowed: !warning || confirmedNegative, warning };
}

export async function updateTransaction(id, payload, { fetcher = fetch, onSuccess } = {}) {
  if (!id) throw new Error('This transaction has no saved ID and cannot be edited.');
  const response = await fetcher(`/api/transactions/${encodeURIComponent(id)}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  await ensureSuccess(response, 'Updating transaction');
  onSuccess?.();
}

export async function createTransaction(payload, { fetcher = fetch, onSuccess } = {}) {
  const response = await fetcher('/api/transactions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  await ensureSuccess(response, 'Saving transaction');
  onSuccess?.();
}

export async function deleteTransaction(id, { confirmed = false, fetcher = fetch, onSuccess } = {}) {
  if (!confirmed) return { cancelled: true };
  if (!id) throw new Error('This transaction has no saved ID and cannot be deleted.');
  const response = await fetcher(`/api/transactions/${encodeURIComponent(id)}`, { method: 'DELETE' });
  await ensureSuccess(response, 'Deleting transaction');
  onSuccess?.();
  return { cancelled: false };
}
