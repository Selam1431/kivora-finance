import test from 'node:test';
import assert from 'node:assert/strict';
import { getPageFromHash, navigateToPage, subscribeToHashChanges } from '../navigation.js';

function createHashWindow(initialHash = '') {
  const historyEntries = [initialHash];
  let historyIndex = 0;
  const listeners = new Map();

  const dispatchHashChange = () => {
    for (const listener of listeners.get('hashchange') || []) listener();
  };

  const browserWindow = {
    location: {},
    history: {
      replaceState(_state, _title, hash) {
        historyEntries[historyIndex] = hash;
      },
    },
    addEventListener(type, listener) {
      const eventListeners = listeners.get(type) || new Set();
      eventListeners.add(listener);
      listeners.set(type, eventListeners);
    },
    removeEventListener(type, listener) {
      listeners.get(type)?.delete(listener);
    },
    back() {
      if (historyIndex === 0) return;
      historyIndex -= 1;
      dispatchHashChange();
    },
    forward() {
      if (historyIndex >= historyEntries.length - 1) return;
      historyIndex += 1;
      dispatchHashChange();
    },
  };

  Object.defineProperty(browserWindow.location, 'hash', {
    get: () => historyEntries[historyIndex],
    set: value => {
      const nextHash = value.startsWith('#') ? value : `#${value}`;
      if (nextHash === historyEntries[historyIndex]) return;
      historyEntries.splice(historyIndex + 1);
      historyEntries.push(nextHash);
      historyIndex += 1;
      dispatchHashChange();
    },
  });

  return browserWindow;
}

test('initial hash selects each supported page', () => {
  for (const page of ['dashboard', 'transactions', 'reports', 'settings']) {
    assert.equal(getPageFromHash(`#${page}`), page);
  }
});

test('refresh initializes from the current hash instead of defaulting to Dashboard', () => {
  const browserWindow = createHashWindow('#transactions');
  let activePage;
  const unsubscribe = subscribeToHashChanges(browserWindow, page => { activePage = page; });
  assert.equal(activePage, 'transactions');
  unsubscribe();

  // A new app mount after reload reads the same URL hash.
  subscribeToHashChanges(browserWindow, page => { activePage = page; });
  assert.equal(activePage, 'transactions');
});

test('invalid and missing hashes normalize to Dashboard', () => {
  for (const initialHash of ['', '#unknown', '#Transactions']) {
    const browserWindow = createHashWindow(initialHash);
    let activePage;
    subscribeToHashChanges(browserWindow, page => { activePage = page; });
    assert.equal(activePage, 'dashboard');
    assert.equal(browserWindow.location.hash, '#dashboard');
  }
});

test('navigation updates the hash and Back/Forward restore prior pages', () => {
  const browserWindow = createHashWindow('#dashboard');
  let activePage;
  subscribeToHashChanges(browserWindow, page => { activePage = page; });

  navigateToPage('transactions', browserWindow);
  navigateToPage('reports', browserWindow);
  navigateToPage('settings', browserWindow);
  assert.equal(browserWindow.location.hash, '#settings');
  assert.equal(activePage, 'settings');

  browserWindow.back();
  assert.equal(activePage, 'reports');
  browserWindow.back();
  assert.equal(activePage, 'transactions');
  browserWindow.forward();
  assert.equal(activePage, 'reports');
});
