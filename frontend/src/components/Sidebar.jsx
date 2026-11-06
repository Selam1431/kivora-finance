import { useState } from 'react';
import { profileDisplayName, profileInitials } from '../settingsData';

function Sidebar({ activePage, setActivePage, transactionCount = 0, profile }) {
    const [workspaceOpen, setWorkspaceOpen] = useState(false);
    return (
        <aside className="sidebar">
            <button className="workspace-picker" type="button" aria-expanded={workspaceOpen} onClick={() => setWorkspaceOpen(value => !value)}>
                <span className="workspace-mark">KF</span>
                <span className="workspace-name"><small>Personal finance</small><strong>My workspace</strong></span>
                <span className="workspace-chevron">⌄</span>
            </button>
            {workspaceOpen && <div className="workspace-menu"><strong>My workspace</strong><small>Personal finance account</small><button type="button" onClick={() => setWorkspaceOpen(false)}>✓&nbsp; Active workspace</button></div>}

            <p className="nav-caption">WORKSPACE</p>

            <nav className="sidebar-nav" aria-label="Main navigation">

                <a
                    href="#dashboard"
                    className={`nav-link ${activePage === "dashboard" ? "active" : ""}`}
                    onClick={(event) => {
                        event.preventDefault();
                        setActivePage("dashboard");
                    }}
                >
                    <span className="nav-symbol">▦</span>
                    Dashboard
                </a>



                <a
                    href="#transactions"
                    className={`nav-link ${activePage === "transactions" ? "active" : ""}`}
                    onClick={(event) => {
                        event.preventDefault();
                        setActivePage("transactions");
                    }}
                >
                    <span className="nav-symbol">▤</span>
                    Transactions
                    <span className="nav-count">{transactionCount}</span>
                </a>



                <a
                    href="#reports"
                    className={`nav-link ${activePage === "reports" ? "active" : ""}`}
                    onClick={(event) => {
                        event.preventDefault();
                        setActivePage("reports");
                    }}
                >
                    <span className="nav-symbol">▥</span>
                    Reports
                </a>



                <a
                    href="#settings"
                    className={`nav-link ${activePage === "settings" ? "active" : ""}`}
                    onClick={(event) => {
                        event.preventDefault();
                        setActivePage("settings");
                    }}
                >
                    <span className="nav-symbol">⚙</span>
                    Settings
                </a>

            </nav>

            <div className="sidebar-bottom">
                <div className="sidebar-promo"><span className="promo-icon">✧</span><strong>Unlock your insights</strong><p>Get smarter with premium financial tools.</p><button type="button" onClick={() => setActivePage("reports")}>Explore reports&nbsp; ↗</button></div>
                <button className="sidebar-profile" type="button" onClick={() => setActivePage("settings")}><span className="profile-initials">{profileInitials(profile)}</span><span><strong>{profileDisplayName(profile)}</strong><small>Profile</small></span><span className="profile-chevron">⌄</span></button>
            </div>
        </aside>
    );
}

export default Sidebar;
