import { useMemo, useState } from 'react';
import AddTransactionForm from './AddTransactionForm';
import { deleteTransaction } from '../transactionApi';
import { formatTransactionDate } from '../settingsData';
import { currentCalendarMonth, defaultTransactionFilters, readTransactionFilters, saveTransactionFilters, updateTransactionFilters } from '../transactionFilters';
import { filterTransactions, getTransactionDateRangeError } from '../transactionSearch';
import { paginateTransactions } from '../transactionPagination';
import './TransactionTable.css';

function TransactionTable({ transactions, currency = 'USD', dateFormat = 'MMM D, YYYY', onTransactionsChanged, onAddDeposit }) {
  const [filters, setFilters] = useState(() => readTransactionFilters(localStorage));
  const [currentPage, setCurrentPage] = useState(1);
  const [editingTransaction, setEditingTransaction] = useState(null);
  const [deletingTransaction, setDeletingTransaction] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState('');
  const [actionStatus, setActionStatus] = useState('');

  const filtered = useMemo(() => filterTransactions(transactions, filters), [transactions, filters]);
  const pagination = useMemo(() => paginateTransactions(filtered, currentPage), [filtered, currentPage]);
  const dateRangeError = getTransactionDateRangeError(filters);

  const money = value => new Intl.NumberFormat(undefined, { style: 'currency', currency }).format(Math.abs(Number(value) || 0));
  const updateFilters = patch => {
    const next = updateTransactionFilters(filters, patch);
    setCurrentPage(1);
    setFilters(next);
    try { saveTransactionFilters(localStorage, next); } catch { /* The visible filter still works for this session. */ }
  };
  const clear = () => {
    const next = defaultTransactionFilters();
    setCurrentPage(1);
    setFilters(next);
    try { saveTransactionFilters(localStorage, next); } catch { /* The visible filter still works for this session. */ }
  };
  const clearDisabled = !filters.searchTerm && filters.filterType === 'all' && filters.month === currentCalendarMonth() && !filters.monthExplicit
    && !filters.startDate && !filters.endDate;
  const openEdit = transaction => {
    if (!transaction.id) return;
    setActionStatus('');
    setEditingTransaction(transaction);
  };
  const openDelete = transaction => {
    if (!transaction.id) return;
    setActionStatus('');
    setDeleteError('');
    setDeletingTransaction(transaction);
  };
  const closeDelete = () => {
    if (deleting) return;
    setDeleteError('');
    setDeletingTransaction(null);
  };
  const confirmDelete = async () => {
    if (!deletingTransaction?.id || deleting) return;
    setDeleting(true);
    setDeleteError('');
    try {
      await deleteTransaction(deletingTransaction.id, {
        confirmed: true,
        onSuccess: onTransactionsChanged,
      });
      setActionStatus(`${deletingTransaction.description} was deleted.`);
      setDeletingTransaction(null);
    } catch (error) {
      setDeleteError(error.message || 'Unable to delete this transaction.');
    } finally {
      setDeleting(false);
    }
  };

  const exportCsv = () => {
    const rows = [['Date', 'Time', 'Description', 'Vendor / Source', 'Type', 'Amount'], ...filtered.map(t => [t.date, t.time, t.description, t.vendor, Number(t.amount) > 0 ? 'Deposit' : 'Payment', t.amount])];
    const csv = rows.map(row => row.map(value => `"${String(value ?? '').replaceAll('"', '""')}"`).join(',')).join('\r\n');
    const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }));
    const link = document.createElement('a'); link.href = url; link.download = 'kivora-transactions.csv'; link.click(); URL.revokeObjectURL(url);
  };

  return <>
    <section className="transactions-panel" id="transactions">
      <div className="transactions-toolbar">
        <label className="search-control"><span>⌕</span><input type="search" placeholder="Search amount, description, or vendor" value={filters.searchTerm} onChange={event => updateFilters({ searchTerm: event.target.value })} aria-label="Search amount, description, or vendor" /></label>
        <label className="filter-control"><select value={filters.filterType} onChange={event => updateFilters({ filterType: event.target.value })} aria-label="Filter transactions by type"><option value="all">All types</option><option value="deposit">Deposits</option><option value="payment">Payments</option></select></label>
        <label className="month-control"><span>▦</span><input type="month" value={filters.monthExplicit ? filters.month : ''} onChange={event => updateFilters({ month: event.target.value, monthExplicit: Boolean(event.target.value) })} aria-label="Filter transactions by month" /></label>
        <button className="clear-filters-btn" type="button" onClick={clear} disabled={clearDisabled}>Clear</button>
      </div>
      <div className="transactions-custom-search" role="group" aria-label="Custom transaction search">
        <label><span>Start Date</span><input type="date" value={filters.startDate} onChange={event => updateFilters({ startDate: event.target.value })} aria-invalid={Boolean(dateRangeError)} /></label>
        <label><span>End Date</span><input type="date" value={filters.endDate} onChange={event => updateFilters({ endDate: event.target.value })} aria-invalid={Boolean(dateRangeError)} /></label>
      </div>
      {dateRangeError && <p className="transaction-filter-error" role="alert">{dateRangeError}</p>}
      {actionStatus && <p className="transaction-action-status" role="status">{actionStatus}</p>}
      <div className="transactions-panel-card">
        <div className="transactions-heading"><div><h2>Recent activity</h2><p>{filtered.length} transactions found</p></div><button className="table-menu" type="button" aria-label="Export transactions to CSV" title="Export CSV" onClick={exportCsv}>⇩</button></div>
        <div className="transactions-table-wrapper"><table className="transactions-table"><thead><tr><th>Date</th><th>Description</th><th>Vendor / source</th><th>Type</th><th className="amount-column">Amount</th><th className="transaction-actions-heading">Actions</th></tr></thead>
          <tbody>{pagination.items.map(transaction => {
            const income = Number(transaction.amount) > 0;
            return <tr key={transaction.id}>
              <td><strong>{formatTransactionDate(transaction.date, dateFormat)}</strong><span className="transaction-time">{transaction.time || ''}</span></td>
              <td><div className="transaction-description"><span className={`transaction-symbol ${income ? 'deposit' : 'payment'}`}>{income ? '↙' : '▱'}</span><strong>{transaction.description}</strong></div></td>
              <td className="transaction-vendor-cell">{transaction.vendor}</td>
              <td><span className={`transaction-type ${income ? 'deposit' : 'payment'}`}>{income ? 'Deposit' : 'Payment'}</span></td>
              <td className={`amount-column transaction-amount ${income ? 'positive' : 'negative'}`}>{income ? '+' : '−'}{money(transaction.amount)}</td>
              <td className="transaction-row-actions">
                <button type="button" className="transaction-icon-button edit-transaction" aria-label={`Edit ${transaction.description}`} title="Edit transaction" onClick={() => openEdit(transaction)} disabled={!transaction.id}>
                  <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 20h9"/><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L8 18l-4 1 1-4Z"/></svg>
                </button>
                <button type="button" className="transaction-icon-button delete-transaction" aria-label={`Delete ${transaction.description}`} title="Delete transaction" onClick={() => openDelete(transaction)} disabled={!transaction.id}>
                  <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 6h18"/><path d="M8 6V4h8v2"/><path d="m19 6-1 14H6L5 6"/><path d="M10 11v5M14 11v5"/></svg>
                </button>
              </td>
            </tr>;
          })}{!filtered.length && <tr><td colSpan="6" className="empty-transactions">No transactions match your search and filters. Adjust your criteria or select Clear to see activity.</td></tr>}</tbody>
        </table></div>
        <div className="table-pagination"><span>Showing <b>{pagination.start}–{pagination.end}</b> of <b>{filtered.length}</b> transactions</span><div><button type="button" aria-label="Previous page" onClick={() => setCurrentPage(pagination.currentPage - 1)} disabled={pagination.currentPage === 1}>←</button><span className="current" aria-current="page">Page {pagination.currentPage} of {pagination.totalPages}</span><button type="button" aria-label="Next page" onClick={() => setCurrentPage(pagination.currentPage + 1)} disabled={pagination.currentPage === pagination.totalPages}>→</button></div></div>
      </div>
    </section>

    {editingTransaction && <div className="transaction-modal-backdrop">
      <AddTransactionForm transaction={editingTransaction} currency={currency} onAddDeposit={() => { setEditingTransaction(null); onAddDeposit?.(); }} onClose={() => setEditingTransaction(null)} onTransactionUpdated={() => { setEditingTransaction(null); onTransactionsChanged?.(); setActionStatus(`${editingTransaction.description} was updated.`); }} />
    </div>}

    {deletingTransaction && <div className="transaction-modal-backdrop" onMouseDown={event => event.target === event.currentTarget && closeDelete()} onKeyDown={event => event.key === 'Escape' && closeDelete()}>
      <section className="transaction-confirm-dialog" role="alertdialog" aria-modal="true" aria-labelledby="delete-transaction-title" aria-describedby="delete-transaction-description">
        <button type="button" className="form-close" aria-label="Close confirmation" onClick={closeDelete} disabled={deleting}>×</button>
        <span className="delete-dialog-icon" aria-hidden="true"><svg viewBox="0 0 24 24"><path d="M3 6h18"/><path d="M8 6V4h8v2"/><path d="m19 6-1 14H6L5 6"/><path d="M10 11v5M14 11v5"/></svg></span>
        <p className="section-label">REMOVE ACTIVITY</p>
        <h2 id="delete-transaction-title">Delete transaction?</h2>
        <p id="delete-transaction-description">This will permanently remove <strong>{deletingTransaction.description}</strong> for <strong>{Number(deletingTransaction.amount) > 0 ? '+' : '−'}{money(deletingTransaction.amount)}</strong>.</p>
        {deleteError && <p className="delete-dialog-error" role="alert">{deleteError}</p>}
        <div className="delete-dialog-actions">
          <button type="button" className="form-cancel" onClick={closeDelete} disabled={deleting} autoFocus>Keep transaction</button>
          <button type="button" className="confirm-delete-button" onClick={confirmDelete} disabled={deleting}>{deleting ? 'Deleting…' : 'Delete transaction'}</button>
        </div>
      </section>
    </div>}
  </>;
}

export default TransactionTable;
