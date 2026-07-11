import React from 'react';

export default function Visualizer({ step, isDelayEnabled, setIsDelayEnabled }) {
  
  const getStepClass = (index) => {
    if (step > index) return 'step completed';
    if (step === index) return 'step active';
    return 'step';
  };

  return (
    <div className="glass-panel" style={{height: '100%'}}>
      <h2 style={{background: 'linear-gradient(to right, #34d399, #38bdf8)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent'}}>
        Transaction Visualizer
      </h2>
      <p style={{color: 'var(--text-secondary)', marginBottom: '2rem'}}>
        Watch how our database handles your transfer atomically.
      </p>

      <div className={getStepClass(1)}>
        <span className="step-icon">🔒</span>
        <div>
          <h4>1. Acquire Lock</h4>
          <small>SELECT ... FOR UPDATE prevents race conditions.</small>
        </div>
      </div>

      <div className={getStepClass(2)}>
        <span className="step-icon">🔎</span>
        <div>
          <h4>2. Verify Funds</h4>
          <small>Ensures sender won't overdraw account.</small>
        </div>
      </div>

      <div className={getStepClass(3)}>
        <span className="step-icon">💸</span>
        <div>
          <h4>3. Deduct from Sender</h4>
          <small>UPDATE sender balance.</small>
        </div>
      </div>

      <div className={getStepClass(4)}>
        <span className="step-icon">📥</span>
        <div>
          <h4>4. Add to Receiver</h4>
          <small>UPDATE receiver balance.</small>
        </div>
      </div>

      <div className={getStepClass(5)}>
        <span className="step-icon">💾</span>
        <div>
          <h4>5. Commit Transaction</h4>
          <small>Changes are permanently written to disk.</small>
        </div>
      </div>

      <div className="toggle-container" style={{marginTop: '3rem', padding: '1rem', background: 'rgba(0,0,0,0.2)', borderRadius: '12px'}}>
        <input 
          type="checkbox" 
          id="delayToggle"
          checked={isDelayEnabled} 
          onChange={(e) => setIsDelayEnabled(e.target.checked)} 
        />
        <label htmlFor="delayToggle">
          <strong>Simulate Network Delay (3s)</strong>
          <br/>
          <small>Slows down the backend transaction so you can watch the Row-Level Lock hold the database state.</small>
        </label>
      </div>
    </div>
  );
}
