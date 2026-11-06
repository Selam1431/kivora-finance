function isValidIsoDate(value) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const [year, month, day] = value.split('-').map(Number);
  const date = new Date(year, month - 1, day);
  return date.getFullYear() === year && date.getMonth() === month - 1 && date.getDate() === day;
}

export function parseAmountCents(value) {
  const text = String(value ?? '').trim();
  if (!/^[+-]?\d+(?:\.\d{1,2})?$/.test(text)) return null;
  const negative = text.startsWith('-');
  const unsigned = text.replace(/^[+-]/, '');
  const [whole, fraction = ''] = unsigned.split('.');
  const cents = (BigInt(whole) * 100n) + BigInt(fraction.padEnd(2, '0'));
  return negative ? -cents : cents;
}

export function getTransactionDateRangeError({ startDate = '', endDate = '' }) {
  if (startDate && !isValidIsoDate(startDate)) return 'Enter a valid Start Date.';
  if (endDate && !isValidIsoDate(endDate)) return 'Enter a valid End Date.';
  if (startDate && endDate && startDate > endDate) return 'Start Date must be on or before End Date.';
  return '';
}

export function filterTransactions(transactions, filters) {
  const { searchTerm = '', filterType = 'all', month = '', monthExplicit = false, startDate = '', endDate = '' } = filters;
  if (getTransactionDateRangeError({ startDate, endDate })) return [];
  const globalQuery = String(searchTerm || '').trim();
  const amountQueryCents = globalQuery ? parseAmountCents(globalQuery) : null;

  return [...transactions].filter(transaction => {
    const transactionDate = String(transaction.date || '').slice(0, 10);
    const transactionAmount = Number(transaction.amount);
    const normalizedAmount = parseAmountCents(transaction.amount);
    const matchesText = !globalQuery || `${transaction.description || ''} ${transaction.vendor || ''}`.toLocaleLowerCase().includes(globalQuery.toLocaleLowerCase());
    const matchesAmount = amountQueryCents !== null && Number.isFinite(transactionAmount) && normalizedAmount !== null && normalizedAmount === amountQueryCents;
    const matchesSearch = !globalQuery || matchesText || matchesAmount;
    const matchesStartDate = !startDate || transactionDate >= startDate;
    const matchesEndDate = !endDate || transactionDate <= endDate;
    const matchesType = filterType === 'all' || (filterType === 'deposit' && transactionAmount > 0) || (filterType === 'payment' && transactionAmount < 0);
    const matchesMonth = !month || !monthExplicit || transactionDate.startsWith(month);
    return matchesSearch && matchesStartDate && matchesEndDate && matchesType && matchesMonth;
  }).sort((a, b) => `${String(b.date || '')}T${String(b.time || '')}`.localeCompare(`${String(a.date || '')}T${String(a.time || '')}`));
}
