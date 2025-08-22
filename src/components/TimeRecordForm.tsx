'use client';

import { useState } from 'react';
import { clientStorageUtils } from '@/lib/client-storage';
import { timeUtils } from '@/lib/calculations';

interface TimeRecordFormProps {
  onRecordAdded?: () => void;
  userId?: string;
  userName?: string;
}

export default function TimeRecordForm({ onRecordAdded, userId, userName }: TimeRecordFormProps) {
  const [formData, setFormData] = useState({
    date: timeUtils.getCurrentDate(),
    startTime: '',
    endTime: '',
    type: 'work' as 'work' | 'time_off',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.date) {
      newErrors.date = 'Data é obrigatória';
    }

    if (!formData.startTime) {
      newErrors.startTime = 'Horário de início é obrigatório';
    } else if (!timeUtils.isValidTimeFormat(formData.startTime)) {
      newErrors.startTime = 'Formato inválido (use HH:MM)';
    }

    if (!formData.endTime) {
      newErrors.endTime = 'Horário de término é obrigatório';
    } else if (!timeUtils.isValidTimeFormat(formData.endTime)) {
      newErrors.endTime = 'Formato inválido (use HH:MM)';
    }

    if (formData.startTime && formData.endTime && !timeUtils.isValidTimeRange(formData.startTime, formData.endTime)) {
      newErrors.endTime = 'Horário de término deve ser diferente do início';
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
      const record = timeUtils.createTimeRecord(
        userId || '',
        userName || 'Usuário',
        formData.date,
        formData.startTime,
        formData.endTime,
        formData.type
      );

      await clientStorageUtils.saveTimeRecord(record);

      // Se for folga, criar uma conversão automática para deduzir do banco de horas
      if (record.type === 'time_off') {
        try {
          const conversion = {
            id: timeUtils.generateId(),
            userId: userId || '',
            hours: record.totalHours,
            amount: 0,
            type: 'time_off' as 'money' | 'time_off',
            date: record.date,
            createdAt: new Date().toISOString(),
          };
          await clientStorageUtils.saveHourConversion(conversion);
        } catch (error) {
          console.error('Error saving hour conversion for time off:', error);
          // Não interromper o fluxo se houver erro na conversão
        }
      }

      // Reset form
      setFormData({
        date: timeUtils.getCurrentDate(),
        startTime: '',
        endTime: '',
        type: 'work' as 'work' | 'time_off',
      });

      onRecordAdded?.();
    } catch (error) {
      console.error('Error saving record:', error);
      setErrors({ submit: 'Erro ao salvar registro. Tente novamente.' });
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

  return (
    <div className="bg-gray-800 rounded-lg shadow-lg p-6 mb-6 border border-gray-700">
      <h2 className="text-2xl font-bold text-white mb-4">Registrar Horas</h2>
      
      {/* Indicador do usuário */}
      <div className="bg-blue-900/30 border border-blue-700 rounded-md p-3 mb-6">
        <p className="text-blue-300 text-sm">
          <span className="font-semibold">👤 Registrando para:</span> {userName || 'Usuário'}
        </p>
      </div>
      
      <form onSubmit={handleSubmit} className="space-y-4">

        <div>
          <label htmlFor="date" className="block text-sm font-medium text-gray-300 mb-2">
            Data
          </label>
          <input
            type="date"
            id="date"
            value={formData.date}
            onChange={(e) => handleInputChange('date', e.target.value)}
            className={`w-full px-3 py-2 bg-gray-700 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-400 text-white ${
              errors.date ? 'border-red-500' : 'border-gray-600'
            }`}
          />
          {errors.date && <p className="text-red-400 text-sm mt-1">{errors.date}</p>}
        </div>

        <div>
          <label htmlFor="type" className="block text-sm font-medium text-gray-300 mb-2">
            Tipo de Registro
          </label>
          <select
            id="type"
            value={formData.type}
            onChange={(e) => handleInputChange('type', e.target.value)}
            className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-400 text-white"
          >
            <option value="work">🏢 Trabalho Normal</option>
            <option value="time_off">🏖️ Folga (desconta horas extras)</option>
          </select>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="startTime" className="block text-sm font-medium text-gray-300 mb-2">
              Horário de Início
            </label>
            <input
              type="time"
              id="startTime"
              value={formData.startTime}
              onChange={(e) => handleInputChange('startTime', e.target.value)}
              className={`w-full px-3 py-2 bg-gray-700 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-400 text-white ${
                errors.startTime ? 'border-red-500' : 'border-gray-600'
              }`}
            />
            {errors.startTime && <p className="text-red-400 text-sm mt-1">{errors.startTime}</p>}
          </div>

          <div>
            <label htmlFor="endTime" className="block text-sm font-medium text-gray-300 mb-2">
              Horário de Término
            </label>
            <input
              type="time"
              id="endTime"
              value={formData.endTime}
              onChange={(e) => handleInputChange('endTime', e.target.value)}
              className={`w-full px-3 py-2 bg-gray-700 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-400 text-white ${
                errors.endTime ? 'border-red-500' : 'border-gray-600'
              }`}
            />
            {errors.endTime && <p className="text-red-400 text-sm mt-1">{errors.endTime}</p>}
          </div>
        </div>

        {formData.startTime && formData.endTime && timeUtils.isValidTimeRange(formData.startTime, formData.endTime) && (
          <div className="bg-blue-900/50 border border-blue-700 rounded-md p-3">
            <p className="text-blue-300 text-sm">
              <strong>Horas calculadas:</strong> {timeUtils.formatHours(
                timeUtils.calculateHoursDifference(formData.startTime, formData.endTime)
              )}
            </p>
          </div>
        )}

        <button
          type="submit"
          disabled={isSubmitting}
          className={`w-full py-2 px-4 rounded-md font-medium transition-colors ${
            isSubmitting
              ? 'bg-gray-400 cursor-not-allowed'
              : 'bg-blue-600 hover:bg-blue-700 text-white'
          }`}
        >
          {isSubmitting ? 'Salvando...' : 'Registrar Horas'}
        </button>
      </form>
    </div>
  );
}
