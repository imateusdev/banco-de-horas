'use client';

import { useState, useEffect } from 'react';
import { useCreateHourConversion, useDashboardData } from '@/hooks/useQueries';
import { HourConversion } from '@/types';
import { timeUtils } from '@/lib/calculations';

interface AdminConversionModalProps {
  userId: string;
  userName: string;
  isOpen: boolean;
  onClose: () => void;
}

export default function AdminConversionModal({
  userId,
  userName,
  isOpen,
  onClose,
}: AdminConversionModalProps) {
  const [formData, setFormData] = useState({
    hours: '',
    amount: '',
    type: 'money' as 'money' | 'time_off',
  });
  const [error, setError] = useState('');

  const { data } = useDashboardData(
    userId,
    timeUtils.getCurrentDate(),
    timeUtils.getCurrentMonth()
  );
  const createConversion = useCreateHourConversion();

  const accumulatedHours = data?.accumulatedHours || null;

  useEffect(() => {
    if (isOpen) {
      setFormData({
        hours: '',
        amount: '',
        type: 'money',
      });
      setError('');
    }
  }, [isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.hours || parseFloat(formData.hours) <= 0) {
      setError('Quantidade de horas deve ser maior que zero');
      return;
    }

    if (accumulatedHours && parseFloat(formData.hours) > accumulatedHours.availableHours) {
      setError(`Máximo disponível: ${timeUtils.formatHours(accumulatedHours.availableHours)}`);
      return;
    }

    if (formData.type === 'money' && (!formData.amount || parseFloat(formData.amount) <= 0)) {
      setError('Valor em dinheiro deve ser maior que zero');
      return;
    }

    try {
      const conversion = {
        id: timeUtils.generateId(),
        userId,
        hours: parseFloat(formData.hours),
        amount: formData.type === 'money' ? parseFloat(formData.amount) : 0,
        type: formData.type,
        date: timeUtils.getCurrentDate(),
        createdAt: new Date().toISOString(),
      } as HourConversion;

      await createConversion.mutateAsync(conversion);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Erro ao salvar conversão');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div className="glass-panel p-6 w-full max-w-md fade-in-up">
        <div className="mb-6">
          <span className="font-mono text-[9px] text-white/25 uppercase tracking-widest block mb-2">
            ADMIN // CONVERT HOURS
          </span>
          <h2 className="text-2xl font-bold text-white">Converter Horas Extras</h2>
          <p className="text-white/60 text-sm mt-1">Para: {userName}</p>
        </div>

        {accumulatedHours && (
          <div className="grid grid-cols-2 gap-3 mb-6">
            <div className="bg-white/5 border border-white/10 rounded-lg p-3 text-center">
              <p className="text-lg font-bold text-green-400">
                {timeUtils.formatHours(accumulatedHours.totalExtraHours)}
              </p>
              <p className="text-xs text-white/70">Total</p>
            </div>
            <div className="bg-white/5 border border-white/10 rounded-lg p-3 text-center">
              <p className="text-lg font-bold text-blue-400">
                {timeUtils.formatHours(accumulatedHours.availableHours)}
              </p>
              <p className="text-xs text-white/70">Disponível</p>
            </div>
          </div>
        )}

        {accumulatedHours && accumulatedHours.availableHours > 0 ? (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="type" className="block text-sm font-medium text-neutral-300 mb-2">
                Tipo de Conversão
              </label>
              <select
                id="type"
                value={formData.type}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, type: e.target.value as 'money' | 'time_off' }))
                }
                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent text-white transition-all duration-300 hover:bg-white/10 [&>option]:bg-[#1a1a1a] [&>option]:text-white"
              >
                <option value="money">💰 Converter em Dinheiro</option>
                <option value="time_off">🏖️ Usar para Folga Futura</option>
              </select>
            </div>

            <div>
              <label htmlFor="hours" className="block text-sm font-medium text-neutral-300 mb-2">
                Quantidade de Horas
              </label>
              <input
                type="number"
                id="hours"
                step="0.5"
                min="0"
                max={accumulatedHours?.availableHours || 0}
                value={formData.hours}
                onChange={(e) => {
                  setFormData((prev) => ({ ...prev, hours: e.target.value }));
                  setError('');
                }}
                className={`w-full px-4 py-3 bg-white/5 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent text-white transition-all duration-300 hover:bg-white/10 ${
                  error ? 'border-red-500' : 'border-white/10'
                }`}
                placeholder="Ex: 2.5"
              />
              <p className="text-neutral-400 text-xs mt-1">
                Máximo: {timeUtils.formatHours(accumulatedHours?.availableHours || 0)}
              </p>
            </div>

            {formData.type === 'money' && (
              <div>
                <label htmlFor="amount" className="block text-sm font-medium text-neutral-300 mb-2">
                  Valor em Dinheiro (R$)
                </label>
                <input
                  type="number"
                  id="amount"
                  step="0.01"
                  min="0"
                  value={formData.amount}
                  onChange={(e) => {
                    setFormData((prev) => ({ ...prev, amount: e.target.value }));
                    setError('');
                  }}
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent text-white transition-all duration-300 hover:bg-white/10"
                  placeholder="Ex: 150.00"
                />
              </div>
            )}

            {error && <p className="text-red-400 text-sm">{error}</p>}

            <div className="flex gap-3 pt-4">
              <button
                type="button"
                onClick={onClose}
                disabled={createConversion.isPending}
                className="flex-1 px-4 py-3 bg-white/5 border border-white/10 text-white rounded-lg hover:bg-white/10 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={createConversion.isPending}
                className="flex-1 px-4 py-3 bg-linear-to-r from-green-600 to-green-500 hover:from-green-700 hover:to-green-600 text-white rounded-lg transition-all duration-300 shadow-lg shadow-green-500/20 hover:shadow-green-500/40 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
              >
                {createConversion.isPending ? 'Processando...' : 'Converter'}
              </button>
            </div>
          </form>
        ) : (
          <div className="text-center p-6 bg-white/5 border border-white/10 rounded-lg">
            <p className="text-neutral-300">
              {accumulatedHours?.totalExtraHours === 0
                ? '🕐 Ainda não há horas extras acumuladas.'
                : '✅ Todas as horas extras já foram convertidas ou utilizadas.'}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
