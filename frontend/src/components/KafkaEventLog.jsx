import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { CheckCircle, Clock, AlertTriangle, Loader, Mail, BookOpen, Shield, BarChart3 } from 'lucide-react';

const CONSUMER_STAGES = [
  { key: 'notification.sent', label: 'Notification', icon: Mail, color: 'text-blue-400', bg: 'bg-blue-500/10' },
  { key: 'ledger.debit', label: 'Ledger', icon: BookOpen, color: 'text-amber-400', bg: 'bg-amber-500/10' },
  { key: 'fraud', label: 'Fraud Check', icon: Shield, color: 'text-red-400', bg: 'bg-red-500/10' },
  { key: 'analytics.recorded', label: 'Analytics', icon: BarChart3, color: 'text-purple-400', bg: 'bg-purple-500/10' },
];

export default function KafkaEventLog({ transactionId }) {
  const { authFetch } = useAuth();
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!transactionId) {
      setEvents([]);
      setLoading(false);
      return;
    }

    let pollCount = 0;
    const maxPolls = 10;

    async function fetchEvents() {
      try {
        const res = await authFetch(`/api/transactions/${transactionId}/events`);
        if (res.ok) {
          const data = await res.json();
          setEvents(data);

          // Stop polling when all consumers have processed
          if (data.length >= 4 || pollCount >= maxPolls) {
            setLoading(false);
            return;
          }
        }
      } catch (err) {
        console.error('Failed to fetch events:', err);
      }

      pollCount++;
      if (pollCount < maxPolls) {
        setTimeout(fetchEvents, 1500);
      } else {
        setLoading(false);
      }
    }

    fetchEvents();
  }, [transactionId, authFetch]);

  const getStageStatus = (stageKey) => {
    const matchingEvent = events.find((e) => e.event_type.startsWith(stageKey.split('.')[0]));
    return matchingEvent ? 'completed' : loading ? 'pending' : 'waiting';
  };

  if (!transactionId) return null;

  return (
    <div className="bg-neutral-950 border border-neutral-800 rounded-xl p-4 mt-4">
      <div className="flex items-center gap-2 mb-4">
        <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
        <h3 className="text-sm font-semibold text-neutral-300">Kafka Event Pipeline</h3>
        {loading && (
          <Loader size={12} className="text-neutral-500 animate-spin ml-auto" />
        )}
      </div>

      {/* Pipeline visualization */}
      <div className="flex items-center gap-1 mb-4">
        <div className="bg-emerald-500/20 text-emerald-400 text-[9px] font-mono px-2 py-0.5 rounded">
          payment.created
        </div>
        <div className="text-neutral-600 text-xs">→</div>
        <div className="bg-neutral-800 text-neutral-400 text-[9px] font-mono px-2 py-0.5 rounded">
          Kafka
        </div>
        <div className="text-neutral-600 text-xs">→</div>
        <div className="bg-neutral-800 text-neutral-400 text-[9px] font-mono px-2 py-0.5 rounded">
          Consumers
        </div>
      </div>

      {/* Consumer stages */}
      <div className="space-y-2">
        {CONSUMER_STAGES.map((stage, index) => {
          const status = getStageStatus(stage.key);
          const Icon = stage.icon;

          return (
            <div
              key={stage.key}
              className={`flex items-center gap-3 px-3 py-2 rounded-lg border transition-all duration-500 ${
                status === 'completed'
                  ? 'border-neutral-800 bg-neutral-900/50'
                  : 'border-neutral-800/50 bg-black/30'
              }`}
              style={{ animationDelay: `${index * 200}ms` }}
            >
              <div className={`w-7 h-7 rounded-lg ${stage.bg} flex items-center justify-center flex-shrink-0`}>
                <Icon size={14} className={stage.color} />
              </div>

              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium text-neutral-300">{stage.label}</p>
                <p className="text-[10px] text-neutral-600 font-mono">{stage.key}</p>
              </div>

              <div className="flex-shrink-0">
                {status === 'completed' ? (
                  <CheckCircle size={16} className="text-emerald-500" />
                ) : status === 'pending' ? (
                  <Clock size={16} className="text-amber-500 animate-pulse" />
                ) : (
                  <AlertTriangle size={14} className="text-neutral-600" />
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Event count */}
      <div className="mt-3 pt-3 border-t border-neutral-800/50">
        <p className="text-[10px] text-neutral-600">
          {events.length} event{events.length !== 1 ? 's' : ''} processed
          {loading ? ' • Processing...' : ' • Complete'}
        </p>
      </div>
    </div>
  );
}
