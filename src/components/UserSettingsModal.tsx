'use client';

import { useState, useEffect } from 'react';
import { useUserSettings, useSaveUserSettings } from '@/hooks/useQueries';
import { auth } from '@/lib/firebase/config';

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
  githubUsername: string | null;
  githubProjectId: string | null;
  githubBranch: string | null;
}

interface GitHubProject {
  id: string;
  name: string;
  repo: string;
}

export default function UserSettingsModal({
  isOpen,
  onClose,
  userId,
  onSettingsUpdated,
}: UserSettingsModalProps) {
  const { data, isLoading } = useUserSettings(userId);
  const saveSettings = useSaveUserSettings();

  const [settings, setSettings] = useState<UserSettings>({
    defaultStartTime: null,
    defaultEndTime: null,
    workingDays: 'weekdays',
    githubUsername: null,
    githubProjectId: null,
    githubBranch: null,
  });
  const [error, setError] = useState('');
  const [githubProjects, setGithubProjects] = useState<GitHubProject[]>([]);

  useEffect(() => {
    if (data) {
      setSettings({
        defaultStartTime: data.defaultStartTime,
        defaultEndTime: data.defaultEndTime,
        workingDays: data.workingDays,
        githubUsername: data.githubUsername,
        githubProjectId: data.githubProjectId,
        githubBranch: data.githubBranch,
      });
    }
  }, [data]);

  useEffect(() => {
    if (isOpen) {
      loadGitHubProjects();
    }
  }, [isOpen]);

  const loadGitHubProjects = async () => {
    try {
      const user = auth.currentUser;
      if (!user) return;
      const token = await user.getIdToken();

      const response = await fetch('/api/github/projects', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setGithubProjects(data.projects || []);
      }
    } catch (error) {
      console.error('Error loading GitHub projects:', error);
    }
  };

  const handleSave = async () => {
    setError('');

    try {
      await saveSettings.mutateAsync({
        userId,
        defaultStartTime: settings.defaultStartTime || null,
        defaultEndTime: settings.defaultEndTime || null,
        workingDays: settings.workingDays,
        githubUsername: settings.githubUsername || null,
        githubProjectId: settings.githubProjectId || null,
        githubBranch: settings.githubBranch || null,
      });
      onSettingsUpdated?.();
      onClose();
    } catch (error) {
      console.error('Error saving user settings:', error);
      setError(error instanceof Error ? error.message : 'Erro ao salvar configurações');
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
      <div className="bg-neutral-800 rounded-lg shadow-2xl border border-neutral-700 w-full max-w-md max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-white">⚙️ Configurações de Usuário</h2>
            <button
              onClick={onClose}
              className="text-neutral-400 hover:text-white transition-colors text-2xl"
            >
              ×
            </button>
          </div>

          {isLoading || saveSettings.isPending ? (
            <div className="text-center py-8">
              <div className="text-neutral-400">Carregando configurações...</div>
            </div>
          ) : (
            <div className="space-y-6">
              {}
              <div>
                <h3 className="text-lg font-semibold text-white mb-4">🕐 Horários Padrão</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-neutral-300 mb-2">
                      Entrada
                    </label>
                    <input
                      type="time"
                      value={settings.defaultStartTime || ''}
                      onChange={(e) =>
                        handleInputChange('defaultStartTime', e.target.value || null)
                      }
                      className="w-full px-3 py-2 bg-neutral-700 border border-neutral-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-400 text-white"
                      placeholder="09:00"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-neutral-300 mb-2">Saída</label>
                    <input
                      type="time"
                      value={settings.defaultEndTime || ''}
                      onChange={(e) => handleInputChange('defaultEndTime', e.target.value || null)}
                      className="w-full px-3 py-2 bg-neutral-700 border border-neutral-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-400 text-white"
                      placeholder="18:00"
                    />
                  </div>
                </div>
                <p className="text-xs text-neutral-400 mt-2">
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
                        className="text-blue-600 bg-neutral-700 border-neutral-600 focus:ring-blue-500"
                      />
                      <span className="text-neutral-300">{getWorkingDaysLabel(option)}</span>
                    </label>
                  ))}
                </div>
                <p className="text-xs text-neutral-400 mt-2">
                  O campo de data mostrará apenas os dias correspondentes
                </p>
              </div>

              {/* GitHub Integration */}
              <div>
                <h3 className="text-lg font-semibold text-white mb-4">🐙 Integração com GitHub</h3>
                <div className="space-y-4">
                  {githubProjects.length > 1 && (
                    <div>
                      <label className="block text-sm font-medium text-neutral-300 mb-2">
                        Projeto
                      </label>
                      <select
                        value={settings.githubProjectId || ''}
                        onChange={(e) =>
                          handleInputChange('githubProjectId', e.target.value || null)
                        }
                        className="w-full px-3 py-2 bg-neutral-700 border border-neutral-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-400 text-white [&>option]:bg-[#1a1a1a] [&>option]:text-white"
                      >
                        <option value="">Selecione um projeto</option>
                        {githubProjects.map((project) => (
                          <option key={project.id} value={project.id}>
                            {project.name} ({project.repo})
                          </option>
                        ))}
                      </select>
                      <p className="text-xs text-neutral-400 mt-1">
                        Selecione qual projeto você trabalha
                      </p>
                    </div>
                  )}
                  <div>
                    <label className="block text-sm font-medium text-neutral-300 mb-2">
                      Username do GitHub (opcional)
                    </label>
                    <input
                      type="text"
                      value={settings.githubUsername || ''}
                      onChange={(e) => handleInputChange('githubUsername', e.target.value || null)}
                      className="w-full px-3 py-2 bg-neutral-700 border border-neutral-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-400 text-white"
                      placeholder="seu-usuario"
                    />
                    <p className="text-xs text-neutral-400 mt-2">
                      Configure seu username para importar commits automaticamente nas descrições
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-neutral-300 mb-2">
                      Branch monitorada (opcional)
                    </label>
                    <input
                      type="text"
                      value={settings.githubBranch || ''}
                      onChange={(e) => handleInputChange('githubBranch', e.target.value || null)}
                      className="w-full px-3 py-2 bg-neutral-700 border border-neutral-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-400 text-white"
                      placeholder="main"
                    />
                    <p className="text-xs text-neutral-400 mt-2">
                      Filtra commits de uma branch específica. Se vazio, busca commits de todas as
                      branches
                    </p>
                  </div>
                </div>
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
                  disabled={saveSettings.isPending}
                  className={`flex-1 py-2 px-4 rounded-md font-medium transition-colors ${
                    saveSettings.isPending
                      ? 'bg-neutral-600 cursor-not-allowed'
                      : 'bg-linear-to-r from-green-600 to-green-500 hover:from-green-700 hover:to-green-600 text-white shadow-lg shadow-green-500/20 hover:shadow-green-500/40'
                  }`}
                >
                  {saveSettings.isPending ? 'Salvando...' : 'Salvar Configurações'}
                </button>
                <button
                  onClick={onClose}
                  disabled={saveSettings.isPending}
                  className="px-4 py-2 bg-neutral-600 text-white rounded-md hover:bg-neutral-700 transition-colors"
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
