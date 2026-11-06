import { useEffect, useMemo, useState } from 'react';
import AddTransactionForm from './components/AddTransactionForm';
import Sidebar from './components/Sidebar';
import SummaryCard from './components/SummaryCard';
import TransactionTable from './components/TransactionTable';
import Reports from './components/Reports';
import Settings from './components/Settings';
import { calculateSavingsRate, formatCurrency, getCalendarMonths, getGreeting, getMonthlyChange, getMonthTotals, monthKey } from './dashboardMetrics';
import { getPageFromHash, navigateToPage, subscribeToHashChanges } from './navigation';
import { runDashboardQuickAction } from './dashboardActions';
import { profileDisplayName, profileInitials, readPreferences, readProfile, savePreferences, saveProfile } from './settingsData';
import './App.css';

const formatChange = value => {
  if (!Number.isFinite(value)) return { label: 'Not enough data', direction: 'neutral' };
  const rounded = Math.round(value * 10) / 10;
  return { label: `${rounded > 0 ? '+' : ''}${rounded}% vs last month`, direction: rounded > 0 ? 'up' : rounded < 0 ? 'down' : 'neutral' };
};

function App() {
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [transactionsLoading, setTransactionsLoading] = useState(true);
  const [transactionsError, setTransactionsError] = useState(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const [activePage, setActivePage] = useState(() => getPageFromHash(window.location.hash));
  const navigate = page => navigateToPage(page, window);
  const [formOpen, setFormOpen] = useState(false);
  const [formInitialType, setFormInitialType] = useState('payment');
  const [preferences, setPreferences] = useState(() => readPreferences(localStorage));
  const currency = preferences.currency;
  const [profile, setProfile] = useState(() => readProfile(localStorage));
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const timer = window.setInterval(() => setNow(new Date()), 60_000);
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => subscribeToHashChanges(window, setActivePage), []);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [activePage]);

  useEffect(() => {
    const controller = new AbortController();
    async function loadSummary() {
      setLoading(true);
      setError(null);
      try {
        const response = await fetch('/api/reports/summary', { signal: controller.signal });
        if (!response.ok) throw new Error('Unable to load financial summary.');
        setSummary(await response.json());
        setError(null);
      } catch (err) {
        if (err.name !== 'AbortError') setError(err.message);
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }
    loadSummary();
    return () => controller.abort();
  }, [refreshKey]);

  useEffect(() => {
    const controller = new AbortController();
    async function loadTransactions() {
      setTransactionsLoading(true);
      setTransactionsError(null);
      try {
        const response = await fetch('/api/transactions', { signal: controller.signal });
        if (!response.ok) throw new Error('Unable to load transactions.');
        const data = await response.json();
        setTransactions(Array.isArray(data) ? data : []);
        setTransactionsError(null);
      } catch (err) {
        if (err.name !== 'AbortError') setTransactionsError(err.message);
      } finally {
        if (!controller.signal.aborted) setTransactionsLoading(false);
      }
    }
    loadTransactions();
    return () => controller.abort();
  }, [refreshKey]);

  const monthlyActivity = useMemo(() => getCalendarMonths(transactions, now), [transactions, now]);

  const changeFor = type => {
    if (transactionsLoading || transactionsError) return formatChange(null);
    return formatChange(getMonthlyChange(transactions, type, now));
  };

  const currentMonthTotals = useMemo(() => getMonthTotals(transactions, monthKey(now)), [transactions, now]);
  const currentIncome = currentMonthTotals.income;
  const currentPayments = currentMonthTotals.payments;
  const currentSavings = currentIncome - currentPayments;
  const savingsRate = transactionsLoading || transactionsError ? null : calculateSavingsRate(currentIncome, currentSavings);
  const hasSixMonthActivity = monthlyActivity.some(month => month.income > 0 || month.payments > 0);

  const displayAmount = amount => loading ? 'Loading…' : error || !summary ? '—' : formatCurrency(amount, currency);
  const openNewTransaction = initialType => {
    setFormInitialType(initialType);
    setFormOpen(true);
  };
  const handleTransactionAdded = () => {
    setFormOpen(false);
    setFormInitialType('payment');
    setRefreshKey(previous => previous + 1);
  };
  const handleTransactionsChanged = () => setRefreshKey(previous => previous + 1);
  const handleProfileSave = nextProfile => setProfile(saveProfile(localStorage, nextProfile));
  const handlePreferenceChange = (key, value) => {
    setPreferences(savePreferences(localStorage, { ...preferences, [key]: value }));
  };
  const handleDashboardQuickAction = action => runDashboardQuickAction(action, {
    openTransaction: openNewTransaction,
    navigate,
  });

  const todayLabel = now.toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' }).toUpperCase();
  const firstName = profile.firstName;
  const greeting = getGreeting(firstName, now);
  const header = activePage === 'dashboard'
    ? <div className="kivora-welcome-content">
        <div className="kivora-brand-lockup"><span>KIVORA</span><p>Your Money. Your Future.</p></div>
        <p className="section-label">{todayLabel}</p>
        <h1>{greeting}</h1>
        <p className="dashboard-subtitle">Take control of your financial journey.</p>
        <nav className="dashboard-quick-actions" aria-label="Dashboard quick actions">
          <button type="button" onClick={() => handleDashboardQuickAction('deposit')}><span aria-hidden="true">＋</span>Add Deposit</button>
          <button type="button" onClick={() => handleDashboardQuickAction('payment')}><span aria-hidden="true">↗</span>Make Payment</button>
          <button type="button" onClick={() => handleDashboardQuickAction('ledger')}><span aria-hidden="true">▤</span>View Ledger</button>
          <button type="button" onClick={() => handleDashboardQuickAction('reports')}><span aria-hidden="true">▥</span>Reports</button>
        </nav>
      </div>
    : <><p className="section-label">{activePage === 'transactions' ? 'MONEY MOVEMENT' : activePage === 'reports' ? 'YOUR FINANCIAL STORY' : 'YOUR SPACE'}</p><h1>{activePage === 'transactions' ? 'Transactions' : activePage === 'reports' ? 'Reports & insights' : 'Settings'}</h1><p className="dashboard-subtitle">{activePage === 'transactions' ? 'Keep a clear record of every deposit and payment.' : activePage === 'reports' ? 'See the bigger picture behind your everyday decisions.' : 'Manage your profile, preferences, and financial workspace.'}</p></>;

  return (
    <div className="app-layout">
      <Sidebar activePage={activePage} setActivePage={navigate} transactionCount={transactions.length} profile={profile} />
      <main className="main-content">
        <header className={`dashboard-header ${activePage === 'dashboard' ? 'kivora-welcome' : ''}`}><div>{header}</div>{activePage !== 'dashboard' && <div className="header-avatar" aria-label={profileDisplayName(profile)}>{profileInitials(profile)}</div>}</header>
        {error && <p className="dashboard-error" role="alert">Could not load financial summary: {error}</p>}

        {activePage === 'dashboard' && <>
          <section className="summary-grid" aria-label="Financial summary">
            <SummaryCard title="Total balance" amount={displayAmount(summary?.netBalance)} description="Current balance" type="balance" change={formatChange(NaN)} />
            <SummaryCard title="Total income" amount={displayAmount(summary?.totalDeposits)} description="Income received" type="income" change={changeFor('income')} />
            <SummaryCard title="Total payments" amount={displayAmount(summary?.totalPayments)} description="Payments made" type="expenses" change={changeFor('payments')} />
          </section>
          <section className="dashboard-lower">
            <article className="momentum-card">
              <div className="momentum-copy"><span className="sparkle-mark">✧</span><p className="section-label">A LITTLE PERSPECTIVE</p><h2>Financial momentum</h2><p>{transactionsLoading ? 'Loading this month’s savings activity…' : transactionsError ? 'Savings insights are unavailable until transaction history loads.' : savingsRate === null ? 'No income recorded this month. Add transaction history to calculate your savings rate.' : savingsRate < 0 ? `Payments exceed income by ${formatCurrency(Math.abs(currentSavings), currency)} this month.` : `You saved ${formatCurrency(currentSavings, currency)} from this month’s income.`}</p><button type="button" onClick={() => navigate('reports')}>View your insights&nbsp; ↗</button></div>
              <div className={`momentum-ring ${savingsRate !== null && savingsRate < 0 ? 'negative-rate' : ''}`} style={{ '--rate': `${savingsRate === null ? 0 : Math.max(0, Math.min(100, savingsRate))}%` }}><div><strong>{transactionsLoading || transactionsError || savingsRate === null ? '—' : `${Math.round(savingsRate)}%`}</strong><span>{transactionsLoading ? 'loading' : transactionsError ? 'unavailable' : savingsRate === null ? 'no income' : savingsRate < 0 ? 'negative savings' : savingsRate > 100 ? 'over 100%' : 'savings rate'}</span></div></div>
            </article>
            <article className="cashflow-card"><div className="cashflow-heading"><div><p className="section-label">CASH FLOW</p><h2>Last 6 months</h2></div><span className="cashflow-arrow">↗</span></div>
              {transactionsLoading ? <p className="chart-empty">Loading activity…</p> : transactionsError ? <p className="chart-empty" role="alert">Could not load cash flow. Try again when your connection is restored.</p> : !transactions.length ? <p className="chart-empty">No transactions yet. Add a transaction to see monthly cash flow.</p> : !hasSixMonthActivity ? <p className="chart-empty">No transaction activity in the last six calendar months.</p> : <><div className="cashflow-legend"><span><i className="income-key"/>Income</span><span><i className="payment-key"/>Payments</span></div><div className="cashflow-bars">{monthlyActivity.map(item => { const max = Math.max(1, ...monthlyActivity.flatMap(month => [month.income, month.payments])); return <div className="cashflow-bar-column" key={item.key} role="img" tabIndex="0" title={`${item.label}: income ${formatCurrency(item.income, currency)}, payments ${formatCurrency(item.payments, currency)}`} aria-label={`${item.label}: income ${formatCurrency(item.income, currency)}, payments ${formatCurrency(item.payments, currency)}`}><div className="cashflow-pair"><div className="cashflow-bar-wrap"><i className="income-bar" style={{ height: `${item.income ? Math.max(4, (item.income / max) * 100) : 0}%` }}><span className="bar-tooltip">Income: {formatCurrency(item.income, currency)}</span></i></div><div className="cashflow-bar-wrap"><i className="payment-bar" style={{ height: `${item.payments ? Math.max(4, (item.payments / max) * 100) : 0}%` }}><span className="bar-tooltip">Payments: {formatCurrency(item.payments, currency)}</span></i></div></div><span>{item.label}</span></div>; })}</div></>}
            </article>
          </section>
        </>}

        {activePage === 'transactions' && <>
          <div className="transactions-toolbar"><span className="transactions-toolbar-spacer"/><button className="add-transaction-button" type="button" onClick={() => openNewTransaction('payment')}>＋&nbsp; Add transaction</button></div>
          {transactionsLoading && !transactions.length ? <p className="transactions-status" role="status">Loading transactions…</p> : transactionsError && !transactions.length ? <p className="dashboard-error" role="alert">Could not load transactions: {transactionsError}</p> : <>
            {transactionsLoading && <p className="transactions-status" role="status">Refreshing transactions…</p>}
            {transactionsError && <p className="dashboard-error" role="alert">Could not refresh transactions: {transactionsError}. The last loaded list is still shown.</p>}
            <TransactionTable transactions={transactions} currency={currency} dateFormat={preferences.dateFormat} onTransactionsChanged={handleTransactionsChanged} onAddDeposit={() => openNewTransaction('deposit')} />
          </>}
        </>}
        {activePage === 'reports' && <Reports summary={summary} currency={currency} monthlyActivity={monthlyActivity} />}
        {activePage === 'settings' && <Settings profile={profile} preferences={preferences} onProfileSave={handleProfileSave} onPreferenceChange={handlePreferenceChange} />}
      </main>
      {formOpen && <div className="transaction-modal-backdrop" onMouseDown={event => event.target === event.currentTarget && setFormOpen(false)}><AddTransactionForm key={formInitialType} initialType={formInitialType} currency={currency} onAddDeposit={() => openNewTransaction('deposit')} onTransactionAdded={handleTransactionAdded} onClose={() => setFormOpen(false)} /></div>}
    </div>
  );
}

export default App;
