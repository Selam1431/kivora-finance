export function monthKey(date) {
  if (!(date instanceof Date) || Number.isNaN(date.getTime())) return null;
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
}

export function transactionAmount(transaction) {
  const amount = Number(transaction?.amount);
  return Number.isFinite(amount) ? amount : 0;
}

function transactionMonth(transaction) {
  if (!transaction?.date) return null;
  const date = new Date(`${String(transaction.date).slice(0, 10)}T12:00:00`);
  return monthKey(date);
}

export function getMonthTotals(transactions, key) {
  const rows = transactions.filter(transaction => transactionMonth(transaction) === key);
  return {
    count: rows.length,
    income: rows.reduce((sum, row) => sum + Math.max(0, transactionAmount(row)), 0),
    payments: rows.reduce((sum, row) => sum + Math.abs(Math.min(0, transactionAmount(row))), 0),
  };
}

export function getCalendarMonths(transactions, now = new Date(), count = 6) {
  return Array.from({ length: count }, (_, index) => {
    const month = new Date(now.getFullYear(), now.getMonth() - count + 1 + index, 1);
    const key = monthKey(month);
    const totals = getMonthTotals(transactions, key);
    return { key, label: month.toLocaleDateString(undefined, { month: 'short' }), ...totals };
  });
}

export function getMonthlyChange(transactions, type, now = new Date()) {
  const currentKey = monthKey(now);
  const previousKey = monthKey(new Date(now.getFullYear(), now.getMonth() - 1, 1));
  const current = getMonthTotals(transactions, currentKey);
  const previous = getMonthTotals(transactions, previousKey);
  if (!current.count || !previous.count) return null;
  const field = type === 'income' ? 'income' : 'payments';
  if (previous[field] <= 0) return null;
  return ((current[field] - previous[field]) / previous[field]) * 100;
}

export function calculateSavingsRate(income, savings) {
  const totalIncome = Number(income);
  const netSavings = Number(savings);
  if (!Number.isFinite(totalIncome) || !Number.isFinite(netSavings) || totalIncome <= 0) return null;
  return (netSavings / totalIncome) * 100;
}

export function getSavedProfileName(storage) {
  const first = storage.getItem('kivoraFirstName') || '';
  const last = storage.getItem('kivoraLastName') || '';
  return `${first} ${last}`.trim();
}

export function getGreeting(profileName, date = new Date()) {
  const timeGreeting = date.getHours() < 12 ? 'Good morning' : date.getHours() < 18 ? 'Good afternoon' : 'Good evening';
  return `${timeGreeting}, ${String(profileName || '').trim() || 'there'}`;
}

export function formatCurrency(amount, currency) {
  return new Intl.NumberFormat(undefined, { style: 'currency', currency }).format(Number(amount) || 0);
}
