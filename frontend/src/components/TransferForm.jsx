import { useState } from 'react';

export default function TransferForm({ users, onTransfer, isProcessing }) {
  const [receiverId, setReceiverId] = useState('');
  const [amount, setAmount] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!receiverId || !amount) return;
    onTransfer(receiverId, amount);
    setAmount('');
  };

  return (
    <form onSubmit={handleSubmit}>
      <h3>Send Money</h3>
      
      <div style={{marginTop: '1rem'}}>
        <label>Recipient:</label>
        <select 
          value={receiverId} 
          onChange={(e) => setReceiverId(e.target.value)}
          required
        >
          <option value="" disabled>Select User...</option>
          {users.map(u => (
            <option key={u.id} value={u.id}>{u.username}</option>
          ))}
        </select>
      </div>

      <div style={{marginTop: '1rem'}}>
        <label>Amount (USD):</label>
        <input 
          type="number" 
          min="1" 
          step="1"
          placeholder="500" 
          value={amount} 
          onChange={(e) => setAmount(e.target.value)}
          required
        />
      </div>

      <button type="submit" disabled={isProcessing}>
        {isProcessing ? 'Processing Transaction...' : 'Confirm Transfer'}
      </button>
    </form>
  );
}
