import { useState } from 'react';
import { createTransaction, checkPaymentBalance, toTransactionPayload, updateTransaction, validateTransactionDraft } from '../transactionApi';
import SmartSpendingAlert from './SmartSpendingAlert';

function AddTransactionForm({ onTransactionAdded, onTransactionUpdated, onAddDeposit, onClose, transaction = null, currency = 'USD', initialType = 'payment' }) {
    const editing = Boolean(transaction);
    const [type, setType] = useState(() => editing && Number(transaction.amount) > 0 ? 'deposit' : initialType);
    const [description, setDescription] = useState(() => transaction?.description || '');
    const [vendor, setVendor] = useState(() => transaction?.vendor || '');
    const [amount, setAmount] = useState(() => transaction ? String(Math.abs(Number(transaction.amount))) : '');
    const [initialDateTime] = useState(() => {
        const currentDate = new Date();
        return {
            date: transaction?.date || currentDate.toLocaleDateString('sv-SE'),
            time: transaction?.time?.slice(0, 5) || currentDate.toTimeString().slice(0, 5),
        };
    });
    const [date, setDate] = useState(initialDateTime.date);
    const [time, setTime] = useState(initialDateTime.time);
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState('');
    const [spendingWarning, setSpendingWarning] = useState(null);
    const [warningError, setWarningError] = useState('');

    async function submitTransaction({ confirmedNegative = false } = {}) {
        if (saving) return;
        setMessage('');
        setWarningError('');

        const validationMessage = validateTransactionDraft({ description, vendor, amount, date, time });
        if (validationMessage) {
            setMessage(validationMessage);
            return;
        }

        setSaving(true);
        let balanceValidated = false;
        try {
            const payload = toTransactionPayload({ description, vendor, amount, date, time, type });
            const balanceCheck = await checkPaymentBalance(payload, editing ? transaction.id : null, { confirmedNegative });
            if (!balanceCheck.allowed) {
                setSpendingWarning(balanceCheck.warning);
                return;
            }
            balanceValidated = true;

            if (editing) await updateTransaction(transaction.id, payload);
            else await createTransaction(payload);

            setSpendingWarning(null);
            setMessage(editing ? 'Transaction updated successfully!' : 'Transaction saved successfully!');
            window.setTimeout(() => setMessage(''), 3000);
            if (editing) onTransactionUpdated?.();
            else onTransactionAdded?.();

            if (!editing) {
                setDescription('');
                setVendor('');
                setAmount('');
                setType('payment');
            }
        } catch (error) {
            if (spendingWarning && !balanceValidated) setWarningError(`Could not recheck your latest balance. No payment was saved. ${error.message || 'Try again when the connection is restored.'}`);
            else if (spendingWarning) setWarningError(`Could not save the payment. No payment was saved. ${error.message || 'Try again.'}`);
            else setMessage(error.message || 'Unable to save this transaction.');
        } finally {
            setSaving(false);
        }
    }

    function handleSubmit(event) {
        event.preventDefault();
        return submitTransaction();
    }

    function handleAddDeposit() {
        setSpendingWarning(null);
        setWarningError('');
        if (onAddDeposit) {
            onAddDeposit();
            return;
        }
        setType('deposit');
        setDescription('');
        setVendor('');
        setAmount('');
    }

    return (
        <>
        <section className="transaction-form-panel" role="dialog" aria-modal={spendingWarning ? undefined : 'true'} aria-hidden={spendingWarning ? 'true' : undefined} inert={spendingWarning ? true : undefined} aria-labelledby="transaction-form-title">
            <button type="button" className="form-close" aria-label="Close form" onClick={onClose} disabled={saving || Boolean(spendingWarning)}>×</button>
            <p className="section-label">{editing ? 'UPDATE ACTIVITY' : 'NEW ACTIVITY'}</p>
            <h2 id="transaction-form-title">{editing ? 'Edit transaction' : 'Add transaction'}</h2>
            <p>{editing ? 'Update the details for this transaction.' : 'Record your income and expenses.'}</p>

            <form onSubmit={handleSubmit}>
                <div className="form-field">
                    <label htmlFor="transaction-type">Transaction Type</label>
                    <select id="transaction-type" value={type} onChange={event => setType(event.target.value)} disabled={saving || Boolean(spendingWarning)}>
                        <option value="payment">Payment</option>
                        <option value="deposit">Deposit</option>
                    </select>
                </div>

                <div className="form-field">
                    <label htmlFor="transaction-date">Date</label>
                    <input id="transaction-date" type="date" value={date} onChange={event => setDate(event.target.value)} required disabled={saving || Boolean(spendingWarning)} />
                </div>

                <div className="form-field">
                    <label htmlFor="transaction-time">Time</label>
                    <input id="transaction-time" type="time" value={time} onChange={event => setTime(event.target.value)} required disabled={saving || Boolean(spendingWarning)} />
                </div>

                <div className="form-field">
                    <label htmlFor="transaction-description">Description</label>
                    <input id="transaction-description" type="text" placeholder="e.g. Grocery shopping" value={description} onChange={event => setDescription(event.target.value)} required disabled={saving || Boolean(spendingWarning)} autoFocus={editing} />
                </div>

                <div className="form-field">
                    <label htmlFor="transaction-vendor">Vendor</label>
                    <input id="transaction-vendor" type="text" placeholder="e.g. Trader Joe's" value={vendor} onChange={event => setVendor(event.target.value)} required disabled={saving || Boolean(spendingWarning)} />
                </div>

                <div className="form-field">
                    <label htmlFor="transaction-amount">Amount</label>
                    <input id="transaction-amount" type="number" min="0.01" step="0.01" placeholder="0.00" value={amount} onChange={event => setAmount(event.target.value)} required disabled={saving || Boolean(spendingWarning)} />
                </div>

                {onClose && <button type="button" className="form-cancel" onClick={onClose} disabled={saving || Boolean(spendingWarning)}>Cancel</button>}
                <button type="submit" disabled={saving || Boolean(spendingWarning)}>{saving ? (editing ? 'Saving changes…' : 'Saving...') : (editing ? 'Save changes' : 'Add Transaction')}</button>
                {message && <p className={`form-message ${message.includes('successfully') ? 'success' : 'error'}`} role={message.includes('successfully') ? 'status' : 'alert'}>{message}</p>}
            </form>
        </section>
        {spendingWarning && <SmartSpendingAlert
            projection={spendingWarning}
            currency={currency}
            error={warningError}
            processing={saving}
            onCancel={() => { setSpendingWarning(null); setWarningError(''); }}
            onAddDeposit={handleAddDeposit}
            onContinue={() => submitTransaction({ confirmedNegative: true })}
        />}
        </>
    );
}

export default AddTransactionForm;
