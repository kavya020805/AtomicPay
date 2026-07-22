import { useState, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import Navbar from '../components/Navbar';
import Dashboard from '../components/Dashboard';
import TransferForm from '../components/TransferForm';
import Visualizer from '../components/Visualizer';
import TransactionHistory from '../components/TransactionHistory';
import KafkaEventLog from '../components/KafkaEventLog';
import Aurora from '../components/react-bits/Aurora';
import toast from 'react-hot-toast';

export default function DashboardPage() {
  const { user, refreshUser, authFetch } = useAuth();
  const [visualizerState, setVisualizerState] = useState(0);
  const [transferTarget, setTransferTarget] = useState(null);
  const [transferAmount, setTransferAmount] = useState(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [lastTransactionId, setLastTransactionId] = useState(null);

  const handleTransfer = useCallback(async (receiverId, amount, idempotencyKey, note) => {
    // Find receiver info
    try {
      const userRes = await authFetch(`/api/users/${receiverId}`);
      if (userRes.ok) {
        const receiverData = await userRes.json();
        setTransferTarget(receiverData);
      }
    } catch (err) {
      // Continue even if we can't fetch receiver info
    }

    setTransferAmount(amount);
    setVisualizerState(1);

    // Animate to step 2 after delay
    setTimeout(() => setVisualizerState(2), 1200);

    try {
      const res = await authFetch('/api/transfer', {
        method: 'POST',
        headers: {
          'Idempotency-Key': idempotencyKey,
        },
        body: JSON.stringify({
          receiverId,
          amount: parseFloat(amount),
          note,
        }),
      });

      const data = await res.json();

      if (res.ok) {
        setLastTransactionId(data.transaction?.id || null);
        setVisualizerState(3);

        setTimeout(() => setVisualizerState(4), 1200);
        setTimeout(() => {
          setVisualizerState(data.isIdempotent ? 6 : 5);
        }, 2400);
        setTimeout(() => {
          setVisualizerState(0);
          setTransferTarget(null);
          setTransferAmount(null);
        }, 7000);

        // Refresh user balance and transaction list
        await refreshUser();
        setRefreshTrigger(prev => prev + 1);

        toast.success(
          data.isIdempotent
            ? 'Transfer confirmed (idempotency hit)'
            : `$${parseFloat(amount).toFixed(2)} sent successfully!`
        );
      } else {
        toast.error(data.error || 'Transfer failed');
        setVisualizerState(0);
        setTransferTarget(null);
        setTransferAmount(null);
      }
    } catch (err) {
      console.error(err);
      toast.error('Error connecting to server');
      setVisualizerState(0);
      setTransferTarget(null);
      setTransferAmount(null);
    }
  }, [authFetch, refreshUser]);

  return (
    <div className="min-h-screen bg-black text-white font-sans selection:bg-emerald-500/30 relative">
      {/* Aurora Background */}
      <div className="fixed inset-0 z-0 pointer-events-none opacity-15">
        <Aurora 
          colorStops={["#000000", "#10b981", "#022c22"]} 
          amplitude={1.2} 
          blend={0.5} 
          speed={0.5} 
        />
      </div>

      {/* Navbar */}
      <Navbar />

      {/* Content */}
      <div className="max-w-6xl mx-auto px-6 py-8 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          
          {/* Left Column */}
          <div className="space-y-6">
            <Dashboard />
            <TransferForm 
              onTransfer={handleTransfer}
              isProcessing={visualizerState > 0 && visualizerState < 5}
            />
            
            {/* Kafka Event Log */}
            {lastTransactionId && (
              <KafkaEventLog transactionId={lastTransactionId} />
            )}
          </div>

          {/* Right Column */}
          <div className="h-full">
            <Visualizer 
              step={visualizerState} 
              senderName={user?.username || 'Sender'}
              receiverName={transferTarget?.username || 'Receiver'}
              senderId={user?.id}
              receiverId={transferTarget?.id}
              amount={transferAmount}
              isPaused={false}
              onPause={() => {}}
              onResume={() => {}}
            />
          </div>
        </div>

        {/* Bottom Full-Width: Transaction History */}
        <div className="mt-8">
          <TransactionHistory refreshTrigger={refreshTrigger} />
        </div>
      </div>
    </div>
  );
}
