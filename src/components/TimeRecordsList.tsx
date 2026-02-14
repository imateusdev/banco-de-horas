'use client';

import { useState, useEffect, useCallback } from 'react';
import { apiClient } from '@/lib/api-client';
import { timeUtils } from '@/lib/calculations';
import { TimeRecord } from '@/types';

interface TimeRecordsListProps {
  refreshTrigger?: number;
  onRecordUpdated?: () => void;
  userId?: string;
}

export default function TimeRecordsList({ refreshTrigger, onRecordUpdated, userId }: TimeRecordsListProps) {
  const [records, setRecords] = useState<TimeRecord[]>([]);
  const [filteredRecords, setFilteredRecords] = useState<TimeRecord[]>([]);
  const [filterMonth, setFilterMonth] = useState('');
  const [editingRecord, setEditingRecord] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Partial<TimeRecord>>({});

  const loadRecords = useCallback(async () => {
    if (!userId) return;

    try {
      const allRecords = await apiClient.getTimeRecords(userId);
      // Ordenar por data mais recente primeiro
      allRecords.sort((a, b) => {
        const dateCompare = b.date.localeCompare(a.date);
        if (dateCompare !== 0) return dateCompare;
        return b.createdAt.localeCompare(a.createdAt);
      });

      setRecords(allRecords);
      setFilteredRecords(allRecords);
    } catch (error) {
      console.error('Error loading records:', error);
      setRecords([]);
      setFilteredRecords([]);
    }
  }, [userId]);

  useEffect(() => {
    loadRecords();
  }, [refreshTrigger, loadRecords]);

  useEffect(() => {
    let filtered = records;

    if (filterMonth) {
      filtered = filtered.filter(record =>
        record.date.startsWith(filterMonth)
      );
    }

    setFilteredRecords(filtered);
  }, [records, filterMonth]);

  const handleDelete = async (id: string) => {
    if (!userId) return;

    if (window.confirm('Tem certeza que deseja excluir este registro?')) {
      try {
        await apiClient.deleteTimeRecord(id, userId);
        await loadRecords();
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
    if (!editingRecord || !editForm.name || !editForm.startTime || !editForm.endTime) {
      return;
    }

    try {
      const updatedRecord = {
        ...editForm,
        totalHours: timeUtils.calculateHoursDifference(editForm.startTime!, editForm.endTime!),
      } as Partial<TimeRecord>;

      await apiClient.updateTimeRecord(editingRecord, updatedRecord);
      await loadRecords();
      onRecordUpdated?.();
      cancelEditing();
    } catch (error) {
      console.error('Error updating record:', error);
    }
  };

  const formatDate = (dateStr: string): string => {
    const date = new Date(dateStr + 'T00:00:00');
    return date.toLocaleDateString('pt-BR');
  };

  const formatDateWithWeekday = (dateStr: string): string => {
    const date = new Date(dateStr + 'T00:00:00');
    const weekdays = ['Domingo', 'Segunda-feira', 'Terça-feira', 'Quarta-feira', 'Quinta-feira', 'Sexta-feira', 'Sábado'];
    const weekday = weekdays[date.getDay()];
    const formattedDate = date.toLocaleDateString('pt-BR');
    return `${formattedDate} - ${weekday}`;
  };

  const formatDateTime = (dateTimeStr: string): string => {
    const date = new Date(dateTimeStr);
    return date.toLocaleString('pt-BR');
  };

  const getUniqueNames = (): string[] => {
    const names = [...new Set(records.map(record => record.name))];
    return names.sort();
  };

  const getUniqueMonths = (): string[] => {
    const months = [...new Set(records.map(record => record.date.slice(0, 7)))];
    return months.sort().reverse();
  };

  const getTotalHours = (): number => {
    return filteredRecords.reduce((sum, record) => sum + record.totalHours, 0);
  };

  return (
    <div className="bg-gray-800 rounded-lg shadow-lg p-6 border border-gray-700">
      <h2 className="text-2xl font-bold text-white mb-6">Histórico de Registros</h2>

      {/* Filtros */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Filtrar por mês
          </label>
          <select
            value={filterMonth}
            onChange={(e) => setFilterMonth(e.target.value)}
            className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-400 text-white"
          >
            <option value="">Todos os meses</option>
            {getUniqueMonths().map(month => {
              const [year, monthNum] = month.split('-');
              const monthNames = [
                'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
                'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
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
            className="px-4 py-2 text-gray-300 border border-gray-600 rounded-md hover:bg-gray-700 transition-colors"
          >
            Limpar Filtros
          </button>
        </div>
      </div>

      {/* Resumo */}
      <div className="bg-gray-700 rounded-md p-4 mb-6 border border-gray-600">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-center">
          <div>
            <p className="text-2xl font-bold text-blue-400">{filteredRecords.length}</p>
            <p className="text-sm text-gray-400">Registros</p>
          </div>
          <div>
            <p className="text-2xl font-bold text-purple-400">{timeUtils.formatHours(getTotalHours())}</p>
            <p className="text-sm text-gray-400">Total de Horas</p>
          </div>
        </div>
      </div>

      {/* Lista de Registros */}
      {filteredRecords.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-400 text-lg">
            {records.length === 0 ? 'Nenhum registro encontrado' : 'Nenhum registro corresponde aos filtros'}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredRecords.map((record) => (
            <div key={record.id} className="border border-gray-600 rounded-lg p-4 bg-gray-700">
              {editingRecord === record.id ? (
                // Modo de edição
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-1">Nome</label>
                      <input
                        type="text"
                        value={editForm.name || ''}
                        onChange={(e) => setEditForm(prev => ({ ...prev, name: e.target.value }))}
                        className="w-full px-3 py-2 bg-gray-600 border border-gray-500 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-400 text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-1">Data</label>
                      <input
                        type="date"
                        value={editForm.date || ''}
                        onChange={(e) => setEditForm(prev => ({ ...prev, date: e.target.value }))}
                        className="w-full px-3 py-2 bg-gray-600 border border-gray-500 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-400 text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-1">Tipo</label>
                      <select
                        value={editForm.type || 'work'}
                        onChange={(e) => setEditForm(prev => ({ ...prev, type: e.target.value as 'work' | 'time_off' }))}
                        className="w-full px-3 py-2 bg-gray-600 border border-gray-500 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-400 text-white"
                      >
                        <option value="work">🏢 Trabalho</option>
                        <option value="time_off">🏖️ Folga</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-1">Início</label>
                      <input
                        type="time"
                        value={editForm.startTime || ''}
                        onChange={(e) => setEditForm(prev => ({ ...prev, startTime: e.target.value }))}
                        className="w-full px-3 py-2 bg-gray-600 border border-gray-500 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-400 text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-1">Fim</label>
                      <input
                        type="time"
                        value={editForm.endTime || ''}
                        onChange={(e) => setEditForm(prev => ({ ...prev, endTime: e.target.value }))}
                        className="w-full px-3 py-2 bg-gray-600 border border-gray-500 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-400 text-white"
                      />
                    </div>
                  </div>
                  
                  {editForm.startTime && editForm.endTime && (
                    <div className="bg-blue-900/30 border border-blue-700 rounded-md p-2">
                      <p className="text-blue-300 text-sm">
                        <strong>Horas calculadas:</strong> {timeUtils.formatHours(
                          timeUtils.calculateHoursDifference(editForm.startTime, editForm.endTime)
                        )}
                      </p>
                    </div>
                  )}

                  <div className="flex space-x-2">
                    <button
                      onClick={saveEdit}
                      className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
                    >
                      Salvar
                    </button>
                    <button
                      onClick={cancelEditing}
                      className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors"
                    >
                      Cancelar
                    </button>
                  </div>
                </div>
              ) : (
                // Modo de visualização
                <div>
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                    <div className="mb-2 sm:mb-0">
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold text-lg text-white">{record.name}</h3>
                        <span className={`px-2 py-1 text-xs rounded-full ${
                          record.type === 'time_off' 
                            ? 'bg-orange-900/50 text-orange-300 border border-orange-700' 
                            : 'bg-blue-900/50 text-blue-300 border border-blue-700'
                        }`}>
                          {record.type === 'time_off' ? '🏖️ Folga' : '🏢 Trabalho'}
                        </span>
                      </div>
                      <p className="text-gray-400">{formatDateWithWeekday(record.date)}</p>
                    </div>
                    <div className="text-right">
                      <p className={`text-2xl font-bold ${
                        record.type === 'time_off' ? 'text-orange-400' : 'text-blue-400'
                      }`}>
                        {record.type === 'time_off' ? '-' : ''}{timeUtils.formatHours(record.totalHours)}
                      </p>
                      <p className="text-sm text-gray-400">
                        {record.startTime} - {record.endTime}
                      </p>
                    </div>
                  </div>

                  <div className="flex justify-between items-center mt-4">
                    <p className="text-xs text-gray-500">
                      Criado em: {formatDateTime(record.createdAt)}
                    </p>
                    <div className="flex space-x-2">
                      <button
                        onClick={() => startEditing(record)}
                        className="px-3 py-1 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                      >
                        Editar
                      </button>
                      <button
                        onClick={() => handleDelete(record.id)}
                        className="px-3 py-1 text-sm bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
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
    </div>
  );
}
