const STORAGE_KEY = 'kivoraTransactionFilters';

export function currentCalendarMonth(now = new Date()) {
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
}

export function defaultTransactionFilters(now = new Date()) {
  return { searchTerm: '', filterType: 'all', month: currentCalendarMonth(now), monthExplicit: false, startDate: '', endDate: '' };
}

export function updateTransactionFilters(filters, patch, now = new Date()) {
  const next = { ...filters, ...patch };
  if (Object.hasOwn(patch, 'month')) {
    next.month = patch.month || currentCalendarMonth(now);
    next.monthExplicit = Boolean(patch.month && patch.monthExplicit);
  }

  const hasSearchCriteria = Boolean(next.searchTerm.trim() || next.startDate || next.endDate);
  if (!next.monthExplicit) next.month = hasSearchCriteria ? '' : currentCalendarMonth(now);
  return next;
}

export function readTransactionFilters(storage, now = new Date()) {
  const fallback = defaultTransactionFilters(now);
  try {
    const raw = storage.getItem(STORAGE_KEY);
    if (!raw) return fallback;
    const saved = JSON.parse(raw);
    const validMonth = typeof saved.month === 'string' && /^\d{4}-(0[1-9]|1[0-2])$/.test(saved.month);
    const month = saved.month === '' ? '' : validMonth ? saved.month : fallback.month;
    const monthExplicit = typeof saved.monthExplicit === 'boolean'
      ? saved.monthExplicit
      : validMonth && saved.month !== fallback.month;
    const searchTerm = [saved.searchTerm, saved.amount, saved.description, saved.vendor]
      .find(value => typeof value === 'string' && value.trim()) || '';
    return {
      searchTerm,
      filterType: ['all', 'deposit', 'payment'].includes(saved.filterType) ? saved.filterType : 'all',
      month,
      monthExplicit,
      startDate: typeof saved.startDate === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(saved.startDate) ? saved.startDate : '',
      endDate: typeof saved.endDate === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(saved.endDate) ? saved.endDate : '',
    };
  } catch {
    return fallback;
  }
}

export function saveTransactionFilters(storage, filters) {
  storage.setItem(STORAGE_KEY, JSON.stringify({ ...defaultTransactionFilters(), ...filters }));
}
