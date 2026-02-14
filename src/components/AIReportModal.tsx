'use client';

import { useState } from 'react';
import MarkdownRenderer from './MarkdownRenderer';

interface AIReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  userId: string;
  userName: string;
  filterMonth: string;
}

export default function AIReportModal({
  isOpen,
  onClose,
  userId,
  userName,
  filterMonth,
}: AIReportModalProps) {
  const [report, setReport] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [reportInfo, setReportInfo] = useState<{
    isExisting: boolean;
    generatedAt: string;
    reportId: string;
  } | null>(null);

  const generateReport = async (forceRegenerate = false) => {
    if (!filterMonth) {
      setError('Por favor, selecione um mês antes de gerar o relatório.');
      return;
    }

    setIsLoading(true);
    setError(null);
    if (forceRegenerate) {
      setReport(null);
      setReportInfo(null);
    }

    try {
      const response = await fetch('/api/admin/generate-report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, month: filterMonth, forceRegenerate }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Erro ao gerar relatório');
      }

      const data = await response.json();
      setReport(data.report);
      setReportInfo({
        isExisting: data.isExisting,
        generatedAt: data.generatedAt,
        reportId: data.reportId,
      });
    } catch (err: any) {
      setError(err.message || 'Erro ao gerar relatório');
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    setReport(null);
    setError(null);
    setReportInfo(null);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-[#1a1a1a] border border-white/10 rounded-xl max-w-4xl w-full max-h-[90vh] overflow-hidden shadow-2xl">
        <div className="border-b border-white/10 p-6 bg-linear-to-r from-purple-600/10 to-blue-600/10">
          <div className="flex items-center justify-between">
            <div>
              <span className="font-mono text-[9px] text-white/25 uppercase tracking-widest block mb-1">
                AI // REPORT
              </span>
              <h2 className="text-2xl font-bold text-white">
                🤖 Relatório Inteligente - {userName}
              </h2>
              {filterMonth && (
                <p className="text-sm text-white/60 mt-1">
                  Período: {filterMonth}
                </p>
              )}
            </div>
            <button
              onClick={handleClose}
              className="text-white/60 hover:text-white transition-colors p-2 hover:bg-white/10 rounded-lg"
            >
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
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
          {!report && !isLoading && !error && (
            <div className="text-center py-12">
              <div className="text-6xl mb-4">🤖</div>
              <h3 className="text-xl font-bold text-white mb-2">
                Gerar Relatório com IA
              </h3>
              <p className="text-white/60 mb-6 max-w-md mx-auto">
                Use a inteligência artificial do Google Gemini para analisar o desempenho do
                colaborador e gerar um relatório detalhado com insights e recomendações.
              </p>
              {!filterMonth && (
                <div className="bg-orange-900/20 border border-orange-700/50 rounded-lg p-4 mb-6 max-w-md mx-auto">
                  <p className="text-orange-300 text-sm">
                    ⚠️ Selecione um mês no filtro de histórico antes de gerar o relatório
                  </p>
                </div>
              )}
              <button
                onClick={() => generateReport()}
                disabled={!filterMonth}
                className="px-6 py-3 bg-linear-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white rounded-lg font-medium shadow-lg shadow-purple-500/20 hover:shadow-purple-500/40 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                ✨ Gerar Relatório com IA
              </button>
            </div>
          )}

          {isLoading && (
            <div className="text-center py-12">
              <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500 mb-4"></div>
              <p className="text-white/80 font-medium">Gerando relatório...</p>
              <p className="text-white/50 text-sm mt-2">
                A IA está analisando os dados do colaborador
              </p>
            </div>
          )}

          {error && (
            <div className="bg-red-900/20 border border-red-700/50 rounded-lg p-4">
              <p className="text-red-300">❌ {error}</p>
              <button
                onClick={() => generateReport()}
                className="mt-4 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm transition-colors"
              >
                Tentar Novamente
              </button>
            </div>
          )}

          {report && (
            <div className="space-y-4">
              <div className="flex items-center justify-between mb-4">
                <div className="flex flex-col gap-1">
                  <div className="flex items-center gap-2 text-sm text-green-400">
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                      <path
                        fillRule="evenodd"
                        d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                        clipRule="evenodd"
                      />
                    </svg>
                    {reportInfo?.isExisting ? 'Relatório salvo' : 'Relatório gerado e salvo'}
                  </div>
                  {reportInfo?.generatedAt && (
                    <p className="text-xs text-white/50 ml-7">
                      {reportInfo.isExisting ? 'Gerado' : 'Salvo'} em:{' '}
                      {new Date(reportInfo.generatedAt).toLocaleString('pt-BR')}
                    </p>
                  )}
                </div>
                <button
                  onClick={() => generateReport(true)}
                  className="px-3 py-1 bg-white/5 hover:bg-white/10 border border-white/10 text-white text-sm rounded-lg transition-colors"
                  title="Gerar um novo relatório substituindo o anterior"
                >
                  🔄 Gerar Novamente
                </button>
              </div>

              <div className="bg-white/5 border border-white/10 rounded-lg p-6">
                <MarkdownRenderer content={report} />
              </div>
            </div>
          )}
        </div>

        <div className="border-t border-white/10 p-4 bg-white/5">
          <div className="flex justify-end">
            <button
              onClick={handleClose}
              className="px-4 py-2 bg-white/10 hover:bg-white/20 border border-white/10 text-white rounded-lg transition-colors"
            >
              Fechar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
