import { useState, useEffect, useRef, useCallback } from 'react';
import Dashboard from './components/Dashboard';
import TransferForm from './components/TransferForm';
import Visualizer from './components/Visualizer';
import TransactionHistory from './components/TransactionHistory';
import Aurora from './components/react-bits/Aurora';

function App() {
  const [users, setUsers] = useState([]);
  const [activeUser, setActiveUser] = useState(null);
  const [visualizerState, setVisualizerState] = useState(0); 
  const [transferTarget, setTransferTarget] = useState(null);
  const [transferAmount, setTransferAmount] = useState(null);
  const [isPaused, setIsPaused] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  // Store timeout IDs so we can cancel them on pause
  const timersRef = useRef([]);
  // Store remaining steps so we can resume from where we paused
  const remainingStepsRef = useRef([]);

  const clearAllTimers = () => {
    timersRef.current.forEach(id => clearTimeout(id));
    timersRef.current = [];
  };

  const scheduleSteps = useCallback((steps) => {
    clearAllTimers();
    remainingStepsRef.current = [];
    const now = Date.now();

    steps.forEach(({ step, delayMs }) => {
      const id = setTimeout(() => {
        setVisualizerState(step);
        if (step === 0) {
          setTransferTarget(null);
          setIsPaused(false);
        }
        // Remove this step from remaining
        remainingStepsRef.current = remainingStepsRef.current.filter(s => s.step !== step);
      }, delayMs);
      timersRef.current.push(id);
      remainingStepsRef.current.push({ step, fireAt: now + delayMs });
    });
  }, []);

  const handlePause = useCallback(() => {
    clearAllTimers();
    // Recalculate remaining delays relative to now
    const now = Date.now();
    remainingStepsRef.current = remainingStepsRef.current.map(s => ({
      ...s,
      delayMs: Math.max(0, s.fireAt - now),
    }));
    setIsPaused(true);
  }, []);

  const handleResume = useCallback(() => {
    setIsPaused(false);
    const now = Date.now();
    const remaining = remainingStepsRef.current;

    clearAllTimers();
    remaining.forEach(({ step, delayMs }) => {
      const id = setTimeout(() => {
        setVisualizerState(step);
        if (step === 0) {
          setTransferTarget(null);
          setIsPaused(false);
        }
        remainingStepsRef.current = remainingStepsRef.current.filter(s => s.step !== step);
      }, delayMs);
      timersRef.current.push(id);
      // Update fireAt for potential re-pause
      remainingStepsRef.current = remainingStepsRef.current.map(s =>
        s.step === step ? { ...s, fireAt: now + delayMs } : s
      );
    });
  }, []);

  const fetchUsers = async () => {
    try {
      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';
      const res = await fetch(`${API_URL}/api/users`);
      const data = await res.json();
      setUsers(data);
      if (!activeUser && data.length > 0) {
        setActiveUser(data[0]);
      } else if (activeUser) {
        setActiveUser(data.find(u => u.id === activeUser.id));
      }
      setRefreshTrigger(prev => prev + 1);
    } catch (err) {
      console.error('Failed to fetch users', err);
    }
  };

  useEffect(() => {
    fetchUsers();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleTransfer = async (receiverId, amount, idempotencyKey) => {
    const receiver = users.find(u => u.id === parseInt(receiverId));
    setTransferTarget(receiver);
    setTransferAmount(amount);
    setIsPaused(false);
    setVisualizerState(1); 
    
    // Schedule only the initial travel to the Database (doubled duration)
    scheduleSteps([
      { step: 2, delayMs: 1200 }
    ]);

    try {
      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';
      const res = await fetch(`${API_URL}/api/transfer?delay=true`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Idempotency-Key': idempotencyKey
        },
        body: JSON.stringify({
          senderId: activeUser.id,
          receiverId: parseInt(receiverId),
          amount: parseInt(amount) * 100 
        })
      });

      const data = await res.json();

      if (res.ok) {
        // Both normal and retry will play the exact same visual sequence (steps 3 & 4)
        // But the final state (5 vs 6) will differ based on idempotency
        setVisualizerState(3);
        scheduleSteps([
          { step: 4, delayMs: 1200 },
          { step: data.isIdempotent ? 6 : 5, delayMs: 2400 },
          { step: 0, delayMs: 7000 },
        ]);
        
        await fetchUsers();
      } else {
        alert('Transfer Failed: ' + data.error);
        clearAllTimers();
        setVisualizerState(0);
        setTransferTarget(null);
        setTransferAmount(null);
        setIsPaused(false);
      }
    } catch (err) {
      console.error(err);
      alert('Error connecting to server');
      clearAllTimers();
      setVisualizerState(0);
      setTransferTarget(null);
      setTransferAmount(null);
      setIsPaused(false);
    }
  };

  return (
    <div className="min-h-screen bg-black text-white p-8 font-sans selection:bg-emerald-500/30 relative">
      {/* ── Aurora Background (React Bits) ── */}
      <div className="fixed inset-0 z-0 pointer-events-none opacity-20">
        <Aurora 
          colorStops={["#000000", "#10b981", "#022c22"]} 
          amplitude={1.2} 
          blend={0.5} 
          speed={0.5} 
        />
      </div>

      <div className="max-w-6xl mx-auto relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          
          {/* Left Column */}
        <div className="space-y-6">
          <h1 className="text-4xl font-extrabold tracking-tight">AtomicPay</h1>
          
          <div className="space-y-2">
            <label className="text-sm font-medium text-neutral-400">View As User</label>
            <select 
              className="w-full bg-neutral-900 border border-neutral-800 text-white rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-neutral-700"
              value={activeUser?.id || ''} 
              onChange={(e) => setActiveUser(users.find(u => u.id === parseInt(e.target.value)))}
            >
              {users.map(u => (
                <option key={u.id} value={u.id}>{u.username}</option>
              ))}
            </select>
          </div>

          {activeUser && (
            <Dashboard user={activeUser} />
          )}

          <TransferForm 
            users={users.filter(u => u.id !== activeUser?.id)} 
            onTransfer={handleTransfer}
            isProcessing={visualizerState > 0 && visualizerState < 5}
          />
        </div>

        {/* Right Column */}
        <div className="h-full">
          <Visualizer 
            step={visualizerState} 
            senderName={activeUser?.username || 'Sender'}
            receiverName={transferTarget?.username || 'Receiver'}
            senderId={activeUser?.id}
            receiverId={transferTarget?.id}
            amount={transferAmount}
            isPaused={isPaused}
            onPause={handlePause}
            onResume={handleResume}
          />
          </div>
        </div>

        {/* Bottom Full-Width Row */}
        {activeUser && (
          <TransactionHistory user={activeUser} refreshTrigger={refreshTrigger} />
        )}
      </div>
    </div>
  );
}

export default App;
