'use client';

import { useState, useMemo } from 'react';
import AdminLayout from '@/components/AdminLayout';
import { AIReport } from '@/types';
import MarkdownRenderer from '@/components/MarkdownRenderer';
import { useAIReports, useDeleteAIReport } from '@/hooks/useQueries';

export default function AdminReportsPage() {
  const [selectedReport, setSelectedReport] = useState<AIReport | null>(null);
  const [filterUserName, setFilterUserName] = useState('');

  const { data: reports = [], isLoading } = useAIReports();
  const deleteReport = useDeleteAIReport();

  const filteredReports = useMemo(() => {
    if (!filterUserName.trim()) return reports;

    const searchLower = filterUserName.toLowerCase();
    return reports.filter((r) => {
      const userName = (r.userName || '').toLowerCase();
      const userEmail = (r.userEmail || '').toLowerCase();
      return userName.includes(searchLower) || userEmail.includes(searchLower);
    });
  }, [reports, filterUserName]);

  const getMonthName = (monthStr: string) => {
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

  const handleDeleteReport = async (reportId: string, reportMonth: string, userName?: string) => {
    const confirmed = window.confirm(
      `Tem certeza que deseja excluir o relatório de ${getMonthName(reportMonth)} do usuário ${userName || 'N/A'}?\n\nEsta ação não pode ser desfeita.`
    );

    if (!confirmed) return;

    try {
      await deleteReport.mutateAsync(reportId);
      setSelectedReport(null);
      alert('✅ Relatório excluído com sucesso!');
    } catch (error: any) {
      alert(`❌ Erro ao excluir relatório: ${error.message}`);
    }
  };

  return (
    <AdminLayout loading={isLoading}>
      <div className="glass-panel p-6 mb-6 fade-in-up">
        <div className="flex items-center justify-between">
          <div>
            <span className="font-mono text-[9px] text-white/25 uppercase tracking-widest block mb-1">
              AI // REPORTS
            </span>
            <h1 className="text-2xl font-bold text-white">🤖 Relatórios da IA</h1>
            <p className="text-sm text-white/60 mt-1">
              Histórico de relatórios gerados pelo Google Gemini
            </p>
          </div>
        </div>
      </div>

      {/* Filtros */}
      <div className="glass-panel p-4 mb-6 fade-in-up stagger-1">
        <div>
          <label className="block text-sm font-medium text-neutral-300 mb-2">
            Filtrar por nome ou email do usuário
          </label>
          <input
            type="text"
            value={filterUserName}
            onChange={(e) => setFilterUserName(e.target.value)}
            placeholder="Digite o nome ou email do usuário..."
            className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-white placeholder:text-white/30"
          />
        </div>
      </div>

      {/* Lista de Relatórios */}
      <div className="glass-panel p-6 fade-in-up stagger-2">
        <div className="mb-4">
          <h2 className="text-xl font-bold text-white">
            Relatórios ({filteredReports.length})
          </h2>
        </div>

        {filteredReports.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">📊</div>
            <p className="text-white/60">
              {filterUserName ? 'Nenhum relatório encontrado para este usuário' : 'Nenhum relatório encontrado'}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredReports.map((report) => (
              <div
                key={report.id}
                className="bg-white/5 border border-white/10 rounded-lg p-4 hover:bg-white/10 transition-all"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-bold text-white">
                        {getMonthName(report.month)}
                      </h3>
                      <span className="px-2 py-1 bg-purple-600/20 border border-purple-500/30 text-purple-300 text-xs rounded">
                        {report.userName || report.userEmail || 'Usuário'}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-3">
                      <div>
                        <p className="text-xs text-white/50">Horas Trabalhadas</p>
                        <p className="text-sm font-bold text-blue-400">
                          {report.stats.totalWorkHours.toFixed(1)}h
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-white/50">Meta Mensal</p>
                        <p className="text-sm font-bold text-purple-400">
                          {report.stats.monthlyGoal.toFixed(1)}h
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-white/50">Diferença</p>
                        <p
                          className={`text-sm font-bold ${
                            report.stats.goalDifference >= 0 ? 'text-green-400' : 'text-red-400'
                          }`}
                        >
                          {report.stats.goalDifference > 0 ? '+' : ''}
                          {report.stats.goalDifference.toFixed(1)}h
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-white/50">Registros</p>
                        <p className="text-sm font-bold text-white">
                          {report.stats.recordsCount}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-4 text-xs text-white/50">
                      <span>📅 {new Date(report.createdAt).toLocaleString('pt-BR')}</span>
                      <span>👤 {report.generatedByName}</span>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={() => setSelectedReport(report)}
                      className="px-3 py-1 bg-blue-600/20 hover:bg-blue-600/30 border border-blue-500/30 text-blue-300 text-sm rounded-lg transition-colors"
                    >
                      Ver Relatório
                    </button>
                    <button
                      onClick={() => handleDeleteReport(report.id, report.month, report.userName)}
                      disabled={deleteReport.isPending}
                      className="px-3 py-1 bg-red-600/20 hover:bg-red-600/30 border border-red-500/30 text-red-300 text-sm rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {deleteReport.isPending ? '⏳' : '🗑️'}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal de Visualização */}
      {selectedReport && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-[#1a1a1a] border border-white/10 rounded-xl max-w-4xl w-full max-h-[90vh] overflow-hidden shadow-2xl">
            <div className="border-b border-white/10 p-6 bg-linear-to-r from-purple-600/10 to-blue-600/10">
              <div className="flex items-center justify-between">
                <div>
                  <span className="font-mono text-[9px] text-white/25 uppercase tracking-widest block mb-1">
                    AI // REPORT // {selectedReport.month}
                  </span>
                  <h2 className="text-2xl font-bold text-white">
                    📊 {getMonthName(selectedReport.month)}
                  </h2>
                  <p className="text-sm text-white/60 mt-1">
                    {selectedReport.userName || selectedReport.userEmail || 'Usuário'} • Gerado por {selectedReport.generatedByName} em{' '}
                    {new Date(selectedReport.createdAt).toLocaleString('pt-BR')}
                  </p>
                </div>
                <button
                  onClick={() => setSelectedReport(null)}
                  className="text-white/60 hover:text-white transition-colors p-2 hover:bg-white/10 rounded-lg"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              </div>
            </div>

            <div className="p-6 overflow-y-auto max-h-[calc(90vh-200px)]">
              <div className="bg-white/5 border border-white/10 rounded-lg p-6">
                <MarkdownRenderer content={selectedReport.reportContent} />
              </div>
            </div>

            <div className="border-t border-white/10 p-4 bg-white/5">
              <div className="flex justify-between">
                <button
                  onClick={() => handleDeleteReport(selectedReport.id, selectedReport.month, selectedReport.userName)}
                  disabled={deleteReport.isPending}
                  className="px-4 py-2 bg-red-600/20 hover:bg-red-600/30 border border-red-500/30 text-red-300 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {deleteReport.isPending ? '⏳ Excluindo...' : '🗑️ Excluir Relatório'}
                </button>
                <button
                  onClick={() => setSelectedReport(null)}
                  className="px-4 py-2 bg-white/10 hover:bg-white/20 border border-white/10 text-white rounded-lg transition-colors"
                >
                  Fechar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
