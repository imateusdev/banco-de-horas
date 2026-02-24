'use client';

import { useHourConversions } from '@/hooks/useQueries';
import { HourConversion } from '@/types';
import StatusBadge from '@/components/ui/StatusBadge';

interface HourConversionsListProps {
  userId: string;
}

export default function HourConversionsList({ userId }: HourConversionsListProps) {
  const { data: conversions = [], isLoading } = useHourConversions(userId);

  if (isLoading) {
    return (
      <div className="glass-panel p-6 fade-in-up">
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-white/5 rounded w-48"></div>
          <div className="h-20 bg-white/5 rounded"></div>
          <div className="h-20 bg-white/5 rounded"></div>
        </div>
      </div>
    );
  }

  if (conversions.length === 0) {
    return (
      <div className="glass-panel p-6 text-center fade-in-up">
        <p className="text-white/60">Nenhuma conversão de horas registrada</p>
      </div>
    );
  }

  return (
    <div className="glass-panel p-6 fade-in-up">
      <div className="mb-6">
        <span className="font-mono text-[9px] text-white/25 uppercase tracking-widest block mb-2">
          HISTORY // CONVERSIONS
        </span>
        <h3 className="text-xl font-bold text-white">Histórico de Conversões</h3>
      </div>

      <div className="space-y-3">
        {conversions.map((conversion: HourConversion) => (
          <div
            key={conversion.id}
            className="p-4 bg-white/5 border border-white/10 rounded-lg hover:bg-white/10 transition-all duration-300"
          >
            <div className="flex items-start justify-between mb-2">
              <div className="flex items-center gap-3">
                <span
                  className={`text-xs px-2 py-1 rounded-full ${
                    conversion.type === 'money'
                      ? 'bg-green-500/20 text-green-300'
                      : 'bg-blue-500/20 text-blue-300'
                  }`}
                >
                  {conversion.type === 'money' ? '💰 Dinheiro' : '🏖️ Folga'}
                </span>
                <StatusBadge status={conversion.status as 'pending' | 'approved' | 'rejected'} />
              </div>
              <span className="text-sm text-white/50">
                {new Date(conversion.date).toLocaleDateString('pt-BR')}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-white/50">Horas:</span>
                <p className="text-white font-semibold">{conversion.hours}h</p>
              </div>
              {conversion.type === 'money' && (
                <div>
                  <span className="text-white/50">Valor:</span>
                  <p className="text-white font-semibold">R$ {conversion.amount.toFixed(2)}</p>
                </div>
              )}
            </div>

            {conversion.status === 'pending' && (
              <div className="mt-3 p-2 bg-yellow-500/10 border border-yellow-500/20 rounded text-xs text-yellow-300">
                ℹ️ Aguardando aprovação do administrador
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
