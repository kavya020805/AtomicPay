import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowDownLeft, ArrowUpRight } from 'lucide-react';

export default function TransactionHistory({ user, refreshTrigger }) {
  const [transactions, setTransactions] = useState([]);

  useEffect(() => {
    if (!user) return;
    const fetchTransactions = async () => {
      try {
        const res = await fetch(`http://localhost:3000/api/transactions/${user.id}`);
        const data = await res.json();
        setTransactions(data);
      } catch (err) {
        console.error('Failed to fetch transactions', err);
      }
    };
    fetchTransactions();
  }, [user, refreshTrigger]);

  const formatMoney = (cents) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(cents / 100);
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit'
    }).format(date);
  };

  return (
    <Card className="bg-neutral-950 border-neutral-800">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-neutral-300">Recent Transactions</CardTitle>
      </CardHeader>
      <CardContent>
        {transactions.length === 0 ? (
          <p className="text-sm text-neutral-500 py-4 text-center">No transactions yet.</p>
        ) : (
          <div className="space-y-4 max-h-[250px] overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-neutral-800">
            {transactions.map((tx) => {
              const isOutgoing = tx.sender === user.username;
              return (
                <div key={tx.id} className="flex items-center justify-between p-3 rounded-lg border border-neutral-800/50 bg-black/40">
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${isOutgoing ? 'bg-neutral-900 text-neutral-400' : 'bg-emerald-950/30 text-emerald-500'}`}>
                      {isOutgoing ? <ArrowUpRight size={16} /> : <ArrowDownLeft size={16} />}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-neutral-200">
                        {isOutgoing ? `To ${tx.receiver}` : `From ${tx.sender}`}
                      </p>
                      <p className="text-xs text-neutral-500">{formatDate(tx.timestamp)}</p>
                    </div>
                  </div>
                  <div className={`text-sm font-bold ${isOutgoing ? 'text-neutral-300' : 'text-emerald-400'}`}>
                    {isOutgoing ? '-' : '+'}{formatMoney(tx.amount_in_cents)}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
