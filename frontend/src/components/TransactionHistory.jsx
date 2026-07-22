import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowDownLeft, ArrowUpRight, History } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import PaymentStatusBadge from './PaymentStatusBadge';

export default function TransactionHistory({ refreshTrigger }) {
  const { user, authFetch } = useAuth();
  const [transactions, setTransactions] = useState([]);
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState(null);

  useEffect(() => {
    if (!user) return;

    const fetchTransactions = async () => {
      try {
        const res = await authFetch(`/api/transactions?page=${page}&limit=10`);
        if (res.ok) {
          const data = await res.json();
          setTransactions(data.transactions);
          setPagination(data.pagination);
        }
      } catch (err) {
        console.error('Failed to fetch transactions', err);
      }
    };
    fetchTransactions();
  }, [user, page, refreshTrigger, authFetch]);

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
    <Card className="bg-neutral-950 border-neutral-800 overflow-hidden relative">
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-neutral-700/50 to-transparent" />
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-neutral-300 flex items-center gap-2">
          <History size={14} className="text-neutral-500" />
          Recent Transactions
          {pagination && (
            <span className="text-[10px] text-neutral-600 font-normal ml-auto">
              {pagination.total} total
            </span>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {transactions.length === 0 ? (
          <div className="py-8 text-center">
            <History size={24} className="text-neutral-700 mx-auto mb-2" />
            <p className="text-sm text-neutral-500">No transactions yet.</p>
            <p className="text-xs text-neutral-600 mt-1">Send money to see your history here.</p>
          </div>
        ) : (
          <>
            <div className="space-y-2 max-h-[350px] overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-neutral-800">
              {transactions.map((tx) => {
                const isOutgoing = tx.sender_id === user.id;
                return (
                  <div key={tx.id} className="flex items-center justify-between p-3 rounded-lg border border-neutral-800/50 bg-black/40 hover:bg-neutral-900/50 transition-colors group">
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${isOutgoing ? 'bg-neutral-900 text-neutral-400' : 'bg-emerald-950/30 text-emerald-500'}`}>
                        {isOutgoing ? <ArrowUpRight size={16} /> : <ArrowDownLeft size={16} />}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-neutral-200">
                          {isOutgoing ? `To ${tx.receiver_username}` : `From ${tx.sender_username}`}
                        </p>
                        <div className="flex items-center gap-2 mt-0.5">
                          <PaymentStatusBadge status={tx.status} />
                          {tx.note && (
                            <span className="text-[10px] text-neutral-600 truncate max-w-[120px]">
                              "{tx.note}"
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className={`text-sm font-bold ${isOutgoing ? 'text-neutral-300' : 'text-emerald-400'}`}>
                        {isOutgoing ? '-' : '+'}{formatMoney(tx.amount_in_cents)}
                      </p>
                      <p className="text-[10px] text-neutral-500 mt-0.5">{formatDate(tx.created_at)}</p>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Pagination */}
            {pagination && pagination.totalPages > 1 && (
              <div className="flex items-center justify-between mt-4 pt-3 border-t border-neutral-800/50">
                <button
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page <= 1}
                  className="text-xs text-neutral-500 hover:text-white disabled:opacity-30 disabled:hover:text-neutral-500 transition-colors"
                >
                  ← Previous
                </button>
                <span className="text-[10px] text-neutral-600">
                  Page {page} of {pagination.totalPages}
                </span>
                <button
                  onClick={() => setPage(p => Math.min(pagination.totalPages, p + 1))}
                  disabled={page >= pagination.totalPages}
                  className="text-xs text-neutral-500 hover:text-white disabled:opacity-30 disabled:hover:text-neutral-500 transition-colors"
                >
                  Next →
                </button>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}
