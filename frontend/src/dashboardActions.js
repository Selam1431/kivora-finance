export function runDashboardQuickAction(action, { openTransaction, navigate }) {
  if (action === 'deposit') return openTransaction('deposit');
  if (action === 'payment') return openTransaction('payment');
  if (action === 'ledger') return navigate('transactions');
  if (action === 'reports') return navigate('reports');
  return undefined;
}
