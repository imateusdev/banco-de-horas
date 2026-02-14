'use client';

import { useHourConversions } from '@/hooks/useQueries';

interface UserConversionsHistoryProps {
  userId: string;
}

export default function UserConversionsHistory({ userId }: UserConversionsHistoryProps) {
  const { data: conversions = [], isLoading } = useHourConversions(userId);

  if (isLoading) {
    return (
      <div className="glass-panel p-8 text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
        <p className="text-white/60 mt-4">Carregando histórico de conversões...</p>
      </div>
    );
  }

  if (conversions.length === 0) {
    return (
      <div className="glass-panel p-12 text-center">
        <div className="text-6xl mb-4">💰</div>
        <h3 className="text-2xl font-bold text-white mb-2">Nenhuma Conversão</h3>
        <p className="text-white/60">Este usuário ainda não realizou nenhuma conversão de horas.</p>
      </div>
    );
  }

  // Agrupar conversões por status
  const pendingConversions = conversions.filter((c) => c.status === 'pending');
  const approvedConversions = conversions.filter((c) => c.status === 'approved');
  const rejectedConversions = conversions.filter((c) => c.status === 'rejected');

  const renderConversion = (conversion: any) => (
    <div
      key={conversion.id}
      className="p-4 bg-white/5 border border-white/10 rounded-lg hover:bg-white/10 transition-all duration-300"
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-2">
            <span
              className={`text-xs px-2 py-1 rounded-full ${
                conversion.type === 'money'
                  ? 'bg-green-500/20 text-green-300'
                  : 'bg-blue-500/20 text-blue-300'
              }`}
            >
              {conversion.type === 'money' ? '💰 Dinheiro' : '🏖️ Folga'}
            </span>
            <span
              className={`text-xs px-2 py-1 rounded-full ${
                conversion.status === 'pending'
                  ? 'bg-yellow-500/20 text-yellow-300'
                  : conversion.status === 'approved'
                    ? 'bg-green-500/20 text-green-300'
                    : 'bg-red-500/20 text-red-300'
              }`}
            >
              {conversion.status === 'pending'
                ? '⏳ Pendente'
                : conversion.status === 'approved'
                  ? '✓ Aprovado'
                  : '✗ Rejeitado'}
            </span>
          </div>
          <div className="grid grid-cols-3 gap-4 text-sm">
            <div>
              <span className="text-white/50">Horas:</span>
              <p className="text-white font-semibold">{conversion.hours}h</p>
            </div>
            <div>
              <span className="text-white/50">Valor:</span>
              <p className="text-white font-semibold">R$ {conversion.amount.toFixed(2)}</p>
            </div>
            <div>
              <span className="text-white/50">Data:</span>
              <p className="text-white font-semibold">
                {new Date(conversion.date).toLocaleDateString('pt-BR')}
              </p>
            </div>
          </div>
          {conversion.status === 'approved' && conversion.approvedAt && (
            <div className="mt-2 text-xs text-white/50">
              Aprovado em {new Date(conversion.approvedAt).toLocaleDateString('pt-BR')}
            </div>
          )}
          {conversion.createdAt && (
            <div className="mt-1 text-xs text-white/40">
              Solicitado em {new Date(conversion.createdAt).toLocaleDateString('pt-BR')}
            </div>
          )}
        </div>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      {pendingConversions.length > 0 && (
        <div className="glass-panel p-6">
          <div className="mb-4">
            <span className="font-mono text-[9px] text-white/25 uppercase tracking-widest block mb-2">
              PENDING // CONVERSIONS
            </span>
            <h3 className="text-xl font-bold text-white">
              Conversões Pendentes ({pendingConversions.length})
            </h3>
          </div>
          <div className="space-y-3">{pendingConversions.map(renderConversion)}</div>
        </div>
      )}

      {approvedConversions.length > 0 && (
        <div className="glass-panel p-6">
          <div className="mb-4">
            <span className="font-mono text-[9px] text-white/25 uppercase tracking-widest block mb-2">
              APPROVED // CONVERSIONS
            </span>
            <h3 className="text-xl font-bold text-white">
              Conversões Aprovadas ({approvedConversions.length})
            </h3>
          </div>
          <div className="space-y-3">{approvedConversions.map(renderConversion)}</div>
        </div>
      )}

      {rejectedConversions.length > 0 && (
        <div className="glass-panel p-6">
          <div className="mb-4">
            <span className="font-mono text-[9px] text-white/25 uppercase tracking-widest block mb-2">
              REJECTED // CONVERSIONS
            </span>
            <h3 className="text-xl font-bold text-white">
              Conversões Rejeitadas ({rejectedConversions.length})
            </h3>
          </div>
          <div className="space-y-3">{rejectedConversions.map(renderConversion)}</div>
        </div>
      )}
    </div>
  );
}
