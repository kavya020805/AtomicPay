import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function Dashboard({ user }) {
  const formatMoney = (cents) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(cents / 100);
  };

  return (
    <Card className="bg-neutral-950 border-neutral-800">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg text-neutral-400 font-medium">Available Balance</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="text-5xl font-bold tracking-tighter text-white">
          {formatMoney(user.balance_in_cents)}
        </div>
        <p className="text-xs text-neutral-500 mt-2">
          Welcome back, <span className="text-white font-medium">{user.username}</span>.
        </p>
      </CardContent>
    </Card>
  );
}
