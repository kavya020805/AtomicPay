import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TrendingUp, Wallet } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function Dashboard() {
  const { user } = useAuth();

  const formatMoney = (cents) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format((cents || 0) / 100);
  };

  if (!user) return null;

  return (
    <Card className="bg-neutral-950 border-neutral-800 overflow-hidden relative">
      {/* Subtle gradient accent */}
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-emerald-500/50 to-transparent" />
      
      <CardHeader className="pb-2">
        <CardTitle className="text-sm text-neutral-400 font-medium flex items-center gap-2">
          <Wallet size={14} className="text-emerald-500" />
          Available Balance
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="text-5xl font-bold tracking-tighter text-white">
          {formatMoney(user.balance_in_cents)}
        </div>
        <div className="flex items-center gap-3 mt-3">
          <p className="text-xs text-neutral-500">
            Welcome back, <span className="text-white font-medium">{user.username}</span>
          </p>
          <span className="text-neutral-700">•</span>
          <p className="text-xs text-neutral-500">{user.email}</p>
        </div>
      </CardContent>
    </Card>
  );
}
