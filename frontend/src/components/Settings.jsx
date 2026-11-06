import { useState } from 'react';
import { ACCOUNT_TYPES, CURRENCIES, DATE_FORMATS, addAccount, profileInitials, readAccounts, saveAccounts, setAccountArchived, updateAccount } from '../settingsData';

function Settings({ profile, preferences, onProfileSave, onPreferenceChange }) {
  const [draftProfile, setDraftProfile] = useState(profile);
  const [editing, setEditing] = useState(false);
  const [profileError, setProfileError] = useState('');
  const [accounts, setAccounts] = useState(() => readAccounts(localStorage));
  const [accountModal, setAccountModal] = useState(null);
  const [accountError, setAccountError] = useState('');
  const [accountNotice, setAccountNotice] = useState('');

  const saveProfile = () => {
    const next = {
      firstName: draftProfile.firstName.trim(),
      lastName: draftProfile.lastName.trim(),
      email: draftProfile.email.trim(),
    };
    if (!next.firstName || !next.lastName) {
      setProfileError('Enter both your first and last name.');
      return;
    }
    if (next.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(next.email)) {
      setProfileError('Enter a valid email address or leave the field empty.');
      return;
    }
    setProfileError('');
    setDraftProfile(next);
    onProfileSave(next);
    setEditing(false);
  };

  const persistAccounts = next => {
    try {
      saveAccounts(localStorage, next);
      setAccounts(next);
      setAccountError('');
      return true;
    } catch {
      setAccountError('Could not save accounts on this device. Check browser storage and try again.');
      return false;
    }
  };

  const saveAccount = () => {
    try {
      const next = accountModal.id
        ? updateAccount(accounts, accountModal.id, accountModal.name, accountModal.type)
        : addAccount(accounts, accountModal.name, accountModal.type);
      if (persistAccounts(next)) {
        setAccountNotice(accountModal.id ? 'Account details updated.' : 'Account added.');
        setAccountModal(null);
      }
    } catch (error) {
      setAccountError(error.message || 'Could not save this account.');
    }
  };

  const toggleArchive = account => {
    const next = setAccountArchived(accounts, account.id, !account.archived);
    if (persistAccounts(next)) setAccountNotice(account.archived ? `${account.name} restored.` : `${account.name} archived.`);
  };

  const activeAccounts = accounts.filter(account => !account.archived);
  const archivedAccounts = accounts.filter(account => account.archived);

  return (
    <div className="settings-layout">
      <nav className="settings-nav" aria-label="Settings sections">
        <a className="active" href="#profile">Profile</a><a href="#preferences">Preferences</a><a href="#account-management">Account management</a>
      </nav>
      <div className="settings-content">
        <section className="settings-card profile-settings" id="profile">
          <div className="settings-card-heading"><div className="profile-avatar">{profileInitials(profile)}</div><div><h2>Personal profile</h2><p>Your saved profile details.</p></div>{editing ? <button type="button" className="settings-edit" onClick={saveProfile}>Save changes</button> : <button type="button" className="settings-edit" onClick={() => { setDraftProfile(profile); setProfileError(''); setEditing(true); }}>Edit profile</button>}</div>
          <div className="profile-field-grid">
            <label>First name<input autoComplete="given-name" value={draftProfile.firstName} readOnly={!editing} onChange={event => setDraftProfile({ ...draftProfile, firstName: event.target.value })} /></label>
            <label>Last name<input autoComplete="family-name" value={draftProfile.lastName} readOnly={!editing} onChange={event => setDraftProfile({ ...draftProfile, lastName: event.target.value })} /></label>
            <label className="span-two">Email address<input type="email" autoComplete="email" value={draftProfile.email} readOnly={!editing} onChange={event => setDraftProfile({ ...draftProfile, email: event.target.value })} /></label>
          </div>
          <p className="settings-note">Email is saved as a profile detail only. Email verification and sign-in are not provided here.</p>
          {profileError && <p className="settings-error" role="alert">{profileError}</p>}
          {editing && <button type="button" className="form-cancel profile-cancel" onClick={() => { setDraftProfile(profile); setProfileError(''); setEditing(false); }}>Cancel</button>}
        </section>

        <section className="settings-card" id="preferences">
          <div className="settings-card-heading"><span className="settings-symbol">▱</span><div><h2>Account preferences</h2><p>Shape how Kivora works for you.</p></div></div>
          <div className="preference-row"><div><strong>Currency preference</strong><p>Changes display formatting only; no currency conversion is performed.</p></div><select aria-label="Currency preference" value={preferences.currency} onChange={event => onPreferenceChange('currency', event.target.value)}>{CURRENCIES.map(code => <option value={code} key={code}>{code} — {new Intl.DisplayNames(undefined, { type: 'currency' }).of(code)}</option>)}</select></div>
          <div className="preference-row"><div><strong>Date format</strong><p>Used for transaction dates in your ledger.</p></div><select aria-label="Date format" value={preferences.dateFormat} onChange={event => onPreferenceChange('dateFormat', event.target.value)}>{DATE_FORMATS.map(format => <option value={format} key={format}>{format}</option>)}</select></div>
          <div className="preference-row"><div><strong>Weekly insights preference</strong><p>Saved on this device only. No scheduled recap, email, or notification is sent.</p></div><button type="button" role="switch" aria-label="Weekly insights preference" aria-checked={preferences.weeklyInsights} className={`toggle-switch ${preferences.weeklyInsights ? 'on' : ''}`} onClick={() => onPreferenceChange('weeklyInsights', !preferences.weeklyInsights)}><i /></button></div>
        </section>

        <section className="settings-card" id="account-management">
          <div className="settings-card-heading"><span className="settings-symbol">▣</span><div><h2>Account management</h2><p>Organization only. Transactions are not associated with these accounts.</p></div><button type="button" className="settings-edit" onClick={() => { setAccountModal({ id: null, name: '', type: 'Checking' }); setAccountError(''); }}>＋ Add account</button></div>
          {accountNotice && <p className="settings-notice" role="status">{accountNotice}</p>}
          {accountError && !accountModal && <p className="settings-error" role="alert">{accountError}</p>}
          {!accounts.length && <div className="accounts-empty"><strong>No accounts added yet</strong><p>Add Checking, Savings, Cash, or Other accounts to organize your workspace.</p></div>}
          {activeAccounts.map(account => <div className="account-row" key={account.id}><span className="settings-symbol">▱</span><div><strong>{account.name}</strong><p>{account.type} · Organization only</p></div><div className="account-actions"><button type="button" className="settings-edit" onClick={() => { setAccountModal({ id: account.id, name: account.name, type: account.type }); setAccountError(''); }}>Rename</button><button type="button" className="settings-edit archive-account" onClick={() => toggleArchive(account)}>Archive</button></div></div>)}
          {archivedAccounts.length > 0 && <div className="archived-accounts"><h3>Archived accounts</h3>{archivedAccounts.map(account => <div className="account-row archived" key={account.id}><span className="settings-symbol">▱</span><div><strong>{account.name}</strong><p>{account.type} · Archived, transactions retained</p></div><div className="account-actions"><button type="button" className="settings-edit" onClick={() => { setAccountModal({ id: account.id, name: account.name, type: account.type }); setAccountError(''); }}>Rename</button><button type="button" className="settings-edit" onClick={() => toggleArchive(account)}>Restore</button></div></div>)}</div>}
        </section>
      </div>

      {accountModal && <div className="transaction-modal-backdrop" onMouseDown={event => event.target === event.currentTarget && setAccountModal(null)}><section className="account-dialog" role="dialog" aria-modal="true" aria-labelledby="account-dialog-title"><button type="button" className="form-close" aria-label="Close account form" onClick={() => setAccountModal(null)}>×</button><p className="section-label">ACCOUNT ORGANIZATION</p><h2 id="account-dialog-title">{accountModal.id ? 'Edit account' : 'Add an account'}</h2><p>Accounts are organizational labels and are not linked to transaction history.</p><label>Account name<input autoFocus value={accountModal.name} onChange={event => setAccountModal({ ...accountModal, name: event.target.value })} placeholder="e.g. Everyday checking" /></label><label>Account type<select value={accountModal.type} onChange={event => setAccountModal({ ...accountModal, type: event.target.value })}>{ACCOUNT_TYPES.map(type => <option value={type} key={type}>{type}</option>)}</select></label>{accountError && <p className="settings-error" role="alert">{accountError}</p>}<div><button type="button" className="form-cancel" onClick={() => setAccountModal(null)}>Cancel</button><button type="button" className="add-transaction-button" disabled={!accountModal.name.trim()} onClick={saveAccount}>{accountModal.id ? 'Save account' : 'Add account'}</button></div></section></div>}
    </div>
  );
}

export default Settings;
