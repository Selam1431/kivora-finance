import { useState } from 'react';

function Reports({ summary, currency = 'USD', monthlyActivity = [] }) {
  const [range, setRange] = useState('6');
  const visibleActivity = range === 'all' ? monthlyActivity : monthlyActivity.slice(-Number(range));
  const income = Number(summary?.totalDeposits || 0);
  const payments = Number(summary?.totalPayments || 0);
  const net = income - payments;
  const max = Math.max(1, ...visibleActivity.flatMap(row => [row.income, row.payments]));
  const points = key => visibleActivity.map((row, i) => `${30 + i * (520 / Math.max(visibleActivity.length - 1, 1))},${210 - (row[key] / max) * 180}`).join(' ');
  const format = amount => new Intl.NumberFormat(undefined, { style: 'currency', currency }).format(Number(amount) || 0);

  return (
    <section className="reports-view">
      <div className="reports-toolbar"><label className="range-pill">▦&nbsp; <select aria-label="Report date range" value={range} onChange={event => setRange(event.target.value)}><option value="6">Last 6 months</option><option value="3">Last 3 months</option><option value="all">All available activity</option></select></label></div>
      <div className="reports-layout">
        <article className="reports-panel reports-chart-card">
          <div className="report-heading"><div><h2>Income vs. payments</h2><p>Monthly overview from your transaction history</p></div><div className="chart-key"><span><i className="key-income"/>Income</span><span><i className="key-payment"/>Payments</span></div></div>
          {visibleActivity.length ? <div className="activity-chart"><div className="chart-y-labels"><span>{format(max)}</span><span>{format(max / 2)}</span><span>{format(0)}</span></div><svg viewBox="0 0 580 240" role="img" aria-label="Monthly income and payment chart" preserveAspectRatio="none"><defs><linearGradient id="incomeArea" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#9867e8" stopOpacity=".28"/><stop offset="1" stopColor="#9867e8" stopOpacity="0"/></linearGradient></defs><path d={`M ${points('income')} L 550 232 L 30 232 Z`} fill="url(#incomeArea)"/><polyline points={points('income')} fill="none" stroke="#aa7cff" strokeWidth="3" strokeLinejoin="round" strokeLinecap="round"/><polyline points={points('payments')} fill="none" stroke="#ed42a1" strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round"/><line x1="30" y1="30" x2="550" y2="30"/><line x1="30" y1="120" x2="550" y2="120"/><line x1="30" y1="232" x2="550" y2="232"/></svg><div className="chart-x-labels">{visibleActivity.map((row, i) => <span key={`${row.label}-${i}`}>{row.label}</span>)}</div></div> : <div className="report-empty">Monthly chart appears as transactions are recorded over time.</div>}
        </article>
        <div className="report-summary-column">
          <article className="reports-panel net-report-card"><div className="report-heading"><div><span className="section-label">CASH FLOW</span><h2>Current period</h2></div><span className="report-trend-icon">↗</span></div><strong className={net >= 0 ? 'positive' : 'negative'}>{net >= 0 ? '+' : '−'}{format(Math.abs(net))}</strong><p className="report-growth">From deposits minus payments</p><div className="mini-bars">{monthlyActivity.map((row, i) => <i key={`${row.label}-${i}`} style={{ height: `${Math.max(10, (row.income / max) * 100)}%` }} title={`${row.label}: ${format(row.income)}`} />)}</div></article>
          <article className="reports-panel month-summary-card"><div className="report-heading"><div><h2>Monthly summary</h2><p>Financial overview</p></div><span className="report-trend-icon">ⓢ</span></div><div className="report-value-row"><span>Income</span><strong className="positive">+{format(income)}</strong></div><div className="report-value-row"><span>Payments</span><strong className="negative">−{format(payments)}</strong></div><div className="report-value-row net-row"><span>Net savings</span><strong>{format(net)}</strong></div></article>
        </div>
      </div>
    </section>
  );
}

export default Reports;
