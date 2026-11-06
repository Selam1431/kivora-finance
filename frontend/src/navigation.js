export const pages = ['dashboard', 'transactions', 'reports', 'settings'];

export function getPageFromHash(hash) {
  const page = String(hash || '').replace(/^#/, '');
  return pages.includes(page) ? page : 'dashboard';
}

export function navigateToPage(page, browserWindow = window) {
  const nextPage = pages.includes(page) ? page : 'dashboard';
  const nextHash = `#${nextPage}`;
  if (browserWindow.location.hash !== nextHash) {
    browserWindow.location.hash = nextHash;
  }
  return nextPage;
}

export function subscribeToHashChanges(browserWindow, onPageChange) {
  const syncPage = () => {
    const page = getPageFromHash(browserWindow.location.hash);
    const normalizedHash = `#${page}`;

    if (browserWindow.location.hash !== normalizedHash) {
      browserWindow.history.replaceState(null, '', normalizedHash);
    }

    onPageChange(page);
  };

  browserWindow.addEventListener('hashchange', syncPage);
  syncPage();
  return () => browserWindow.removeEventListener('hashchange', syncPage);
}
