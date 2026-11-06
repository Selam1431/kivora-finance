import { formatCurrency } from '../dashboardMetrics';
import './SmartSpendingAlert.css';

function SmartSpendingAlert({ projection, currency = 'USD', error = '', processing = false, onCancel, onAddDeposit, onContinue }) {
  return (
    <div className="spending-alert-backdrop">
      <section className="spending-alert-dialog" role="alertdialog" aria-modal="true" aria-labelledby="spending-alert-title" aria-describedby="spending-alert-message">
        <span className="spending-alert-icon" aria-hidden="true">!</span>
        <p className="section-label">SPENDING CHECK</p>
        <h2 id="spending-alert-title">This payment would exceed your balance</h2>
        <p id="spending-alert-message">This payment exceeds your available balance. Consider adding a deposit or reviewing your spending plan.</p>

        <dl className="spending-alert-totals">
          <div><dt>Available balance</dt><dd>{formatCurrency(projection.availableBalance, currency)}</dd></div>
          <div><dt>Attempted payment</dt><dd>{formatCurrency(projection.attemptedPayment, currency)}</dd></div>
          <div><dt>Amount over balance</dt><dd>{formatCurrency(projection.amountOverBalance, currency)}</dd></div>
          <div className="projected"><dt>Projected balance</dt><dd>{formatCurrency(projection.projectedBalance, currency)}</dd></div>
        </dl>

        {error && <p className="spending-alert-error" role="alert">{error}</p>}

        <div className="spending-alert-actions">
          <button type="button" className="spending-alert-cancel" onClick={onCancel} disabled={processing} autoFocus>Cancel Payment</button>
          <button type="button" className="spending-alert-deposit" onClick={onAddDeposit} disabled={processing}>Add Deposit</button>
          <button type="button" className="spending-alert-continue" onClick={onContinue} disabled={processing}>{processing ? 'Rechecking…' : 'Continue Anyway'}</button>
        </div>
      </section>
    </div>
  );
}

export default SmartSpendingAlert;
