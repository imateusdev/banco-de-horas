'use client';

import { useState, useEffect } from 'react';
import { useSaveMonthlyGoal } from '@/hooks/useQueries';
import { timeUtils } from '@/lib/calculations';

interface AdminGoalModalProps {
  userId: string;
  userName: string;
  isOpen: boolean;
  onClose: () => void;
}

export default function AdminGoalModal({ userId, userName, isOpen, onClose }: AdminGoalModalProps) {
  const [month, setMonth] = useState(timeUtils.getCurrentMonth());
  const [goal, setGoal] = useState('');
  const [error, setError] = useState('');

  const saveGoal = useSaveMonthlyGoal();

  useEffect(() => {
    if (isOpen) {
      setMonth(timeUtils.getCurrentMonth());
      setGoal('');
      setError('');
    }
  }, [isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!goal || parseFloat(goal) <= 0) {
      setError('Meta deve ser maior que zero');
      return;
    }

    try {
      await saveGoal.mutateAsync({
        userId,
        month,
        goal: parseFloat(goal),
      });

      onClose();
    } catch (err: any) {
      setError(err.message || 'Erro ao salvar meta');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div className="glass-panel p-6 w-full max-w-md fade-in-up">
        <div className="mb-6">
          <span className="font-mono text-[9px] text-white/25 uppercase tracking-widest block mb-2">
            ADMIN // SET GOAL
          </span>
          <h2 className="text-2xl font-bold text-white">Definir Meta Mensal</h2>
          <p className="text-white/60 text-sm mt-1">Para: {userName}</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="month" className="block text-sm font-medium text-neutral-300 mb-2">
              Mês
            </label>
            <input
              type="month"
              id="month"
              value={month}
              onChange={(e) => setMonth(e.target.value)}
              className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent text-white transition-all duration-300 hover:bg-white/10"
            />
          </div>

          <div>
            <label htmlFor="goal" className="block text-sm font-medium text-neutral-300 mb-2">
              Meta de Horas
            </label>
            <input
              type="number"
              id="goal"
              step="0.5"
              min="0"
              value={goal}
              onChange={(e) => {
                setGoal(e.target.value);
                setError('');
              }}
              className={`w-full px-4 py-3 bg-white/5 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent text-white transition-all duration-300 hover:bg-white/10 ${
                error ? 'border-red-500' : 'border-white/10'
              }`}
              placeholder="Ex: 176"
            />
            {error && <p className="text-red-400 text-sm mt-1">{error}</p>}
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              disabled={saveGoal.isPending}
              className="flex-1 px-4 py-3 bg-white/5 border border-white/10 text-white rounded-lg hover:bg-white/10 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={saveGoal.isPending}
              className="flex-1 px-4 py-3 bg-linear-to-r from-purple-600 to-purple-500 hover:from-purple-700 hover:to-purple-600 text-white rounded-lg transition-all duration-300 shadow-lg shadow-purple-500/20 hover:shadow-purple-500/40 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
            >
              {saveGoal.isPending ? 'Salvando...' : 'Salvar Meta'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
