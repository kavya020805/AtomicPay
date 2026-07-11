import { useState, useEffect } from 'react';
import Dashboard from './components/Dashboard';
import TransferForm from './components/TransferForm';
import Visualizer from './components/Visualizer';

function App() {
  const [users, setUsers] = useState([]);
  const [activeUser, setActiveUser] = useState(null);
  const [visualizerState, setVisualizerState] = useState(0); 
  const [isDelayEnabled, setIsDelayEnabled] = useState(false);
  const [transferTarget, setTransferTarget] = useState(null);

  const fetchUsers = async () => {
    try {
      const res = await fetch('http://localhost:3000/api/users');
      const data = await res.json();
      setUsers(data);
      if (!activeUser && data.length > 0) {
        setActiveUser(data[0]);
      } else if (activeUser) {
        setActiveUser(data.find(u => u.id === activeUser.id));
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleTransfer = async (receiverId, amount) => {
    const receiver = users.find(u => u.id === parseInt(receiverId));
    setTransferTarget(receiver);
    setVisualizerState(1); 
    
    if (isDelayEnabled) {
        setTimeout(() => setVisualizerState(2), 600);
        setTimeout(() => setVisualizerState(3), 1400);
        setTimeout(() => setVisualizerState(4), 2200);
        setTimeout(() => setVisualizerState(5), 3000);
    } else {
        setTimeout(() => setVisualizerState(2), 500);
    }

    try {
      const res = await fetch(`http://localhost:3000/api/transfer?delay=${isDelayEnabled}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          senderId: activeUser.id,
          receiverId: parseInt(receiverId),
          amount: parseInt(amount) * 100 
        })
      });

      const data = await res.json();
      
      if (!isDelayEnabled) {
        setVisualizerState(3);
        setTimeout(() => setVisualizerState(4), 600);
        setTimeout(() => setVisualizerState(5), 1200);
      }

      if (res.ok) {
        await fetchUsers();
      } else {
        alert('Transfer Failed: ' + data.error);
        setVisualizerState(0);
        setTransferTarget(null);
      }
    } catch (err) {
      alert('Error connecting to server');
      setVisualizerState(0);
      setTransferTarget(null);
    }
    
    setTimeout(() => {
      setVisualizerState(0);
      setTransferTarget(null);
    }, 4000);
  };

  return (
    <div className="dark min-h-screen bg-black text-white flex items-center justify-center p-8 font-sans">
      <div className="w-full max-w-5xl grid grid-cols-1 md:grid-cols-2 gap-8">
        
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
            isDelayEnabled={isDelayEnabled}
            setIsDelayEnabled={setIsDelayEnabled}
          />
        </div>
      </div>
    </div>
  );
}

export default App;
