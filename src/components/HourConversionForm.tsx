'use client';

import { useState, useEffect } from 'react';
import { clientStorageUtils } from '@/lib/client-storage';
import { clientTimeUtils } from '@/lib/client-calculations';
import { timeUtils } from '@/lib/calculations';
import { AccumulatedHours, HourConversion } from '@/types';

interface HourConversionFormProps {
  userId: string;
  userName: string;
  onConversionAdded?: () => void;
}

export default function HourConversionForm({ userId, onConversionAdded }: HourConversionFormProps) {
  const [accumulatedHours, setAccumulatedHours] = useState<AccumulatedHours | null>(null);
  const [formData, setFormData] = useState({
    hours: '',
    amount: '',
    type: 'money' as 'money' | 'time_off',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadAccumulatedHours = async () => {
      try {
        const hours = await clientTimeUtils.getAccumulatedExtraHours(userId);
        setAccumulatedHours(hours);
      } catch (error) {
        console.error('Error loading accumulated hours:', error);
      } finally {
        setLoading(false);
      }
    };

    loadAccumulatedHours();
  }, [userId]);

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

    setIsSubmitting(true);

    try {
      const conversion: HourConversion = {
        id: timeUtils.generateId(),
        userId,
        hours: parseFloat(formData.hours),
        amount: formData.type === 'money' ? parseFloat(formData.amount) : 0,
        type: formData.type,
        date: timeUtils.getCurrentDate(),
        createdAt: new Date().toISOString(),
      };

      await clientStorageUtils.saveHourConversion(conversion);

      // Reset form
      setFormData({
        hours: '',
        amount: '',
        type: 'money',
      });

      // Reload accumulated hours
      const updatedHours = await clientTimeUtils.getAccumulatedExtraHours(userId);
      setAccumulatedHours(updatedHours);

      onConversionAdded?.();
    } catch (error) {
      console.error('Error saving conversion:', error);
      setErrors({ submit: 'Erro ao salvar conversão. Tente novamente.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  if (loading) {
    return (
      <div className="bg-gray-800 rounded-lg shadow-lg p-6 mb-6 border border-gray-700">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-700 rounded w-48 mb-4"></div>
          <div className="h-16 bg-gray-700 rounded mb-4"></div>
          <div className="h-10 bg-gray-700 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-800 rounded-lg shadow-lg p-6 mb-6 border border-gray-700">
      <h2 className="text-2xl font-bold text-white mb-4">Banco de Horas Extras</h2>
      
      {/* Resumo das Horas Acumuladas */}
      {accumulatedHours && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <div className="bg-green-900/30 border border-green-700 rounded-lg p-4 text-center">
            <p className="text-2xl font-bold text-green-400">
              {timeUtils.formatHours(accumulatedHours.totalExtraHours)}
            </p>
            <p className="text-sm text-green-300">Total Acumulado</p>
          </div>
          <div className="bg-blue-900/30 border border-blue-700 rounded-lg p-4 text-center">
            <p className="text-2xl font-bold text-blue-400">
              {timeUtils.formatHours(accumulatedHours.availableHours)}
            </p>
            <p className="text-sm text-blue-300">Disponível</p>
          </div>
          <div className="bg-yellow-900/30 border border-yellow-700 rounded-lg p-4 text-center">
            <p className="text-2xl font-bold text-yellow-400">
              {timeUtils.formatHours(accumulatedHours.convertedToMoney)}
            </p>
            <p className="text-sm text-yellow-300">Convertido em $</p>
          </div>
          <div className="bg-purple-900/30 border border-purple-700 rounded-lg p-4 text-center">
            <p className="text-2xl font-bold text-purple-400">
              {timeUtils.formatHours(accumulatedHours.usedForTimeOff)}
            </p>
            <p className="text-sm text-purple-300">Usado em Folgas</p>
          </div>
        </div>
      )}

      {accumulatedHours && accumulatedHours.availableHours > 0 ? (
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="type" className="block text-sm font-medium text-gray-300 mb-2">
              Tipo de Conversão
            </label>
            <select
              id="type"
              value={formData.type}
              onChange={(e) => handleInputChange('type', e.target.value)}
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-400 text-white"
            >
              <option value="money">💰 Converter em Dinheiro</option>
              <option value="time_off">🏖️ Usar para Folga Futura</option>
            </select>
          </div>

          <div>
            <label htmlFor="hours" className="block text-sm font-medium text-gray-300 mb-2">
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
              className={`w-full px-3 py-2 bg-gray-700 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-400 text-white ${
                errors.hours ? 'border-red-500' : 'border-gray-600'
              }`}
              placeholder="Ex: 2.5"
            />
            {errors.hours && <p className="text-red-400 text-sm mt-1">{errors.hours}</p>}
            <p className="text-gray-400 text-sm mt-1">
              Máximo disponível: {timeUtils.formatHours(accumulatedHours?.availableHours || 0)}
            </p>
          </div>

          {formData.type === 'money' && (
            <div>
              <label htmlFor="amount" className="block text-sm font-medium text-gray-300 mb-2">
                Valor em Dinheiro (R$)
              </label>
              <input
                type="number"
                id="amount"
                step="0.01"
                min="0"
                value={formData.amount}
                onChange={(e) => handleInputChange('amount', e.target.value)}
                className={`w-full px-3 py-2 bg-gray-700 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-400 text-white ${
                  errors.amount ? 'border-red-500' : 'border-gray-600'
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
                  : ' ficarão reservadas para futuras folgas'
                }
              </p>
            </div>
          )}

          <button
            type="submit"
            disabled={isSubmitting}
            className={`w-full py-2 px-4 rounded-md font-medium transition-colors ${
              isSubmitting
                ? 'bg-gray-400 cursor-not-allowed'
                : 'bg-green-600 hover:bg-green-700 text-white'
            }`}
          >
            {isSubmitting ? 'Processando...' : 
              formData.type === 'money' ? 'Converter em Dinheiro' : 'Reservar para Folga'
            }
          </button>

          {errors.submit && (
            <p className="text-red-400 text-sm text-center">{errors.submit}</p>
          )}
        </form>
      ) : (
        <div className="text-center p-6 bg-gray-700 border border-gray-600 rounded-md">
          <p className="text-gray-300">
            {accumulatedHours?.totalExtraHours === 0 
              ? '🕐 Ainda não há horas extras acumuladas.'
              : '✅ Todas as horas extras já foram convertidas ou utilizadas.'
            }
            <br />
            <span className="text-sm text-gray-400">
              Continue trabalhando para acumular mais horas extras!
            </span>
          </p>
        </div>
      )}
    </div>
  );
}
