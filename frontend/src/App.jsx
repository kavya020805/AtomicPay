import { useState, useEffect } from 'react';
import Dashboard from './components/Dashboard';
import TransferForm from './components/TransferForm';
import Visualizer from './components/Visualizer';

function App() {
  const [users, setUsers] = useState([]);
  const [activeUser, setActiveUser] = useState(null);
  const [visualizerState, setVisualizerState] = useState(0); // 0-5 steps
  const [isDelayEnabled, setIsDelayEnabled] = useState(false);

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
    setVisualizerState(1); // Acquiring Lock...
    
    // If delay is enabled, we animate the frontend states manually to match the backend delay
    if (isDelayEnabled) {
        setTimeout(() => setVisualizerState(2), 800);
        setTimeout(() => setVisualizerState(3), 1600);
        setTimeout(() => setVisualizerState(4), 2200);
        setTimeout(() => setVisualizerState(5), 2800);
    } else {
        setVisualizerState(2);
    }

    try {
      const res = await fetch(`http://localhost:3000/api/transfer?delay=${isDelayEnabled}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          senderId: activeUser.id,
          receiverId: parseInt(receiverId),
          amount: parseInt(amount) * 100 // Convert to cents
        })
      });

      const data = await res.json();
      
      if (!isDelayEnabled) setVisualizerState(5); // Instant finish

      if (res.ok) {
        await fetchUsers();
      } else {
        alert('Transfer Failed: ' + data.error);
        setVisualizerState(0);
      }
    } catch (err) {
      alert('Error connecting to server');
      setVisualizerState(0);
    }
    
    // Reset visualizer
    setTimeout(() => {
      setVisualizerState(0);
    }, 4000);
  };

  return (
    <div className="app-container">
      <div className="left-column">
        <h1>AtomicPay ⚛️</h1>
        
        <div className="glass-panel" style={{marginBottom: '2rem'}}>
          <label>View As User:</label>
          <select 
            className="user-selector"
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

        <div className="glass-panel" style={{marginTop: '2rem'}}>
          <TransferForm 
            users={users.filter(u => u.id !== activeUser?.id)} 
            onTransfer={handleTransfer}
            isProcessing={visualizerState > 0 && visualizerState < 5}
          />
        </div>
      </div>

      <div className="right-column">
        <Visualizer 
          step={visualizerState} 
          isDelayEnabled={isDelayEnabled}
          setIsDelayEnabled={setIsDelayEnabled}
        />
      </div>
    </div>
  );
}

export default App;
