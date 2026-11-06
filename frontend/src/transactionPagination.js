export const TRANSACTIONS_PER_PAGE = 10;

export function paginateTransactions(transactions, requestedPage, pageSize = TRANSACTIONS_PER_PAGE) {
  const totalPages = Math.max(1, Math.ceil(transactions.length / pageSize));
  const currentPage = Math.min(Math.max(1, requestedPage), totalPages);
  const startIndex = transactions.length ? (currentPage - 1) * pageSize : 0;
  const endIndex = Math.min(startIndex + pageSize, transactions.length);

  return {
    currentPage,
    totalPages,
    start: transactions.length ? startIndex + 1 : 0,
    end: endIndex,
    items: transactions.slice(startIndex, endIndex),
  };
}
