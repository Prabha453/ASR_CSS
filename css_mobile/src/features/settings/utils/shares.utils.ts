export function generateTransactionFieldName(transactionName = '') {
  return (
    transactionName
      .toLowerCase()
      .replace(/\s+/g, '_')
      .replace(/[()]/g, '')
      .replace(/&/g, '')
      .replace(/-/g, '_')
      .replace(/_+/g, '_')
      .trim() + '_tno'
  );
}

export function buildShareTransactionDefaults(transactions: { t_name?: string }[]) {
  const defaults: Record<string, string> = {};
  const colors = ['#30a16c', '#9b59b6', '#e74c3c', '#3498db', '#f39c12'];
  transactions.forEach((transaction, index) => {
    const fieldName = generateTransactionFieldName(transaction.t_name ?? '');
    defaults[fieldName] = '';
    defaults[`${fieldName}_color`] = colors[index % colors.length];
  });
  return defaults;
}
