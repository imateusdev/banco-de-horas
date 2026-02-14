'use client';

import { useState, useMemo } from 'react';
import { timeUtils } from '@/lib/calculations';
import { TimeRecord } from '@/types';
import { useTimeRecords, useUpdateTimeRecord, useDeleteTimeRecord } from '@/hooks/useQueries';
import MarkdownRenderer from './MarkdownRenderer';
import { auth } from '@/lib/firebase/config';

interface TimeRecordsListProps {
  onRecordUpdated?: () => void;
  userId?: string;
  showGenerateReportButton?: boolean;
  onFilterMonthChange?: (month: string) => void;
}

export default function TimeRecordsList({
  onRecordUpdated,
  userId,
  showGenerateReportButton = false,
  onFilterMonthChange,
}: TimeRecordsListProps) {
  const [filterMonth, setFilterMonth] = useState('');
  const [editingRecord, setEditingRecord] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Partial<TimeRecord>>({});
  const [expandedDescriptions, setExpandedDescriptions] = useState<Set<string>>(new Set());
  const [generatingReport, setGeneratingReport] = useState(false);

  const { data: records = [], isLoading } = useTimeRecords(userId || '');
  const updateRecord = useUpdateTimeRecord();
  const deleteRecord = useDeleteTimeRecord();

  const handleGenerateReport = async () => {
    if (!filterMonth || !userId) {
      alert('Por favor, selecione um mês antes de gerar o relatório.');
      return;
    }

    const confirmed = window.confirm(
      `Deseja gerar um relatório com IA para o mês ${filterMonth}?\n\nIsso pode levar alguns segundos.`
    );

    if (!confirmed) return;

    setGeneratingReport(true);
    try {
      const user = auth.currentUser;
      if (!user) throw new Error('User not authenticated');
      const token = await user.getIdToken();

      const response = await fetch('/api/admin/generate-report', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ userId, month: filterMonth }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Erro ao gerar relatório');
      }

      const data = await response.json();

      if (data.isExisting) {
        alert('✅ Relatório já existe! Você pode visualizá-lo na página de Relatórios da IA.');
      } else {
        alert(
          '✅ Relatório gerado com sucesso! Você pode visualizá-lo na página de Relatórios da IA.'
        );
      }
    } catch (error: any) {
      alert(`❌ Erro ao gerar relatório: ${error.message}`);
    } finally {
      setGeneratingReport(false);
    }
  };

  const sortedRecords = useMemo(() => {
    return [...records].sort((a, b) => {
      const dateCompare = b.date.localeCompare(a.date);
      if (dateCompare !== 0) return dateCompare;
      return b.createdAt.localeCompare(a.createdAt);
    });
  }, [records]);

  const filteredRecords = useMemo(() => {
    if (!filterMonth) return sortedRecords;
    return sortedRecords.filter((record) => record.date.startsWith(filterMonth));
  }, [sortedRecords, filterMonth]);

  const handleDelete = async (id: string) => {
    if (!userId) return;

    if (window.confirm('Tem certeza que deseja excluir este registro?')) {
      try {
        await deleteRecord.mutateAsync({ id, userId });
        onRecordUpdated?.();
      } catch (error) {
        console.error('Error deleting record:', error);
      }
    }
  };

  const startEditing = (record: TimeRecord) => {
    setEditingRecord(record.id);
    setEditForm(record);
  };

  const cancelEditing = () => {
    setEditingRecord(null);
    setEditForm({});
  };

  const saveEdit = async () => {
    if (!editingRecord || !editForm.name || !editForm.startTime || !editForm.endTime || !userId) {
      return;
    }

    try {
      const updatedRecord = {
        ...editForm,
        totalHours: timeUtils.calculateHoursDifference(editForm.startTime!, editForm.endTime!),
      } as Partial<TimeRecord>;

      await updateRecord.mutateAsync({ id: editingRecord, updates: updatedRecord, userId });
      onRecordUpdated?.();
      cancelEditing();
    } catch (error) {
      console.error('Error updating record:', error);
    }
  };

  const formatDateWithWeekday = (dateStr: string): string => {
    const date = new Date(dateStr + 'T00:00:00');
    const weekdays = [
      'Domingo',
      'Segunda-feira',
      'Terça-feira',
      'Quarta-feira',
      'Quinta-feira',
      'Sexta-feira',
      'Sábado',
    ];
    const weekday = weekdays[date.getDay()];
    const formattedDate = date.toLocaleDateString('pt-BR');
    return `${formattedDate} - ${weekday}`;
  };

  const formatDateTime = (dateTimeStr: string): string => {
    const date = new Date(dateTimeStr);
    return date.toLocaleString('pt-BR');
  };

  const getUniqueMonths = (): string[] => {
    const months = [...new Set(sortedRecords.map((record) => record.date.slice(0, 7)))];
    return months.sort().reverse();
  };

  const getTotalHours = (): number => {
    return filteredRecords.reduce((sum, record) => sum + record.totalHours, 0);
  };

  const toggleDescription = (recordId: string) => {
    setExpandedDescriptions((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(recordId)) {
        newSet.delete(recordId);
      } else {
        newSet.add(recordId);
      }
      return newSet;
    });
  };

  return (
    <div className="glass-panel p-6 fade-in-up">
      <div className="mb-6">
        <span className="font-mono text-[9px] text-white/25 uppercase tracking-widest block mb-2">
          HISTORY // RECORDS
        </span>
        <h2 className="text-2xl font-bold text-white">Histórico de Registros</h2>
      </div>

      {}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <div>
          <label className="block text-sm font-medium text-neutral-300 mb-2">Filtrar por mês</label>
          <select
            value={filterMonth}
            onChange={(e) => {
              setFilterMonth(e.target.value);
              onFilterMonthChange?.(e.target.value);
            }}
            className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-white transition-all duration-300 hover:bg-white/10 [&>option]:bg-[#1a1a1a] [&>option]:text-white"
          >
            <option value="">Todos os meses</option>
            {getUniqueMonths().map((month) => {
              const [year, monthNum] = month.split('-');
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
              const monthName = monthNames[parseInt(monthNum) - 1];
              return (
                <option key={month} value={month}>
                  {monthName} {year}
                </option>
              );
            })}
          </select>
        </div>

        <div className="flex items-end gap-3">
          <button
            onClick={() => {
              setFilterMonth('');
              onFilterMonthChange?.('');
            }}
            className="px-4 py-2 bg-white/5 border border-white/10 rounded-md hover:bg-white/10 text-white transition-all"
          >
            Limpar Filtros
          </button>
          {showGenerateReportButton && (
            <button
              onClick={handleGenerateReport}
              disabled={!filterMonth || generatingReport}
              className="px-4 py-2 bg-linear-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white rounded-lg font-medium shadow-lg shadow-purple-500/20 hover:shadow-purple-500/40 transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none"
              title={
                !filterMonth ? 'Selecione um mês para gerar o relatório' : 'Gerar relatório com IA'
              }
            >
              {generatingReport ? '⏳ Gerando...' : '🤖 Gerar Relatório com IA'}
            </button>
          )}
        </div>
      </div>

      {isLoading && (
        <div className="text-center py-8">
          <p className="text-neutral-400">Carregando registros...</p>
        </div>
      )}

      {!isLoading && (
        <>
          <div className="bg-white/5 rounded-md p-4 mb-6 border border-white/10">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-center">
              <div>
                <p className="text-2xl font-bold text-blue-400">{filteredRecords.length}</p>
                <p className="text-sm text-neutral-400">Registros</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-purple-400">
                  {timeUtils.formatHours(getTotalHours())}
                </p>
                <p className="text-sm text-neutral-400">Total de Horas</p>
              </div>
            </div>
          </div>

          {}
          {filteredRecords.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-neutral-400 text-lg">
                {records.length === 0
                  ? 'Nenhum registro encontrado'
                  : 'Nenhum registro corresponde aos filtros'}
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredRecords.map((record) => (
                <div key={record.id} className="border border-white/10 rounded-lg p-4 bg-white/5">
                  {editingRecord === record.id ? (
                    <div className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-neutral-300 mb-1">
                            Nome
                          </label>
                          <input
                            type="text"
                            value={editForm.name || ''}
                            onChange={(e) =>
                              setEditForm((prev) => ({ ...prev, name: e.target.value }))
                            }
                            className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-white transition-all duration-300 hover:bg-white/10"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-neutral-300 mb-1">
                            Data
                          </label>
                          <input
                            type="date"
                            value={editForm.date || ''}
                            onChange={(e) =>
                              setEditForm((prev) => ({ ...prev, date: e.target.value }))
                            }
                            className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-white transition-all duration-300 hover:bg-white/10"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-neutral-300 mb-1">
                            Tipo
                          </label>
                          <select
                            value={editForm.type || 'work'}
                            onChange={(e) =>
                              setEditForm((prev) => ({
                                ...prev,
                                type: e.target.value as 'work' | 'time_off',
                              }))
                            }
                            className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-white transition-all duration-300 hover:bg-white/10 [&>option]:bg-[#1a1a1a] [&>option]:text-white"
                          >
                            <option value="work">🏢 Trabalho</option>
                            <option value="time_off">🏖️ Folga</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-neutral-300 mb-1">
                            Início
                          </label>
                          <input
                            type="time"
                            value={editForm.startTime || ''}
                            onChange={(e) =>
                              setEditForm((prev) => ({ ...prev, startTime: e.target.value }))
                            }
                            className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-white transition-all duration-300 hover:bg-white/10"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-neutral-300 mb-1">
                            Fim
                          </label>
                          <input
                            type="time"
                            value={editForm.endTime || ''}
                            onChange={(e) =>
                              setEditForm((prev) => ({ ...prev, endTime: e.target.value }))
                            }
                            className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-white transition-all duration-300 hover:bg-white/10"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-neutral-300 mb-1">
                          Descrição (suporta Markdown)
                        </label>
                        <textarea
                          value={editForm.description || ''}
                          onChange={(e) =>
                            setEditForm((prev) => ({ ...prev, description: e.target.value }))
                          }
                          rows={12}
                          className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-white transition-all duration-300 hover:bg-white/10 resize-y font-mono text-sm"
                          placeholder="Descrição das atividades realizadas..."
                        />
                      </div>

                      {editForm.startTime && editForm.endTime && (
                        <div className="bg-blue-900/30 border border-blue-700 rounded-md p-2">
                          <p className="text-blue-300 text-sm">
                            <strong>Horas calculadas:</strong>{' '}
                            {timeUtils.formatHours(
                              timeUtils.calculateHoursDifference(
                                editForm.startTime,
                                editForm.endTime
                              )
                            )}
                          </p>
                        </div>
                      )}

                      <div className="flex space-x-2">
                        <button
                          onClick={saveEdit}
                          className="px-4 py-2 bg-linear-to-r from-green-600 to-green-500 hover:from-green-700 hover:to-green-600 text-white rounded-md shadow-lg shadow-green-500/20 hover:shadow-green-500/40 transition-all"
                        >
                          Salvar
                        </button>
                        <button
                          onClick={cancelEditing}
                          className="px-4 py-2 bg-white/5 border border-white/10 text-white rounded-md hover:bg-white/10 transition-all"
                        >
                          Cancelar
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div>
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                        <div className="mb-2 sm:mb-0">
                          <div className="flex items-center gap-2">
                            <h3 className="font-semibold text-lg text-white">{record.name}</h3>
                            <span
                              className={`px-2 py-1 text-xs rounded-full ${
                                record.type === 'time_off'
                                  ? 'bg-orange-900/50 text-orange-300 border border-orange-700'
                                  : 'bg-blue-900/50 text-blue-300 border border-blue-700'
                              }`}
                            >
                              {record.type === 'time_off' ? '🏖️ Folga' : '🏢 Trabalho'}
                            </span>
                          </div>
                          <p className="text-neutral-400">{formatDateWithWeekday(record.date)}</p>
                        </div>
                        <div className="text-right">
                          <p
                            className={`text-2xl font-bold ${
                              record.type === 'time_off' ? 'text-orange-400' : 'text-blue-400'
                            }`}
                          >
                            {record.type === 'time_off' ? '-' : ''}
                            {timeUtils.formatHours(record.totalHours)}
                          </p>
                          <p className="text-sm text-neutral-400">
                            {record.startTime} - {record.endTime}
                          </p>
                        </div>
                      </div>

                      {record.description && (
                        <div className="mt-3 p-4 bg-white/5 border border-white/10 rounded-md">
                          <div className="flex items-center justify-between mb-2">
                            <p className="text-xs text-white/50 font-semibold">📝 Descrição:</p>
                            <button
                              onClick={() => toggleDescription(record.id)}
                              className="text-xs text-blue-400 hover:text-blue-300 transition-colors flex items-center gap-1"
                            >
                              {expandedDescriptions.has(record.id) ? (
                                <>
                                  <span>Recolher</span>
                                  <span>▲</span>
                                </>
                              ) : (
                                <>
                                  <span>Expandir</span>
                                  <span>▼</span>
                                </>
                              )}
                            </button>
                          </div>
                          <div
                            className={`text-sm overflow-hidden transition-all duration-300 ${
                              expandedDescriptions.has(record.id) ? 'max-h-none' : 'max-h-20'
                            }`}
                          >
                            <MarkdownRenderer content={record.description} />
                          </div>
                          {!expandedDescriptions.has(record.id) &&
                            record.description.length > 100 && (
                              <div className="absolute bottom-0 left-0 right-0 h-8 bg-linear-to-t from-white/5 to-transparent pointer-events-none" />
                            )}
                        </div>
                      )}

                      <div className="flex justify-between items-center mt-4">
                        <p className="text-xs text-neutral-500">
                          Criado em: {formatDateTime(record.createdAt)}
                        </p>
                        <div className="flex space-x-2">
                          <button
                            onClick={() => startEditing(record)}
                            className="px-3 py-1 text-sm bg-linear-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600 text-white rounded-md shadow-lg shadow-blue-500/20 hover:shadow-blue-500/40 transition-all"
                          >
                            Editar
                          </button>
                          <button
                            onClick={() => handleDelete(record.id)}
                            className="px-3 py-1 text-sm bg-linear-to-r from-red-600 to-red-500 hover:from-red-700 hover:to-red-600 text-white rounded-md shadow-lg shadow-red-500/20 hover:shadow-red-500/40 transition-all"
                          >
                            Excluir
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
