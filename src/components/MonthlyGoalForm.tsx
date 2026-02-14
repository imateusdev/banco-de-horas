'use client';

import { useState, useEffect } from 'react';
import { timeUtils } from '@/lib/calculations';
import { useMonthlyGoalWithStatus, useSaveMonthlyGoal } from '@/hooks/useQueries';
import { useAuth } from '@/contexts/AuthContext';

interface MonthlyGoalFormProps {
  onGoalUpdated?: () => void;
  userId?: string;
}

export default function MonthlyGoalForm({ onGoalUpdated, userId }: MonthlyGoalFormProps) {
  const [month, setMonth] = useState(timeUtils.getCurrentMonth());
  const [hoursGoal, setHoursGoal] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const { isAdmin } = useAuth();

  const { data: existingGoal } = useMonthlyGoalWithStatus(userId || '', month);
  const saveGoal = useSaveMonthlyGoal();

  useEffect(() => {
    if (existingGoal?.hoursGoal) {
      setHoursGoal(existingGoal.hoursGoal.toString());
    } else {
      setHoursGoal('');
    }
  }, [existingGoal]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const goalValue = parseFloat(hoursGoal);

    if (isNaN(goalValue) || goalValue <= 0) {
      setError('Meta deve ser um número positivo');
      return;
    }

    if (goalValue > 744) {
      setError('Meta muito alta para um mês');
      return;
    }

    if (!userId) {
      setError('ID de usuário não encontrado');
      return;
    }

    setError('');

    try {
      await saveGoal.mutateAsync({ userId, month, goal: goalValue });
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
      onGoalUpdated?.();
    } catch (error) {
      console.error('Error saving goal:', error);
      setError('Erro ao salvar meta');
    }
  };

  const isSubmitting = saveGoal.isPending;
  const hasPendingGoal = existingGoal?.status === 'pending';
  const hasRejectedGoal = existingGoal?.status === 'rejected';
  const hasApprovedGoal = existingGoal?.status === 'approved';

  const formatMonthDisplay = (monthStr: string): string => {
    const [year, month] = monthStr.split('-');
    const monthNames = [
      'Janeiro',
      'Fevereiro',
      'Março',
      'Abril',
      'Maio',
      'Junho',
      'Julho',
      'Agosto',
      'Setembro',
      'Outubro',
      'Novembro',
      'Dezembro',
    ];

    return `${monthNames[parseInt(month) - 1]} ${year}`;
  };

  const getSuggestedHours = (): string[] => {
    return ['160', '176', '200', '220'];
  };

  const getStatusBadge = () => {
    if (!existingGoal) return null;

    switch (existingGoal.status) {
      case 'pending':
        return (
          <div className="p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xs px-3 py-1 rounded-full bg-yellow-500/20 text-yellow-300 border border-yellow-500/30">
                ⏳ Pendente
              </span>
              <span className="text-sm text-yellow-300 font-semibold">
                Meta de {existingGoal.hoursGoal}h aguardando aprovação
              </span>
            </div>
            <p className="text-xs text-yellow-300/80">
              Um administrador precisa aprovar esta meta antes de ser aplicada
            </p>
          </div>
        );
      case 'rejected':
        return (
          <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xs px-3 py-1 rounded-full bg-red-500/20 text-red-300 border border-red-500/30">
                ✗ Rejeitada
              </span>
              <span className="text-sm text-red-300 font-semibold">
                Meta de {existingGoal.hoursGoal}h foi rejeitada
              </span>
            </div>
            <p className="text-xs text-red-300/80">
              Você pode solicitar uma nova meta para este mês
            </p>
          </div>
        );
      case 'approved':
        return (
          <div className="p-4 bg-green-500/10 border border-green-500/20 rounded-lg">
            <div className="flex items-center gap-2">
              <span className="text-xs px-3 py-1 rounded-full bg-green-500/20 text-green-300 border border-green-500/30">
                ✓ Aprovada
              </span>
              <span className="text-sm text-green-300 font-semibold">
                Meta atual: {existingGoal.hoursGoal}h
              </span>
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="glass-panel p-6 mb-6 fade-in-up">
      <div className="mb-6">
        <span className="font-mono text-[9px] text-white/25 uppercase tracking-widest block mb-2">
          GOAL // MONTHLY
        </span>
        <h2 className="text-2xl font-bold text-white">Configurar Meta Mensal</h2>
      </div>

      {getStatusBadge()}

      <form onSubmit={handleSubmit} className="space-y-4 mt-6">
        <div>
          <label htmlFor="month" className="block text-sm font-medium text-neutral-300 mb-2">
            Mês
          </label>
          <input
            type="month"
            id="month"
            value={month}
            onChange={(e) => setMonth(e.target.value)}
            className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-white transition-all duration-300 hover:bg-white/10"
          />
          <p className="text-sm text-neutral-400 mt-1">
            Configurando meta para:{' '}
            <strong className="text-white">{formatMonthDisplay(month)}</strong>
          </p>
        </div>

        <div>
          <label htmlFor="hoursGoal" className="block text-sm font-medium text-neutral-300 mb-2">
            Meta de Horas
          </label>
          <input
            type="number"
            id="hoursGoal"
            value={hoursGoal}
            onChange={(e) => {
              setHoursGoal(e.target.value);
              setError('');
            }}
            step="0.5"
            min="0"
            max="744"
            disabled={hasPendingGoal && !isAdmin}
            className={`w-full px-3 py-2 bg-white/5 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-400 text-white placeholder-gray-400 ${
              error ? 'border-red-500' : 'border-white/10'
            } ${hasPendingGoal && !isAdmin ? 'opacity-50 cursor-not-allowed' : ''}`}
            placeholder="Ex: 176"
          />
          {error && <p className="text-red-400 text-sm mt-1">{error}</p>}
        </div>

        <div className="bg-white/5 rounded-md p-4 border border-white/10">
          <p className="text-sm font-medium text-neutral-300 mb-2">Sugestões de metas comuns:</p>
          <div className="flex flex-wrap gap-2">
            {getSuggestedHours().map((hours) => (
              <button
                key={hours}
                type="button"
                onClick={() => {
                  setHoursGoal(hours);
                  setError('');
                }}
                disabled={hasPendingGoal && !isAdmin}
                className={`px-3 py-1 text-sm bg-linear-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600 text-white rounded-md shadow-lg shadow-blue-500/20 hover:shadow-blue-500/40 transition-all ${
                  hasPendingGoal && !isAdmin ? 'opacity-50 cursor-not-allowed' : ''
                }`}
              >
                {hours}h
              </button>
            ))}
          </div>
          <p className="text-xs text-neutral-400 mt-2">
            {hoursGoal && !isNaN(parseFloat(hoursGoal)) && parseFloat(hoursGoal) > 0 && (
              <>Aproximadamente {timeUtils.formatHours(parseFloat(hoursGoal) / 4)} por semana</>
            )}
          </p>
        </div>

        {!isAdmin && !hasPendingGoal && (
          <div className="p-3 bg-yellow-500/10 border border-yellow-500/20 rounded text-xs text-yellow-300">
            ℹ️ Esta meta precisará ser aprovada por um administrador antes de ser aplicada
          </div>
        )}

        {hasPendingGoal && !isAdmin && (
          <div className="p-3 bg-blue-500/10 border border-blue-500/20 rounded text-xs text-blue-300">
            ℹ️ Aguarde a aprovação da meta pendente antes de solicitar uma nova
          </div>
        )}

        {success && (
          <div className="p-3 bg-green-500/10 border border-green-500/20 rounded text-sm text-green-300 text-center">
            ✓ Meta salva com sucesso!
          </div>
        )}

        <button
          type="submit"
          disabled={isSubmitting || !hoursGoal || (hasPendingGoal && !isAdmin)}
          className={`w-full py-2 px-4 rounded-md font-medium transition-colors ${
            isSubmitting || !hoursGoal || (hasPendingGoal && !isAdmin)
              ? 'bg-white/10 text-white/40 cursor-not-allowed border border-white/10'
              : 'bg-linear-to-r from-green-600 to-green-500 hover:from-green-700 hover:to-green-600 text-white shadow-lg shadow-green-500/20 hover:shadow-green-500/40'
          }`}
        >
          {isSubmitting
            ? 'Salvando...'
            : isAdmin
              ? hasApprovedGoal
                ? 'Atualizar Meta'
                : 'Salvar Meta'
              : hasPendingGoal
                ? 'Aguardando Aprovação'
                : hasRejectedGoal || hasApprovedGoal
                  ? 'Solicitar Nova Meta'
                  : 'Solicitar Meta'}
        </button>
      </form>
    </div>
  );
}
