import { CheckCircle, Clock, AlertCircle, Loader } from 'lucide-react';

const STATUS_CONFIG = {
  pending: { icon: Clock, color: 'text-amber-400', bg: 'bg-amber-500/10', label: 'Pending' },
  completed: { icon: CheckCircle, color: 'text-emerald-400', bg: 'bg-emerald-500/10', label: 'Completed' },
  failed: { icon: AlertCircle, color: 'text-red-400', bg: 'bg-red-500/10', label: 'Failed' },
  processing: { icon: Loader, color: 'text-blue-400', bg: 'bg-blue-500/10', label: 'Processing' },
};

export default function PaymentStatusBadge({ status }) {
  const config = STATUS_CONFIG[status] || STATUS_CONFIG.pending;
  const Icon = config.icon;
  const isAnimated = status === 'pending' || status === 'processing';

  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wider ${config.bg} ${config.color}`}>
      <Icon size={10} className={isAnimated ? 'animate-spin' : ''} />
      {config.label}
    </span>
  );
}
