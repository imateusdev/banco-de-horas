'use client';

import { useState, useMemo } from 'react';
import { timeUtils } from '@/lib/calculations';
import { TimeRecord } from '@/types';
import { useTimeRecords, useUpdateTimeRecord, useDeleteTimeRecord } from '@/hooks/useQueries';

interface TimeRecordsListProps {
  onRecordUpdated?: () => void;
  userId?: string;
}

export default function TimeRecordsList({ onRecordUpdated, userId }: TimeRecordsListProps) {
  const [filterMonth, setFilterMonth] = useState('');
  const [editingRecord, setEditingRecord] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Partial<TimeRecord>>({});

  const { data: records = [], isLoading } = useTimeRecords(userId || '');
  const updateRecord = useUpdateTimeRecord();
  const deleteRecord = useDeleteTimeRecord();

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
            onChange={(e) => setFilterMonth(e.target.value)}
            className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-white transition-all duration-300 hover:bg-white/10"
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

        <div className="flex items-end">
          <button
            onClick={() => {
              setFilterMonth('');
            }}
            className="px-4 py-2 bg-white/5 border border-white/10 rounded-md hover:bg-white/10 text-white transition-all"
          >
            Limpar Filtros
          </button>
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
                      <label className="block text-sm font-medium text-neutral-300 mb-1">Nome</label>
                      <input
                        type="text"
                        value={editForm.name || ''}
                        onChange={(e) => setEditForm((prev) => ({ ...prev, name: e.target.value }))}
                        className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-white transition-all duration-300 hover:bg-white/10"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-neutral-300 mb-1">Data</label>
                      <input
                        type="date"
                        value={editForm.date || ''}
                        onChange={(e) => setEditForm((prev) => ({ ...prev, date: e.target.value }))}
                        className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-white transition-all duration-300 hover:bg-white/10"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-neutral-300 mb-1">Tipo</label>
                      <select
                        value={editForm.type || 'work'}
                        onChange={(e) =>
                          setEditForm((prev) => ({
                            ...prev,
                            type: e.target.value as 'work' | 'time_off',
                          }))
                        }
                        className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-white transition-all duration-300 hover:bg-white/10"
                      >
                        <option value="work">🏢 Trabalho</option>
                        <option value="time_off">🏖️ Folga</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-neutral-300 mb-1">Início</label>
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
                      <label className="block text-sm font-medium text-neutral-300 mb-1">Fim</label>
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

                  {editForm.startTime && editForm.endTime && (
                    <div className="bg-blue-900/30 border border-blue-700 rounded-md p-2">
                      <p className="text-blue-300 text-sm">
                        <strong>Horas calculadas:</strong>{' '}
                        {timeUtils.formatHours(
                          timeUtils.calculateHoursDifference(editForm.startTime, editForm.endTime)
                        )}
                      </p>
                    </div>
                  )}

                  <div className="flex space-x-2">
                    <button
                      onClick={saveEdit}
                      className="px-4 py-2 bg-gradient-to-r from-green-600 to-green-500 hover:from-green-700 hover:to-green-600 text-white rounded-md shadow-lg shadow-green-500/20 hover:shadow-green-500/40 transition-all"
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

                  <div className="flex justify-between items-center mt-4">
                    <p className="text-xs text-neutral-500">
                      Criado em: {formatDateTime(record.createdAt)}
                    </p>
                    <div className="flex space-x-2">
                      <button
                        onClick={() => startEditing(record)}
                        className="px-3 py-1 text-sm bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600 text-white rounded-md shadow-lg shadow-blue-500/20 hover:shadow-blue-500/40 transition-all"
                      >
                        Editar
                      </button>
                      <button
                        onClick={() => handleDelete(record.id)}
                        className="px-3 py-1 text-sm bg-gradient-to-r from-red-600 to-red-500 hover:from-red-700 hover:to-red-600 text-white rounded-md shadow-lg shadow-red-500/20 hover:shadow-red-500/40 transition-all"
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
