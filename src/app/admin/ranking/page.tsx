'use client';

import { useUsersRanking } from '@/hooks/useQueries';
import { useState, useMemo } from 'react';
import AdminLayout from '@/components/AdminLayout';

export default function AdminRankingPage() {
  // Get current month for ranking
  const currentMonth = useMemo(() => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    return `${year}-${month}`;
  }, []);

  const [selectedMonth, setSelectedMonth] = useState(currentMonth);
  const { data: rankings = [], isLoading } = useUsersRanking(selectedMonth);

  // Generate month options (last 12 months)
  const monthOptions = useMemo(() => {
    const options = [];
    const now = new Date();
    for (let i = 0; i < 12; i++) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const value = `${year}-${month}`;
      const label = date.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
      options.push({ value, label });
    }
    return options;
  }, []);

  return (
    <AdminLayout loading={isLoading}>
      <div className="text-center mb-8 fade-in-up">
        <span className="font-mono text-[9px] text-white/25 uppercase tracking-widest block mb-2">
          RANKING // USERS
        </span>
        <h2 className="text-3xl font-bold text-white mb-2">🏆 Ranking de Horas</h2>
        <p className="text-white/60">Usuários com mais horas trabalhadas no mês</p>
      </div>

      {/* Month Selector */}
      <div className="glass-panel p-6 mb-8 fade-in-up">
        <div className="max-w-md mx-auto">
          <label className="block text-sm font-medium text-white/70 mb-2">
            Selecione o Mês
          </label>
          <select
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300 hover:bg-white/10 [&>option]:bg-[#1a1a1a] [&>option]:text-white"
          >
            {monthOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Ranking */}
      {rankings.length === 0 && !isLoading ? (
        <div className="glass-panel p-12 text-center fade-in-up">
          <div className="text-6xl mb-4">📊</div>
          <h3 className="text-2xl font-bold text-white mb-2">Nenhum Registro</h3>
          <p className="text-white/60">
            Não há registros de horas para este mês ainda.
          </p>
        </div>
      ) : (
        <div className="glass-panel p-6 fade-in-up stagger-1">
          <div className="mb-6">
            <span className="font-mono text-[9px] text-white/25 uppercase tracking-widest block mb-2">
              TOP // PERFORMERS
            </span>
            <h3 className="text-xl font-bold text-white">
              Top {rankings.length} Usuários
            </h3>
          </div>

          <div className="space-y-3">
            {rankings.map((ranking: any, index: number) => {
              const maxHours = rankings[0]?.netHours || 1;
              const percentage = (ranking.netHours / maxHours) * 100;

              return (
                <div
                  key={ranking.userId}
                  className="relative p-5 bg-white/5 border border-white/10 rounded-lg hover:bg-white/10 transition-all duration-300 overflow-hidden group"
                >
                  {/* Progress Bar Background */}
                  <div
                    className="absolute inset-0 bg-linear-to-r from-blue-500/10 to-purple-500/10 transition-all duration-500 group-hover:from-blue-500/15 group-hover:to-purple-500/15"
                    style={{ width: `${percentage}%` }}
                  />

                  <div className="relative flex items-center justify-between">
                    <div className="flex items-center gap-4 flex-1">
                      {/* Position Badge */}
                      <div className="flex items-center justify-center w-12 h-12 rounded-full bg-white/10 shrink-0">
                        <span className="text-xl font-bold">
                          {index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : `#${index + 1}`}
                        </span>
                      </div>

                      {/* User Info */}
                      <div className="flex-1 min-w-0">
                        <p className="text-white font-semibold text-lg truncate">
                          {ranking.displayName}
                        </p>
                        <p className="text-white/50 text-sm truncate">{ranking.email}</p>
                      </div>
                    </div>

                    {/* Stats */}
                    <div className="flex items-center gap-6 shrink-0">
                      {/* Work Hours */}
                      <div className="text-right">
                        <p className="text-xs text-white/50">Trabalho</p>
                        <p className="text-lg font-bold text-green-400">
                          +{ranking.totalWorkHours.toFixed(1)}h
                        </p>
                      </div>

                      {/* Time Off */}
                      {ranking.totalTimeOffHours > 0 && (
                        <div className="text-right">
                          <p className="text-xs text-white/50">Folgas</p>
                          <p className="text-lg font-bold text-red-400">
                            -{ranking.totalTimeOffHours.toFixed(1)}h
                          </p>
                        </div>
                      )}

                      {/* Monthly Goal */}
                      <div className="text-right">
                        <p className="text-xs text-white/50">Meta</p>
                        <p className="text-lg font-semibold text-purple-400">
                          {ranking.monthlyGoal}h
                        </p>
                      </div>

                      {/* Net Hours */}
                      <div className="text-right bg-white/5 px-4 py-2 rounded-lg">
                        <p className="text-xs text-white/50">Total Líquido</p>
                        <p className="text-2xl font-bold text-white">
                          {ranking.netHours.toFixed(1)}h
                        </p>
                      </div>

                      {/* Difference from Goal */}
                      <div className="text-right">
                        <p className="text-xs text-white/50">Diferença</p>
                        <p
                          className={`text-lg font-bold ${
                            ranking.isOverGoal ? 'text-green-400' : 'text-red-400'
                          }`}
                        >
                          {ranking.isOverGoal ? '+' : ''}
                          {(ranking.difference || 0).toFixed(1)}h
                        </p>
                      </div>

                      {/* Records Count */}
                      <div className="text-right">
                        <p className="text-xs text-white/50">Registros</p>
                        <p className="text-lg font-semibold text-blue-400">
                          {ranking.recordsCount}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Summary Stats */}
          {rankings.length > 0 && (
            <div className="mt-8 pt-6 border-t border-white/10">
              <div className="grid grid-cols-3 gap-6 text-center">
                <div>
                  <p className="text-sm text-white/50 mb-1">Total de Usuários</p>
                  <p className="text-2xl font-bold text-white">{rankings.length}</p>
                </div>
                <div>
                  <p className="text-sm text-white/50 mb-1">Maior Registro</p>
                  <p className="text-2xl font-bold text-green-400">
                    {rankings[0]?.netHours.toFixed(1)}h
                  </p>
                </div>
                <div>
                  <p className="text-sm text-white/50 mb-1">Média Geral</p>
                  <p className="text-2xl font-bold text-blue-400">
                    {(
                      rankings.reduce((acc: number, r: any) => acc + r.netHours, 0) /
                      rankings.length
                    ).toFixed(1)}
                    h
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </AdminLayout>
  );
}
