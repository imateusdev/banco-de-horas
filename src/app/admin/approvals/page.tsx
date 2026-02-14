'use client';

import { usePendingApprovals, useApproveConversion, useApproveGoal } from '@/hooks/useQueries';
import { useState } from 'react';
import AdminLayout from '@/components/AdminLayout';

export default function AdminApprovalsPage() {
  const { data, isLoading } = usePendingApprovals();
  const approveConversion = useApproveConversion();
  const approveGoal = useApproveGoal();

  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleApproveConversion = async (conversionId: string, action: 'approve' | 'reject') => {
    setError(null);
    setSuccess(null);

    try {
      await approveConversion.mutateAsync({ conversionId, action });
      setSuccess(`Conversão ${action === 'approve' ? 'aprovada' : 'rejeitada'} com sucesso`);
    } catch (error: any) {
      setError(error.message);
    }
  };

  const handleApproveGoal = async (goalId: string, action: 'approve' | 'reject') => {
    setError(null);
    setSuccess(null);

    try {
      await approveGoal.mutateAsync({ goalId, action });
      setSuccess(`Meta ${action === 'approve' ? 'aprovada' : 'rejeitada'} com sucesso`);
    } catch (error: any) {
      setError(error.message);
    }
  };

  const conversions = data?.conversions || [];
  const goals = data?.goals || [];
  const total = data?.total || 0;

  return (
    <AdminLayout loading={isLoading}>
      <div className="text-center mb-8 fade-in-up">
        <span className="font-mono text-[9px] text-white/25 uppercase tracking-widest block mb-2">
          PENDING // APPROVALS
        </span>
        <h2 className="text-3xl font-bold text-white mb-2">Aprovações Pendentes</h2>
        <p className="text-white/60">
          {total === 0
            ? 'Nenhuma aprovação pendente'
            : `${total} ${total === 1 ? 'item pendente' : 'itens pendentes'}`}
        </p>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-500/10 border border-red-500/30 rounded-lg backdrop-blur-sm fade-in-up">
          <p className="text-red-300 text-center">{error}</p>
        </div>
      )}

      {success && (
        <div className="mb-6 p-4 bg-green-500/10 border border-green-500/30 rounded-lg backdrop-blur-sm fade-in-up">
          <p className="text-green-300 text-center">{success}</p>
        </div>
      )}

      {conversions.length > 0 && (
        <div className="glass-panel p-6 mb-8 fade-in-up stagger-1">
          <div className="mb-6">
            <span className="font-mono text-[9px] text-white/25 uppercase tracking-widest block mb-2">
              CONVERSIONS // PENDING
            </span>
            <h3 className="text-xl font-bold text-white">
              Conversões de Horas ({conversions.length})
            </h3>
          </div>

          <div className="space-y-4">
            {conversions.map((conversion: any) => (
              <div
                key={conversion.id}
                className="p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-lg hover:bg-yellow-500/15 transition-all duration-300"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <span className="text-lg font-bold text-white">{conversion.userName}</span>
                      <span className="text-xs text-white/50">{conversion.userEmail}</span>
                      <span
                        className={`text-xs px-2 py-1 rounded-full ${
                          conversion.type === 'money'
                            ? 'bg-green-500/20 text-green-300'
                            : 'bg-blue-500/20 text-blue-300'
                        }`}
                      >
                        {conversion.type === 'money' ? '💰 Dinheiro' : '🏖️ Folga'}
                      </span>
                    </div>
                    <div className="grid grid-cols-3 gap-4 text-sm">
                      <div>
                        <span className="text-white/50">Horas:</span>
                        <p className="text-white font-semibold">{conversion.hours}h</p>
                      </div>
                      <div>
                        <span className="text-white/50">Valor:</span>
                        <p className="text-white font-semibold">
                          R$ {conversion.amount.toFixed(2)}
                        </p>
                      </div>
                      <div>
                        <span className="text-white/50">Data:</span>
                        <p className="text-white font-semibold">
                          {new Date(conversion.date).toLocaleDateString('pt-BR')}
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-2 ml-4">
                    <button
                      onClick={() => handleApproveConversion(conversion.id, 'approve')}
                      disabled={approveConversion.isPending || approveGoal.isPending}
                      className="px-4 py-2 bg-linear-to-r from-green-600 to-green-500 hover:from-green-700 hover:to-green-600 text-white rounded-lg transition-all duration-300 shadow-lg shadow-green-500/20 hover:shadow-green-500/40 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      ✓ Aprovar
                    </button>
                    <button
                      onClick={() => handleApproveConversion(conversion.id, 'reject')}
                      disabled={approveConversion.isPending || approveGoal.isPending}
                      className="px-4 py-2 bg-linear-to-r from-red-600 to-red-500 hover:from-red-700 hover:to-red-600 text-white rounded-lg transition-all duration-300 shadow-lg shadow-red-500/20 hover:shadow-red-500/40 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      ✗ Rejeitar
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {goals.length > 0 && (
        <div className="glass-panel p-6 fade-in-up stagger-2">
          <div className="mb-6">
            <span className="font-mono text-[9px] text-white/25 uppercase tracking-widest block mb-2">
              GOALS // PENDING
            </span>
            <h3 className="text-xl font-bold text-white">Metas Mensais ({goals.length})</h3>
          </div>

          <div className="space-y-4">
            {goals.map((goal: any) => (
              <div
                key={goal.id}
                className="p-4 bg-blue-500/10 border border-blue-500/20 rounded-lg hover:bg-blue-500/15 transition-all duration-300"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <span className="text-lg font-bold text-white">{goal.userName}</span>
                      <span className="text-xs text-white/50">{goal.userEmail}</span>
                    </div>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-white/50">Mês:</span>
                        <p className="text-white font-semibold">
                          {(() => {
                            const [year, month] = goal.month.split('-');
                            const monthNames = [
                              'janeiro',
                              'fevereiro',
                              'março',
                              'abril',
                              'maio',
                              'junho',
                              'julho',
                              'agosto',
                              'setembro',
                              'outubro',
                              'novembro',
                              'dezembro',
                            ];
                            return `${monthNames[parseInt(month) - 1]} de ${year}`;
                          })()}
                        </p>
                      </div>
                      <div>
                        <span className="text-white/50">Meta:</span>
                        <p className="text-white font-semibold">{goal.hoursGoal}h</p>
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-2 ml-4">
                    <button
                      onClick={() => handleApproveGoal(goal.id, 'approve')}
                      disabled={approveConversion.isPending || approveGoal.isPending}
                      className="px-4 py-2 bg-linear-to-r from-green-600 to-green-500 hover:from-green-700 hover:to-green-600 text-white rounded-lg transition-all duration-300 shadow-lg shadow-green-500/20 hover:shadow-green-500/40 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      ✓ Aprovar
                    </button>
                    <button
                      onClick={() => handleApproveGoal(goal.id, 'reject')}
                      disabled={approveConversion.isPending || approveGoal.isPending}
                      className="px-4 py-2 bg-linear-to-r from-red-600 to-red-500 hover:from-red-700 hover:to-red-600 text-white rounded-lg transition-all duration-300 shadow-lg shadow-red-500/20 hover:shadow-red-500/40 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      ✗ Rejeitar
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {total === 0 && !isLoading && (
        <div className="glass-panel p-12 text-center fade-in-up">
          <div className="text-6xl mb-4">✓</div>
          <h3 className="text-2xl font-bold text-white mb-2">Tudo Aprovado!</h3>
          <p className="text-white/60">Não há nenhuma aprovação pendente no momento</p>
        </div>
      )}
    </AdminLayout>
  );
}
