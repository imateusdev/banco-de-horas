'use client';

import { useState, useEffect } from 'react';
import { apiClient } from '@/lib/api-client';
import { timeUtils } from '@/lib/calculations';
import { AccumulatedHours } from '@/types';

interface AccumulatedHoursSectionProps {
  userId?: string;
  refreshTrigger?: number;
}

export default function AccumulatedHoursSection({
  userId,
  refreshTrigger,
}: AccumulatedHoursSectionProps) {
  const [accumulatedHours, setAccumulatedHours] = useState<AccumulatedHours | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadAccumulatedHours = async () => {
      if (!userId) return;

      setLoading(true);
      try {
        const [totalHours, conversions] = await Promise.all([
          apiClient.getAccumulatedHours(userId),
          apiClient.getHourConversions(userId),
        ]);

        const convertedToMoney = conversions
          .filter((c) => c.type === 'money')
          .reduce((sum, c) => sum + c.hours, 0);

        const usedForTimeOff = conversions
          .filter((c) => c.type === 'time_off')
          .reduce((sum, c) => sum + c.hours, 0);

        const totalExtraHours = totalHours + convertedToMoney + usedForTimeOff;

        setAccumulatedHours({
          totalExtraHours,
          availableHours: totalHours,
          convertedToMoney,
          usedForTimeOff,
        });
      } catch (error) {
        console.error('Error loading accumulated hours:', error);
      } finally {
        setLoading(false);
      }
    };

    loadAccumulatedHours();
  }, [userId, refreshTrigger]);

  if (loading) {
    return (
      <div className="bg-gray-800 rounded-lg shadow-lg p-6 border border-gray-700">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-700 rounded w-64 mb-6"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="bg-gray-700 rounded-lg p-4">
                <div className="h-8 bg-gray-600 rounded w-16 mx-auto mb-2"></div>
                <div className="h-4 bg-gray-600 rounded w-24 mx-auto"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!accumulatedHours) {
    return null;
  }

  return (
    <div className="bg-gray-800 rounded-lg shadow-lg p-6 border border-gray-700">
      <h2 className="text-2xl font-bold text-white mb-6">💰 Banco de Horas Extras Acumuladas</h2>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {}
        <div className="bg-green-900/30 border border-green-700 rounded-lg p-4 text-center">
          <div className="text-3xl font-bold text-green-400 mb-2">
            {timeUtils.formatHours(accumulatedHours.totalExtraHours)}
          </div>
          <p className="text-sm text-green-300 font-medium">Total Acumulado</p>
          <p className="text-xs text-green-200 mt-1">Soma de todos os meses</p>
        </div>

        {}
        <div className="bg-blue-900/30 border border-blue-700 rounded-lg p-4 text-center">
          <div className="text-3xl font-bold text-blue-400 mb-2">
            {timeUtils.formatHours(accumulatedHours.availableHours)}
          </div>
          <p className="text-sm text-blue-300 font-medium">Disponível</p>
          <p className="text-xs text-blue-200 mt-1">Para converter ou usar</p>
        </div>

        {}
        <div className="bg-yellow-900/30 border border-yellow-700 rounded-lg p-4 text-center">
          <div className="text-3xl font-bold text-yellow-400 mb-2">
            {timeUtils.formatHours(accumulatedHours.convertedToMoney)}
          </div>
          <p className="text-sm text-yellow-300 font-medium">Convertido em 💰</p>
          <p className="text-xs text-yellow-200 mt-1">Já recebido</p>
        </div>

        {}
        <div className="bg-purple-900/30 border border-purple-700 rounded-lg p-4 text-center">
          <div className="text-3xl font-bold text-purple-400 mb-2">
            {timeUtils.formatHours(accumulatedHours.usedForTimeOff)}
          </div>
          <p className="text-sm text-purple-300 font-medium">Usado em Folgas</p>
          <p className="text-xs text-purple-200 mt-1">Já descontado</p>
        </div>
      </div>

      {}
      <div className="mt-6 p-4 bg-gray-700 border border-gray-600 rounded-md">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
          <div className="mb-2 sm:mb-0">
            <p className="text-white font-medium">
              📈 Saldo de Horas Extras:{' '}
              <span className="text-green-400">
                {timeUtils.formatHours(accumulatedHours.availableHours)}
              </span>
            </p>
            <p className="text-gray-400 text-sm">
              {accumulatedHours.availableHours > 0
                ? 'Você pode converter essas horas em dinheiro ou reservar para folgas.'
                : 'Continue trabalhando para acumular mais horas extras!'}
            </p>
          </div>

          {accumulatedHours.totalExtraHours > 0 && (
            <div className="text-right">
              <p className="text-sm text-gray-400">Percentual disponível:</p>
              <p className="text-lg font-bold text-blue-400">
                {(
                  (accumulatedHours.availableHours / accumulatedHours.totalExtraHours) *
                  100
                ).toFixed(1)}
                %
              </p>
            </div>
          )}
        </div>
      </div>

      {accumulatedHours.totalExtraHours === 0 && (
        <div className="mt-6 text-center p-4 bg-gray-700 border border-gray-600 rounded-md">
          <p className="text-gray-300 text-lg">🎯 Ainda não há horas extras acumuladas</p>
          <p className="text-gray-400 text-sm mt-2">
            Trabalhe além da sua meta mensal para começar a acumular horas extras!
          </p>
        </div>
      )}
    </div>
  );
}
