import React from 'react';

export default function Dashboard({ user }) {
  const formatMoney = (cents) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(cents / 100);
  };

  return (
    <div className="glass-panel">
      <h3>Welcome, {user.username}</h3>
      <p style={{color: 'var(--text-secondary)'}}>Available Balance</p>
      <div className="balance-display">
        {formatMoney(user.balance_in_cents)}
      </div>
      <p style={{fontSize: '0.8rem', color: 'var(--text-secondary)'}}>
        Secured by PostgreSQL ACID Transactions
      </p>
    </div>
  );
}
