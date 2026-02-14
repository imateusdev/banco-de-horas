'use client';

import { useState } from 'react';
import { timeUtils } from '@/lib/calculations';
import { HourConversion } from '@/types';
import { useCreateHourConversion, useDashboardData } from '@/hooks/useQueries';

interface HourConversionFormProps {
  userId: string;
  userName: string;
  onConversionAdded?: () => void;
}

export default function HourConversionForm({ userId, onConversionAdded }: HourConversionFormProps) {
  const [formData, setFormData] = useState({
    hours: '',
    amount: '',
    type: 'money' as 'money' | 'time_off',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [success, setSuccess] = useState(false);

  const { data, isLoading: loading } = useDashboardData(
    userId,
    timeUtils.getCurrentDate(),
    timeUtils.getCurrentMonth()
  );
  const createConversion = useCreateHourConversion();

  const accumulatedHours = data?.accumulatedHours || null;
  const isSubmitting = createConversion.isPending;

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.hours || parseFloat(formData.hours) <= 0) {
      newErrors.hours = 'Quantidade de horas deve ser maior que zero';
    } else if (accumulatedHours && parseFloat(formData.hours) > accumulatedHours.availableHours) {
      newErrors.hours = `Máximo disponível: ${timeUtils.formatHours(accumulatedHours.availableHours)}`;
    }

    if (formData.type === 'money' && (!formData.amount || parseFloat(formData.amount) <= 0)) {
      newErrors.amount = 'Valor em dinheiro deve ser maior que zero';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
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

      setFormData({
        hours: '',
        amount: '',
        type: 'money',
      });

      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);

      onConversionAdded?.();
    } catch (error) {
      console.error('Error saving conversion:', error);
      setErrors({ submit: 'Erro ao salvar conversão. Tente novamente.' });
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));

    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: '' }));
    }
  };

  if (loading) {
    return (
      <div className="glass-panel p-6 mb-6 fade-in-up">
        <div className="animate-pulse">
          <div className="h-6 bg-white/5 rounded w-48 mb-4"></div>
          <div className="h-16 bg-white/5 rounded mb-4"></div>
          <div className="h-10 bg-white/5 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="glass-panel p-6 mb-6 fade-in-up">
      <div className="mb-6">
        <span className="font-mono text-[9px] text-white/25 uppercase tracking-widest block mb-2">
          CONVERT // HOURS
        </span>
        <h2 className="text-2xl font-bold text-white">Banco de Horas Extras</h2>
      </div>

      {}
      {accumulatedHours && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <div className="bg-white/5 border border-white/10 rounded-lg p-4 text-center hover:bg-white/10 transition-all duration-300">
            <p className="text-2xl font-bold text-green-400">
              {timeUtils.formatHours(accumulatedHours.totalExtraHours)}
            </p>
            <p className="text-sm text-white/70">Total Acumulado</p>
          </div>
          <div className="bg-white/5 border border-white/10 rounded-lg p-4 text-center hover:bg-white/10 transition-all duration-300">
            <p className="text-2xl font-bold text-blue-400">
              {timeUtils.formatHours(accumulatedHours.availableHours)}
            </p>
            <p className="text-sm text-white/70">Disponível</p>
          </div>
          <div className="bg-white/5 border border-white/10 rounded-lg p-4 text-center hover:bg-white/10 transition-all duration-300">
            <p className="text-2xl font-bold text-yellow-400">
              {timeUtils.formatHours(accumulatedHours.convertedToMoney)}
            </p>
            <p className="text-sm text-white/70">Convertido em R$</p>
          </div>
          <div className="bg-white/5 border border-white/10 rounded-lg p-4 text-center hover:bg-white/10 transition-all duration-300">
            <p className="text-2xl font-bold text-purple-400">
              {timeUtils.formatHours(accumulatedHours.usedForTimeOff)}
            </p>
            <p className="text-sm text-white/70">Usado em Folgas</p>
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
              onChange={(e) => handleInputChange('type', e.target.value)}
              className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-white transition-all duration-300 hover:bg-white/10 [&>option]:bg-[#1a1a1a] [&>option]:text-white"
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
              onChange={(e) => handleInputChange('hours', e.target.value)}
              className={`w-full px-3 py-2 bg-white/5 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-400 text-white ${
                errors.hours ? 'border-red-500' : 'border-white/10'
              }`}
              placeholder="Ex: 2.5"
            />
            {errors.hours && <p className="text-red-400 text-sm mt-1">{errors.hours}</p>}
            <p className="text-neutral-400 text-sm mt-1">
              Máximo disponível: {timeUtils.formatHours(accumulatedHours?.availableHours || 0)}
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
                onChange={(e) => handleInputChange('amount', e.target.value)}
                className={`w-full px-3 py-2 bg-white/5 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-400 text-white ${
                  errors.amount ? 'border-red-500' : 'border-white/10'
                }`}
                placeholder="Ex: 150.00"
              />
              {errors.amount && <p className="text-red-400 text-sm mt-1">{errors.amount}</p>}
            </div>
          )}

          {formData.hours && parseFloat(formData.hours) > 0 && (
            <div className="bg-blue-900/30 border border-blue-700 rounded-md p-3">
              <p className="text-blue-300 text-sm">
                <strong>Resumo:</strong> {timeUtils.formatHours(parseFloat(formData.hours))}
                {formData.type === 'money'
                  ? ` serão convertidas em R$ ${parseFloat(formData.amount || '0').toFixed(2)}`
                  : ' ficarão reservadas para futuras folgas'}
              </p>
            </div>
          )}

          {success && (
            <div className="p-3 bg-green-500/10 border border-green-500/20 rounded text-sm text-green-300 text-center">
              ✓ Conversão salva com sucesso!
            </div>
          )}

          <button
            type="submit"
            disabled={isSubmitting}
            className={`w-full py-2 px-4 rounded-md font-medium transition-colors ${
              isSubmitting
                ? 'bg-white/10 text-white/40 cursor-not-allowed border border-white/10'
                : 'bg-linear-to-r from-green-600 to-green-500 hover:from-green-700 hover:to-green-600 text-white shadow-lg shadow-green-500/20 hover:shadow-green-500/40'
            }`}
          >
            {isSubmitting
              ? 'Processando...'
              : formData.type === 'money'
                ? 'Converter em Dinheiro'
                : 'Reservar para Folga'}
          </button>

          {errors.submit && <p className="text-red-400 text-sm text-center">{errors.submit}</p>}
        </form>
      ) : (
        <div className="text-center p-6 bg-white/5 border border-white/10 rounded-md">
          <p className="text-neutral-300">
            {accumulatedHours?.totalExtraHours === 0
              ? '🕐 Ainda não há horas extras acumuladas.'
              : '✅ Todas as horas extras já foram convertidas ou utilizadas.'}
            <br />
            <span className="text-sm text-neutral-400">
              Continue trabalhando para acumular mais horas extras!
            </span>
          </p>
        </div>
      )}
    </div>
  );
}
