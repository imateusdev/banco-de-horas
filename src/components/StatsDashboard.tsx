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

  const { data, isLoading: loading } = useDashboardData(userId || '', selectedDate, selectedMonth);

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
        <div className="glass-panel p-6 fade-in-up">
          <div className="animate-pulse">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6">
              <div className="h-8 bg-white/5 rounded w-48 mb-4 sm:mb-0"></div>
              <div className="h-10 bg-white/5 rounded w-32"></div>
            </div>
            <div className="text-center">
              <div className="h-6 bg-white/5 rounded w-32 mx-auto mb-2"></div>
              <div className="h-12 bg-white/5 rounded w-20 mx-auto mb-4"></div>
              <div className="h-5 bg-white/5 rounded w-24 mx-auto"></div>
            </div>
          </div>
        </div>
        <div className="glass-panel p-6 fade-in-up stagger-1">
          <div className="animate-pulse">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6">
              <div className="h-8 bg-white/5 rounded w-48 mb-4 sm:mb-0"></div>
              <div className="h-10 bg-white/5 rounded w-32"></div>
            </div>
            <div className="text-center mb-6">
              <div className="h-6 bg-white/5 rounded w-32 mx-auto mb-2"></div>
              <div className="h-12 bg-white/5 rounded w-20 mx-auto mb-2"></div>
              <div className="h-5 bg-white/5 rounded w-32 mx-auto"></div>
            </div>
            <div className="space-y-4">
              <div className="h-6 bg-white/5 rounded"></div>
              <div className="h-4 bg-white/5 rounded"></div>
              <div className="h-6 bg-white/5 rounded"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {}
      <div className="glass-panel p-6 fade-in-up">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6">
          <div>
            <span className="font-mono text-[9px] text-white/25 uppercase tracking-widest block mb-2">
              001 // DAILY STATS
            </span>
            <h2 className="text-2xl font-bold text-white">Estatísticas do Dia</h2>
          </div>
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="px-4 py-3 bg-white/5 border border-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-white transition-all duration-300 hover:bg-white/10"
            disabled={loading}
          />
        </div>

        <div className="text-center">
          <p className="text-sm text-neutral-400 mb-2">{formatDate(selectedDate)}</p>
          <div className="text-4xl font-bold text-blue-400 mb-4">
            {dailyStats ? timeUtils.formatHours(dailyStats.totalHours) : '0h'}
          </div>
          <p className="text-neutral-400">
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
                className="flex justify-between items-center bg-white/5 p-3 rounded-md border border-white/10"
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
                  <span className="text-neutral-400">
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
      <div className="glass-panel p-6 fade-in-up stagger-1">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6">
          <div>
            <span className="font-mono text-[9px] text-white/25 uppercase tracking-widest block mb-2">
              002 // MONTHLY STATS
            </span>
            <h2 className="text-2xl font-bold text-white">Estatísticas do Mês</h2>
          </div>
          <input
            type="month"
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            className="px-4 py-3 bg-white/5 border border-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-white transition-all duration-300 hover:bg-white/10"
            disabled={loading}
          />
        </div>

        <div className="text-center mb-6">
          <p className="text-sm text-neutral-400 mb-2">{formatMonth(selectedMonth)}</p>
          <div className="text-4xl font-bold text-purple-400 mb-2">
            {monthlyStats ? timeUtils.formatHours(monthlyStats.totalHours) : '0h'}
          </div>
          <p className="text-neutral-400">
            {monthlyStats && monthlyStats.workingDays > 0
              ? `${monthlyStats.workingDays} dia${monthlyStats.workingDays > 1 ? 's' : ''} trabalhado${monthlyStats.workingDays > 1 ? 's' : ''}`
              : 'Nenhum dia trabalhado'}
          </p>
        </div>

        {monthlyStats && monthlyStats.goal > 0 && (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-neutral-300">Meta do mês:</span>
              <span className="font-semibold text-white">
                {timeUtils.formatHours(monthlyStats.goal)}
              </span>
            </div>

            <div className="w-full bg-white/5 rounded-full h-4">
              <div
                className={`h-4 rounded-full transition-all duration-300 ${getProgressBarColor(
                  getProgressPercentage(monthlyStats.totalHours, monthlyStats.goal)
                )}`}
                style={{
                  width: `${getProgressPercentage(monthlyStats.totalHours, monthlyStats.goal)}%`,
                }}
              ></div>
            </div>

            <div className="flex justify-between text-sm text-neutral-400">
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
          <div className="text-center p-4 bg-white/5 border border-white/10 rounded-md">
            <p className="text-neutral-300">
              📋 Nenhuma meta definida para este mês.
              <br />
              Configure uma meta para acompanhar seu progresso!
            </p>
          </div>
        )}
      </div>

      {}
      <div className="glass-panel p-6 fade-in-up stagger-2">
        <div className="mb-6">
          <span className="font-mono text-[9px] text-white/25 uppercase tracking-widest block mb-2">
            003 // ACCUMULATED HOURS
          </span>
          <h2 className="text-2xl font-bold text-white">Banco de Horas Extras Acumuladas</h2>
        </div>

        {accumulatedHours && (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {}
              <div className="bg-white/5 border border-white/10 rounded-lg p-4 text-center hover:bg-white/10 transition-all duration-300">
                <div className="text-3xl font-bold text-green-400 mb-2">
                  {timeUtils.formatHours(accumulatedHours.totalExtraHours)}
                </div>
                <p className="text-sm text-white/70 font-medium">Total Acumulado</p>
                <p className="text-xs text-white/40 mt-1">Soma de todos os meses</p>
              </div>

              {}
              <div className="bg-white/5 border border-white/10 rounded-lg p-4 text-center hover:bg-white/10 transition-all duration-300">
                <div className="text-3xl font-bold text-blue-400 mb-2">
                  {timeUtils.formatHours(accumulatedHours.availableHours)}
                </div>
                <p className="text-sm text-white/70 font-medium">Disponível</p>
                <p className="text-xs text-white/40 mt-1">Para converter ou usar</p>
              </div>

              {}
              <div className="bg-white/5 border border-white/10 rounded-lg p-4 text-center hover:bg-white/10 transition-all duration-300">
                <div className="text-3xl font-bold text-yellow-400 mb-2">
                  {timeUtils.formatHours(accumulatedHours.convertedToMoney)}
                </div>
                <p className="text-sm text-white/70 font-medium">Convertido em R$</p>
                <p className="text-xs text-white/40 mt-1">Já recebido</p>
              </div>

              {}
              <div className="bg-white/5 border border-white/10 rounded-lg p-4 text-center hover:bg-white/10 transition-all duration-300">
                <div className="text-3xl font-bold text-purple-400 mb-2">
                  {timeUtils.formatHours(accumulatedHours.usedForTimeOff)}
                </div>
                <p className="text-sm text-white/70 font-medium">Usado em Folgas</p>
                <p className="text-xs text-white/40 mt-1">Já descontado</p>
              </div>
            </div>

            {}
            <div className="mt-6 p-4 bg-white/5 border border-white/10 rounded-md">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                <div className="mb-2 sm:mb-0">
                  <p className="text-white font-medium">
                    📈 Saldo de Horas Extras:{' '}
                    <span className="text-green-400">
                      {timeUtils.formatHours(accumulatedHours.availableHours)}
                    </span>
                  </p>
                  <p className="text-neutral-400 text-sm">
                    {accumulatedHours.availableHours > 0
                      ? 'Você pode converter essas horas em dinheiro ou reservar para folgas.'
                      : 'Continue trabalhando para acumular mais horas extras!'}
                  </p>
                </div>

                {accumulatedHours.totalExtraHours > 0 && (
                  <div className="text-right">
                    <p className="text-sm text-neutral-400">Percentual disponível:</p>
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
              <div className="mt-6 text-center p-4 bg-white/5 border border-white/10 rounded-md">
                <p className="text-neutral-300 text-lg">🎯 Ainda não há horas extras acumuladas</p>
                <p className="text-neutral-400 text-sm mt-2">
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
