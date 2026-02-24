type Status = 'pending' | 'approved' | 'rejected';

interface StatusBadgeProps {
  status: Status;
}

const STATUS_CONFIGS: Record<Status, { className: string; label: string }> = {
  pending: {
    className: 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30',
    label: '⏳ Pendente',
  },
  approved: {
    className: 'bg-green-500/20 text-green-300 border-green-500/30',
    label: '✓ Aprovado',
  },
  rejected: {
    className: 'bg-red-500/20 text-red-300 border-red-500/30',
    label: '✗ Rejeitado',
  },
};

export default function StatusBadge({ status }: StatusBadgeProps) {
  const config = STATUS_CONFIGS[status];
  if (!config) return null;
  return (
    <span className={`text-xs px-3 py-1 rounded-full border ${config.className}`}>
      {config.label}
    </span>
  );
}
