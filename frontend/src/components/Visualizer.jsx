import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';

export default function Visualizer({ step, isDelayEnabled, setIsDelayEnabled }) {
  
  const getStepClass = (index) => {
    const baseClass = "flex items-center p-4 mb-3 rounded-lg border transition-all duration-300 ";
    if (step > index) return baseClass + "bg-neutral-900 border-neutral-700 opacity-100";
    if (step === index) return baseClass + "bg-neutral-800 border-white opacity-100 transform translate-x-2";
    return baseClass + "bg-black border-neutral-900 opacity-40";
  };

  const getIconColor = (index) => {
    if (step > index) return "text-neutral-400";
    if (step === index) return "text-white";
    return "text-neutral-600";
  };

  return (
    <Card className="h-full bg-black border-neutral-800 flex flex-col">
      <CardHeader>
        <CardTitle>Transaction Engine</CardTitle>
        <CardDescription className="text-neutral-500">
          Real-time visualization of PostgreSQL Row-Level Locking.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex-1 flex flex-col justify-between">
        
        <div className="mt-4">
          <div className={getStepClass(1)}>
            <div className={`mr-4 font-mono text-xl ${getIconColor(1)}`}>01</div>
            <div>
              <h4 className="font-medium text-sm">Acquire Lock</h4>
              <p className="text-xs text-neutral-500 mt-1 font-mono">SELECT ... FOR UPDATE</p>
            </div>
          </div>

          <div className={getStepClass(2)}>
            <div className={`mr-4 font-mono text-xl ${getIconColor(2)}`}>02</div>
            <div>
              <h4 className="font-medium text-sm">Verify Funds</h4>
              <p className="text-xs text-neutral-500 mt-1 font-mono">sender_balance >= amount</p>
            </div>
          </div>

          <div className={getStepClass(3)}>
            <div className={`mr-4 font-mono text-xl ${getIconColor(3)}`}>03</div>
            <div>
              <h4 className="font-medium text-sm">Deduct from Sender</h4>
              <p className="text-xs text-neutral-500 mt-1 font-mono">UPDATE users SET balance ...</p>
            </div>
          </div>

          <div className={getStepClass(4)}>
            <div className={`mr-4 font-mono text-xl ${getIconColor(4)}`}>04</div>
            <div>
              <h4 className="font-medium text-sm">Add to Receiver</h4>
              <p className="text-xs text-neutral-500 mt-1 font-mono">UPDATE users SET balance ...</p>
            </div>
          </div>

          <div className={getStepClass(5)}>
            <div className={`mr-4 font-mono text-xl ${getIconColor(5)}`}>05</div>
            <div>
              <h4 className="font-medium text-sm">Commit Transaction</h4>
              <p className="text-xs text-neutral-500 mt-1 font-mono">COMMIT</p>
            </div>
          </div>
        </div>

        <div className="mt-8 p-4 rounded-lg bg-neutral-950 border border-neutral-800 flex items-start gap-3">
          <input 
            type="checkbox" 
            id="delayToggle"
            className="mt-1 w-4 h-4 accent-white bg-neutral-900 border-neutral-700 rounded"
            checked={isDelayEnabled} 
            onChange={(e) => setIsDelayEnabled(e.target.checked)} 
          />
          <div>
            <label htmlFor="delayToggle" className="font-medium text-sm cursor-pointer text-neutral-200">
              Simulate Network Delay (3s)
            </label>
            <p className="text-xs text-neutral-500 mt-1 leading-relaxed">
              Enable this to artificially pause the transaction midway. This proves that our row-level locks hold the database state, preventing any concurrent race conditions.
            </p>
          </div>
        </div>

      </CardContent>
    </Card>
  );
}
