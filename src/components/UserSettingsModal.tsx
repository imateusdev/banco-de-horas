'use client';

import { useState, useEffect } from 'react';

interface UserSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  userId: string;
  onSettingsUpdated?: () => void;
}

interface UserSettings {
  defaultStartTime: string | null;
  defaultEndTime: string | null;
  workingDays: 'weekdays' | 'all' | 'weekends';
}

export default function UserSettingsModal({
  isOpen,
  onClose,
  userId,
  onSettingsUpdated,
}: UserSettingsModalProps) {
  const [settings, setSettings] = useState<UserSettings>({
    defaultStartTime: null,
    defaultEndTime: null,
    workingDays: 'weekdays',
  });
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen) {
      loadSettings();
    }
  }, [isOpen, userId]);

  const loadSettings = async () => {
    setIsLoading(true);
    setError('');
    try {
      const response = await fetch(`/api/user-settings?userId=${userId}`);
      if (response.ok) {
        const data = await response.json();
        setSettings({
          defaultStartTime: data.defaultStartTime,
          defaultEndTime: data.defaultEndTime,
          workingDays: data.workingDays,
        });
      } else {
        throw new Error('Erro ao carregar configurações');
      }
    } catch (error) {
      console.error('Error loading user settings:', error);
      setError('Erro ao carregar configurações');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    setError('');

    try {
      const response = await fetch('/api/user-settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          defaultStartTime: settings.defaultStartTime || null,
          defaultEndTime: settings.defaultEndTime || null,
          workingDays: settings.workingDays,
        }),
      });

      if (response.ok) {
        onSettingsUpdated?.();
        onClose();
      } else {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Erro ao salvar configurações');
      }
    } catch (error) {
      console.error('Error saving user settings:', error);
      setError(error instanceof Error ? error.message : 'Erro ao salvar configurações');
    } finally {
      setIsSaving(false);
    }
  };

  const handleInputChange = (field: keyof UserSettings, value: string | null) => {
    setSettings((prev) => ({ ...prev, [field]: value }));
    setError('');
  };

  const getWorkingDaysLabel = (value: string) => {
    switch (value) {
      case 'weekdays':
        return '🗓️ Apenas dias de semana (Segunda a Sexta)';
      case 'all':
        return '📅 Todos os dias da semana';
      case 'weekends':
        return '🏖️ Apenas finais de semana (Sábado e Domingo)';
      default:
        return value;
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-800 rounded-lg shadow-2xl border border-gray-700 w-full max-w-md max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-white">⚙️ Configurações de Usuário</h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-white transition-colors text-2xl"
            >
              ×
            </button>
          </div>

          {isLoading ? (
            <div className="text-center py-8">
              <div className="text-gray-400">Carregando configurações...</div>
            </div>
          ) : (
            <div className="space-y-6">
              {}
              <div>
                <h3 className="text-lg font-semibold text-white mb-4">🕐 Horários Padrão</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Entrada</label>
                    <input
                      type="time"
                      value={settings.defaultStartTime || ''}
                      onChange={(e) =>
                        handleInputChange('defaultStartTime', e.target.value || null)
                      }
                      className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-400 text-white"
                      placeholder="09:00"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Saída</label>
                    <input
                      type="time"
                      value={settings.defaultEndTime || ''}
                      onChange={(e) => handleInputChange('defaultEndTime', e.target.value || null)}
                      className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-400 text-white"
                      placeholder="18:00"
                    />
                  </div>
                </div>
                <p className="text-xs text-gray-400 mt-2">
                  Estes horários serão pré-preenchidos no formulário de registro
                </p>
              </div>

              {}
              <div>
                <h3 className="text-lg font-semibold text-white mb-4">📅 Dias de Trabalho</h3>
                <div className="space-y-2">
                  {['weekdays', 'all', 'weekends'].map((option) => (
                    <label key={option} className="flex items-center space-x-3 cursor-pointer">
                      <input
                        type="radio"
                        value={option}
                        checked={settings.workingDays === option}
                        onChange={(e) =>
                          handleInputChange(
                            'workingDays',
                            e.target.value as UserSettings['workingDays']
                          )
                        }
                        className="text-blue-600 bg-gray-700 border-gray-600 focus:ring-blue-500"
                      />
                      <span className="text-gray-300">{getWorkingDaysLabel(option)}</span>
                    </label>
                  ))}
                </div>
                <p className="text-xs text-gray-400 mt-2">
                  O campo de data mostrará apenas os dias correspondentes
                </p>
              </div>

              {error && (
                <div className="bg-red-900/50 border border-red-700 rounded-md p-3">
                  <p className="text-red-300 text-sm">{error}</p>
                </div>
              )}

              {}
              <div className="flex space-x-3">
                <button
                  onClick={handleSave}
                  disabled={isSaving}
                  className={`flex-1 py-2 px-4 rounded-md font-medium transition-colors ${
                    isSaving
                      ? 'bg-gray-600 cursor-not-allowed'
                      : 'bg-green-600 hover:bg-green-700 text-white'
                  }`}
                >
                  {isSaving ? 'Salvando...' : 'Salvar Configurações'}
                </button>
                <button
                  onClick={onClose}
                  disabled={isSaving}
                  className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors"
                >
                  Cancelar
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
