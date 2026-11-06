export const CURRENCIES = ['USD', 'EUR', 'GBP', 'ETB', 'CAD'];
export const DATE_FORMATS = ['MMM D, YYYY', 'MM/DD/YYYY', 'DD/MM/YYYY', 'YYYY-MM-DD'];
export const ACCOUNT_TYPES = ['Checking', 'Savings', 'Cash', 'Other'];

export function readProfile(storage) {
  const email = storage.getItem('kivoraEmail') || '';
  return {
    firstName: storage.getItem('kivoraFirstName') || '',
    lastName: storage.getItem('kivoraLastName') || '',
    email: email.toLowerCase() === 'jordan.davis@example.com' ? '' : email,
  };
}

export function saveProfile(storage, profile) {
  const saved = {
    firstName: String(profile.firstName || '').trim(),
    lastName: String(profile.lastName || '').trim(),
    email: String(profile.email || '').trim(),
  };
  storage.setItem('kivoraFirstName', saved.firstName);
  storage.setItem('kivoraLastName', saved.lastName);
  storage.setItem('kivoraEmail', saved.email);
  return saved;
}

export function profileInitials(profile) {
  const initials = [profile?.firstName, profile?.lastName]
    .map(value => String(value || '').trim()[0] || '')
    .join('')
    .toUpperCase();
  return initials || '?';
}

export function profileDisplayName(profile) {
  return [profile?.firstName, profile?.lastName].map(value => String(value || '').trim()).filter(Boolean).join(' ') || 'Your profile';
}

export function readPreferences(storage) {
  const currency = storage.getItem('kivoraCurrency');
  const dateFormat = storage.getItem('kivoraDateFormat');
  const weeklyInsights = storage.getItem('kivoraWeeklyInsights');
  return {
    currency: CURRENCIES.includes(currency) ? currency : 'USD',
    dateFormat: DATE_FORMATS.includes(dateFormat) ? dateFormat : 'MMM D, YYYY',
    weeklyInsights: weeklyInsights === null ? true : weeklyInsights === 'true',
  };
}

export function savePreferences(storage, preferences) {
  const saved = {
    currency: CURRENCIES.includes(preferences.currency) ? preferences.currency : 'USD',
    dateFormat: DATE_FORMATS.includes(preferences.dateFormat) ? preferences.dateFormat : 'MMM D, YYYY',
    weeklyInsights: Boolean(preferences.weeklyInsights),
  };
  storage.setItem('kivoraCurrency', saved.currency);
  storage.setItem('kivoraDateFormat', saved.dateFormat);
  storage.setItem('kivoraWeeklyInsights', String(saved.weeklyInsights));
  return saved;
}

export function formatTransactionDate(value, dateFormat = 'MMM D, YYYY', locale) {
  const match = String(value || '').match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (!match) return '—';
  const [, year, month, day] = match;
  if (dateFormat === 'MM/DD/YYYY') return `${month}/${day}/${year}`;
  if (dateFormat === 'DD/MM/YYYY') return `${day}/${month}/${year}`;
  if (dateFormat === 'YYYY-MM-DD') return `${year}-${month}-${day}`;
  const monthName = new Date(Number(year), Number(month) - 1, Number(day)).toLocaleDateString(locale, { month: 'short' });
  return `${monthName} ${Number(day)}, ${year}`;
}

export function readAccounts(storage) {
  const saved = storage.getItem('kivoraAccounts');
  if (!saved) return [];
  try {
    const accounts = JSON.parse(saved);
    if (!Array.isArray(accounts)) return [];
    return accounts.flatMap((account, index) => {
      if (typeof account === 'string' && account.trim()) {
        return [{ id: `legacy-${index}`, name: account.trim(), type: 'Other', archived: false }];
      }
      if (!account || typeof account !== 'object' || !String(account.name || '').trim()) return [];
      return [{
        id: String(account.id || `legacy-${index}`),
        name: String(account.name).trim(),
        type: ACCOUNT_TYPES.includes(account.type) ? account.type : 'Other',
        archived: Boolean(account.archived),
      }];
    });
  } catch {
    return [];
  }
}

export function saveAccounts(storage, accounts) {
  storage.setItem('kivoraAccounts', JSON.stringify(accounts));
}

export function addAccount(accounts, name, type, id = globalThis.crypto?.randomUUID?.()) {
  const cleanName = String(name || '').trim();
  if (!cleanName) throw new Error('Enter an account name.');
  if (!ACCOUNT_TYPES.includes(type)) throw new Error('Choose an account type.');
  const accountId = id || `account-${Date.now()}-${Math.random().toString(16).slice(2)}`;
  return [...accounts, { id: accountId, name: cleanName, type, archived: false }];
}

export function updateAccount(accounts, id, name, type) {
  const cleanName = String(name || '').trim();
  if (!cleanName) throw new Error('Enter an account name.');
  if (!ACCOUNT_TYPES.includes(type)) throw new Error('Choose an account type.');
  return accounts.map(account => account.id === id ? { ...account, name: cleanName, type } : account);
}

export function setAccountArchived(accounts, id, archived) {
  return accounts.map(account => account.id === id ? { ...account, archived: Boolean(archived) } : account);
}
