'use client';

import { useState } from 'react';
import { timeUtils } from '@/lib/calculations';
import { useDashboardData } from '@/hooks/useQueries';

interface StatsDashboardProps {
  refreshTrigger?: number;
  userId?: string;
}

export default function StatsDashboard({ userId }: StatsDashboardProps) {
  const [selectedDate, setSelectedDate] = useState(timeUtils.getCurrentDate());
  const [selectedMonth, setSelectedMonth] = useState(timeUtils.getCurrentMonth());

  const { data, isLoading: loading } = useDashboardData(
    userId || '',
    selectedDate,
    selectedMonth
  );

  const dailyStats = data?.dailyStats || null;
  const monthlyStats = data?.monthlyStats || null;
  const accumulatedHours = data?.accumulatedHours || null;

  const formatDate = (dateStr: string): string => {
    const date = new Date(dateStr + 'T00:00:00');
    return date.toLocaleDateString('pt-BR', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const formatMonth = (monthStr: string): string => {
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

  const getProgressPercentage = (current: number, goal: number): number => {
    if (goal === 0) return 0;
    return Math.min((current / goal) * 100, 100);
  };

  const getProgressBarColor = (percentage: number): string => {
    if (percentage >= 100) return 'bg-green-500';
    if (percentage >= 75) return 'bg-blue-500';
    if (percentage >= 50) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  if (loading) {
    return (
      <div className="space-y-6">
        {}
        <div className="bg-gray-800 rounded-lg shadow-lg p-6 border border-gray-700">
          <div className="animate-pulse">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6">
              <div className="h-8 bg-gray-700 rounded w-48 mb-4 sm:mb-0"></div>
              <div className="h-10 bg-gray-700 rounded w-32"></div>
            </div>
            <div className="text-center">
              <div className="h-6 bg-gray-700 rounded w-32 mx-auto mb-2"></div>
              <div className="h-12 bg-gray-700 rounded w-20 mx-auto mb-4"></div>
              <div className="h-5 bg-gray-700 rounded w-24 mx-auto"></div>
            </div>
          </div>
        </div>
        <div className="bg-gray-800 rounded-lg shadow-lg p-6 border border-gray-700">
          <div className="animate-pulse">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6">
              <div className="h-8 bg-gray-700 rounded w-48 mb-4 sm:mb-0"></div>
              <div className="h-10 bg-gray-700 rounded w-32"></div>
            </div>
            <div className="text-center mb-6">
              <div className="h-6 bg-gray-700 rounded w-32 mx-auto mb-2"></div>
              <div className="h-12 bg-gray-700 rounded w-20 mx-auto mb-2"></div>
              <div className="h-5 bg-gray-700 rounded w-32 mx-auto"></div>
            </div>
            <div className="space-y-4">
              <div className="h-6 bg-gray-700 rounded"></div>
              <div className="h-4 bg-gray-700 rounded"></div>
              <div className="h-6 bg-gray-700 rounded"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {}
      <div className="bg-gray-800 rounded-lg shadow-lg p-6 border border-gray-700">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6">
          <h2 className="text-2xl font-bold text-white mb-4 sm:mb-0">Estatísticas do Dia</h2>
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="px-3 py-2 bg-gray-700 border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-400 text-white"
            disabled={loading}
          />
        </div>

        <div className="text-center">
          <p className="text-sm text-gray-400 mb-2">{formatDate(selectedDate)}</p>
          <div className="text-4xl font-bold text-blue-400 mb-4">
            {dailyStats ? timeUtils.formatHours(dailyStats.totalHours) : '0h'}
          </div>
          <p className="text-gray-400">
            {dailyStats && dailyStats.records.length > 0
              ? `${dailyStats.records.length} registro${dailyStats.records.length > 1 ? 's' : ''}`
              : 'Nenhum registro'}
          </p>
        </div>

        {dailyStats && dailyStats.records.length > 0 && (
          <div className="mt-6 space-y-2">
            <h3 className="font-semibold text-white">Registros do dia:</h3>
            {dailyStats.records.map((record) => (
              <div
                key={record.id}
                className="flex justify-between items-center bg-gray-700 p-3 rounded-md border border-gray-600"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-white">{record.name}</span>
                    <span
                      className={`px-1 py-0.5 text-xs rounded ${
                        record.type === 'time_off'
                          ? 'bg-orange-900/50 text-orange-300'
                          : 'bg-blue-900/50 text-blue-300'
                      }`}
                    >
                      {record.type === 'time_off' ? '🏖️' : '🏢'}
                    </span>
                  </div>
                  <span className="text-gray-400">
                    {record.startTime} - {record.endTime}
                  </span>
                </div>
                <span
                  className={`font-semibold ${
                    record.type === 'time_off' ? 'text-orange-400' : 'text-blue-400'
                  }`}
                >
                  {record.type === 'time_off' ? '-' : ''}
                  {timeUtils.formatHours(record.totalHours)}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {}
      <div className="bg-gray-800 rounded-lg shadow-lg p-6 border border-gray-700">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6">
          <h2 className="text-2xl font-bold text-white mb-4 sm:mb-0">Estatísticas do Mês</h2>
          <input
            type="month"
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            className="px-3 py-2 bg-gray-700 border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-400 text-white"
            disabled={loading}
          />
        </div>

        <div className="text-center mb-6">
          <p className="text-sm text-gray-400 mb-2">{formatMonth(selectedMonth)}</p>
          <div className="text-4xl font-bold text-purple-400 mb-2">
            {monthlyStats ? timeUtils.formatHours(monthlyStats.totalHours) : '0h'}
          </div>
          <p className="text-gray-400">
            {monthlyStats && monthlyStats.workingDays > 0
              ? `${monthlyStats.workingDays} dia${monthlyStats.workingDays > 1 ? 's' : ''} trabalhado${monthlyStats.workingDays > 1 ? 's' : ''}`
              : 'Nenhum dia trabalhado'}
          </p>
        </div>

        {monthlyStats && monthlyStats.goal > 0 && (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-gray-300">Meta do mês:</span>
              <span className="font-semibold text-white">
                {timeUtils.formatHours(monthlyStats.goal)}
              </span>
            </div>

            <div className="w-full bg-gray-700 rounded-full h-4">
              <div
                className={`h-4 rounded-full transition-all duration-300 ${getProgressBarColor(
                  getProgressPercentage(monthlyStats.totalHours, monthlyStats.goal)
                )}`}
                style={{
                  width: `${getProgressPercentage(monthlyStats.totalHours, monthlyStats.goal)}%`,
                }}
              ></div>
            </div>

            <div className="flex justify-between text-sm text-gray-400">
              <span>
                {getProgressPercentage(monthlyStats.totalHours, monthlyStats.goal).toFixed(1)}% da
                meta
              </span>
              <span>Meta: {timeUtils.formatHours(monthlyStats.goal)}</span>
            </div>

            <div
              className={`text-center p-4 rounded-md border ${
                monthlyStats.isOverGoal
                  ? 'bg-green-900/30 border-green-700'
                  : 'bg-orange-900/30 border-orange-700'
              }`}
            >
              <p
                className={`font-semibold ${
                  monthlyStats.isOverGoal ? 'text-green-300' : 'text-orange-300'
                }`}
              >
                {monthlyStats.isOverGoal ? (
                  <>
                    🎉 Meta atingida! Você passou {timeUtils.formatHours(monthlyStats.difference)}
                  </>
                ) : (
                  <>
                    📊 Faltam {timeUtils.formatHours(monthlyStats.difference)} para atingir a meta
                  </>
                )}
              </p>
            </div>
          </div>
        )}

        {(!monthlyStats || monthlyStats.goal === 0) && (
          <div className="text-center p-4 bg-gray-700 border border-gray-600 rounded-md">
            <p className="text-gray-300">
              📋 Nenhuma meta definida para este mês.
              <br />
              Configure uma meta para acompanhar seu progresso!
            </p>
          </div>
        )}
      </div>

      {}
      <div className="bg-gray-800 rounded-lg shadow-lg p-6 border border-gray-700">
        <h2 className="text-2xl font-bold text-white mb-6">💰 Banco de Horas Extras Acumuladas</h2>

        {accumulatedHours && (
          <>
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
          </>
        )}
      </div>
    </div>
  );
}
