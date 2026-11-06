
function SummaryCard({ title, amount, description, type, change }) {
    const icon = type === 'balance' ? '▱' : type === 'income' ? '↙' : '↗';
    return (
        <article className={`summary-card ${type}`}>
            <div className="summary-card-top">
                <span className="summary-icon">{icon}</span>
                <span className={`summary-change ${change?.direction || 'neutral'}`}>{change?.direction === 'up' ? '↗ ' : change?.direction === 'down' ? '↘ ' : ''}{change?.label || 'Not enough data'}</span>
            </div>
            <p className="summary-card-title">{title}</p>

            <h2 className="summary-card-amount">
                {amount}
            </h2>

            <p className="summary-card-description">{description}</p>
        </article>
    );
}

export default SummaryCard;
