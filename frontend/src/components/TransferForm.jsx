import { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

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
    <Card className="bg-neutral-950 border-neutral-800">
      <CardHeader>
        <CardTitle className="text-xl">Send Money</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          
          <div className="space-y-2">
            <Label htmlFor="recipient">Recipient</Label>
            <Select onValueChange={setReceiverId} value={receiverId} required>
              <SelectTrigger id="recipient" className="w-full bg-black border-neutral-800">
                <SelectValue placeholder="Select user..." />
              </SelectTrigger>
              <SelectContent className="bg-neutral-950 border-neutral-800 text-white">
                {users.map(u => (
                  <SelectItem key={u.id} value={u.id.toString()}>{u.username}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="amount">Amount (USD)</Label>
            <Input 
              id="amount"
              type="number" 
              min="1" 
              step="1"
              placeholder="500" 
              value={amount} 
              onChange={(e) => setAmount(e.target.value)}
              className="bg-black border-neutral-800"
              required
            />
          </div>

          <Button type="submit" disabled={isProcessing} className="w-full bg-white text-black hover:bg-neutral-200">
            {isProcessing ? 'Processing Transaction...' : 'Confirm Transfer'}
          </Button>

        </form>
      </CardContent>
    </Card>
  );
}
