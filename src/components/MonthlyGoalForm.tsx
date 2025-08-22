'use client';

import { useState, useEffect } from 'react';
import { clientStorageUtils } from '@/lib/client-storage';
import { timeUtils } from '@/lib/calculations';

interface MonthlyGoalFormProps {
  onGoalUpdated?: () => void;
  userId?: string;
}

export default function MonthlyGoalForm({ onGoalUpdated, userId }: MonthlyGoalFormProps) {
  const [month, setMonth] = useState(timeUtils.getCurrentMonth());
  const [hoursGoal, setHoursGoal] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const loadExistingGoal = async () => {
      try {
        // Carrega a meta existente para o mês selecionado
        const existingGoal = userId 
          ? await clientStorageUtils.getUserMonthlyGoal(userId, month) 
          : await clientStorageUtils.getMonthlyGoal(month);
        setHoursGoal(existingGoal > 0 ? existingGoal.toString() : '');
      } catch (error) {
        console.error('Error loading existing goal:', error);
        setHoursGoal('');
      }
    };
    
    loadExistingGoal();
  }, [month, userId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const goalValue = parseFloat(hoursGoal);
    
    if (isNaN(goalValue) || goalValue <= 0) {
      setError('Meta deve ser um número positivo');
      return;
    }
    
    if (goalValue > 744) { // 31 dias * 24 horas
      setError('Meta muito alta para um mês');
      return;
    }

    setError('');
    setIsSubmitting(true);

    try {
      if (userId) {
        await clientStorageUtils.saveMonthlyGoal({
          id: crypto.randomUUID(),
          userId,
          month,
          hoursGoal: goalValue,
          createdAt: new Date().toISOString(),
        });
      } else {
        await clientStorageUtils.saveMonthlyGoal({
          id: crypto.randomUUID(),
          userId: 'default', // Para compatibilidade com o sistema antigo
          month,
          hoursGoal: goalValue,
          createdAt: new Date().toISOString(),
        });
      }

      onGoalUpdated?.();
    } catch (error) {
      console.error('Error saving goal:', error);
      setError('Erro ao salvar meta');
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatMonthDisplay = (monthStr: string): string => {
    const [year, month] = monthStr.split('-');
    const monthNames = [
      'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
      'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
    ];
    
    return `${monthNames[parseInt(month) - 1]} ${year}`;
  };

  const getSuggestedHours = (): string[] => {
    // Sugestões baseadas em horas de trabalho comuns
    return ['160', '176', '200', '220']; // 20h/semana, 22h/semana, 25h/semana, 27.5h/semana
  };

  return (
    <div className="bg-gray-800 rounded-lg shadow-lg p-6 mb-6 border border-gray-700">
      <h2 className="text-2xl font-bold text-white mb-6">Configurar Meta Mensal</h2>
      
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="month" className="block text-sm font-medium text-gray-300 mb-2">
            Mês
          </label>
          <input
            type="month"
            id="month"
            value={month}
            onChange={(e) => setMonth(e.target.value)}
            className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-400 text-white"
          />
          <p className="text-sm text-gray-400 mt-1">
            Configurando meta para: <strong className="text-white">{formatMonthDisplay(month)}</strong>
          </p>
        </div>

        <div>
          <label htmlFor="hoursGoal" className="block text-sm font-medium text-gray-300 mb-2">
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
            className={`w-full px-3 py-2 bg-gray-700 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-400 text-white placeholder-gray-400 ${
              error ? 'border-red-500' : 'border-gray-600'
            }`}
            placeholder="Ex: 176"
          />
          {error && <p className="text-red-400 text-sm mt-1">{error}</p>}
        </div>

        <div className="bg-gray-700 rounded-md p-4 border border-gray-600">
          <p className="text-sm font-medium text-gray-300 mb-2">Sugestões de metas comuns:</p>
          <div className="flex flex-wrap gap-2">
            {getSuggestedHours().map((hours) => (
              <button
                key={hours}
                type="button"
                onClick={() => {
                  setHoursGoal(hours);
                  setError('');
                }}
                className="px-3 py-1 text-sm bg-blue-700 hover:bg-blue-600 text-blue-200 rounded-md transition-colors"
              >
                {hours}h
              </button>
            ))}
          </div>
          <p className="text-xs text-gray-400 mt-2">
            {hoursGoal && !isNaN(parseFloat(hoursGoal)) && parseFloat(hoursGoal) > 0 && (
              <>Aproximadamente {timeUtils.formatHours(parseFloat(hoursGoal) / 4)} por semana</>
            )}
          </p>
        </div>

        <button
          type="submit"
          disabled={isSubmitting || !hoursGoal}
          className={`w-full py-2 px-4 rounded-md font-medium transition-colors ${
            isSubmitting || !hoursGoal
              ? 'bg-gray-400 cursor-not-allowed'
              : 'bg-green-600 hover:bg-green-700 text-white'
          }`}
        >
          {isSubmitting ? 'Salvando...' : 'Salvar Meta'}
        </button>
      </form>
    </div>
  );
}
