import { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import UserSearch from './UserSearch';
import { Send } from 'lucide-react';

export default function TransferForm({ onTransfer, isProcessing }) {
  const [selectedUser, setSelectedUser] = useState(null);
  const [amount, setAmount] = useState('');
  const [note, setNote] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!selectedUser || !amount) return;
    
    const idempotencyKey = crypto.randomUUID();
    onTransfer(selectedUser.id, amount, idempotencyKey, note);
    setAmount('');
    setNote('');
  };

  return (
    <Card className="bg-neutral-950 border-neutral-800 overflow-hidden relative">
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-emerald-500/30 to-transparent" />
      <CardHeader>
        <CardTitle className="text-xl text-white flex items-center gap-2">
          <Send size={18} className="text-emerald-400" />
          Send Money
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-5">
          
          {/* User Search */}
          <UserSearch onSelect={setSelectedUser} selectedUser={selectedUser} />

          {/* Amount */}
          <div className="space-y-1.5">
            <Label htmlFor="amount" className="text-neutral-400 text-sm">Amount (USD)</Label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500 text-sm font-medium">$</span>
              <Input 
                id="amount"
                type="number" 
                min="0.01" 
                step="0.01"
                placeholder="0.00" 
                value={amount} 
                onChange={(e) => setAmount(e.target.value)}
                className="bg-black border-neutral-800 text-white pl-7 text-lg font-semibold"
                required
              />
            </div>
          </div>

          {/* Note */}
          <div className="space-y-1.5">
            <Label htmlFor="note" className="text-neutral-400 text-sm">Note (optional)</Label>
            <Input 
              id="note"
              type="text"
              placeholder="What's this for?"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              className="bg-black border-neutral-800 text-white text-sm"
            />
          </div>

          {/* Submit */}
          <Button 
            type="submit" 
            disabled={isProcessing || !selectedUser || !amount} 
            className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-5 transition-all duration-200 disabled:opacity-40"
          >
            {isProcessing ? (
              <span className="flex items-center gap-2">
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Processing...
              </span>
            ) : (
              <span className="flex items-center gap-2">
                <Send size={16} />
                Send Payment
              </span>
            )}
          </Button>

        </form>
      </CardContent>
    </Card>
  );
}
