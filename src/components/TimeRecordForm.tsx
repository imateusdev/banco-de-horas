'use client';

import { useState, useEffect } from 'react';
import { timeUtils } from '@/lib/calculations';
import { useUserSettings, useCreateTimeRecord, useCreateHourConversion } from '@/hooks/useQueries';
import { HourConversion } from '@/types';
import UserSettingsModal from './UserSettingsModal';
import { auth } from '@/lib/firebase/config';

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
    description: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [isMultipleMode, setIsMultipleMode] = useState(false);
  const [multipleDays, setMultipleDays] = useState<
    Array<{
      date: string;
      startTime: string;
      endTime: string;
      type: 'work' | 'time_off';
    }>
  >([]);
  const { data: userSettings } = useUserSettings(userId || '');
  const createRecord = useCreateTimeRecord();
  const createConversion = useCreateHourConversion();
  const isSubmitting = createRecord.isPending || createConversion.isPending;
  const [loadingCommits, setLoadingCommits] = useState(false);

  useEffect(() => {
    if (userSettings) {
      if (userSettings.defaultStartTime && !formData.startTime) {
        setFormData((prev) => ({ ...prev, startTime: userSettings.defaultStartTime || '' }));
      }
      if (userSettings.defaultEndTime && !formData.endTime) {
        setFormData((prev) => ({ ...prev, endTime: userSettings.defaultEndTime || '' }));
      }
    }
  }, [userSettings]);

  const isDateAllowed = (dateStr: string): boolean => {
    if (!userSettings) {
      console.log('userSettings não carregadas ainda');
      return true;
    }

    const date = new Date(dateStr + 'T00:00:00');
    const dayOfWeek = date.getDay();

    console.log(
      `Verificando data ${dateStr}, dia da semana: ${dayOfWeek}, configuração: ${userSettings.workingDays}`
    );

    switch (userSettings.workingDays) {
      case 'weekdays':
        return dayOfWeek >= 1 && dayOfWeek <= 5;
      case 'weekends':
        return dayOfWeek === 0 || dayOfWeek === 6;
      case 'all':
      default:
        return true;
    }
  };

  const handleImportCommits = async () => {
    if (!userSettings?.githubUsername) {
      alert('⚠️ Configure seu username do GitHub nas configurações primeiro.');
      setIsSettingsModalOpen(true);
      return;
    }

    if (!formData.date) {
      alert('⚠️ Selecione uma data primeiro.');
      return;
    }

    setLoadingCommits(true);
    try {
      const user = auth.currentUser;
      if (!user) throw new Error('User not authenticated');
      const token = await user.getIdToken();

      const response = await fetch(`/api/github/commits?date=${formData.date}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Erro ao buscar commits');
      }

      const data = await response.json();

      if (data.count === 0) {
        alert(`📭 Nenhum commit encontrado para a data ${formData.date}.`);
        return;
      }

      // Adicionar os commits formatados no início ou final da descrição
      const currentDescription = formData.description.trim();
      const newDescription = currentDescription
        ? `${data.markdown}\n${currentDescription}`
        : data.markdown;

      setFormData((prev) => ({
        ...prev,
        description: newDescription,
      }));

      alert(`✅ ${data.count} commit(s) importado(s) com sucesso!`);
    } catch (error: any) {
      console.error('Error importing commits:', error);
      alert(`❌ Erro ao importar commits: ${error.message}`);
    } finally {
      setLoadingCommits(false);
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (isMultipleMode) {
      if (multipleDays.length === 0) {
        newErrors.submit = 'Adicione pelo menos um dia para registrar';
      } else {
        multipleDays.forEach((day, index) => {
          if (!day.date) {
            newErrors[`day_${index}_date`] = 'Data é obrigatória';
          } else if (!isDateAllowed(day.date)) {
            newErrors[`day_${index}_date`] = 'Data não permitida pelas suas configurações';
          }
          if (!day.startTime) {
            newErrors[`day_${index}_startTime`] = 'Horário de início obrigatório';
          }
          if (!day.endTime) {
            newErrors[`day_${index}_endTime`] = 'Horário de fim obrigatório';
          }
          if (
            day.startTime &&
            day.endTime &&
            !timeUtils.isValidTimeRange(day.startTime, day.endTime)
          ) {
            newErrors[`day_${index}_endTime`] = 'Horário inválido';
          }
        });
      }
    } else {
      if (!formData.date) {
        newErrors.date = 'Data é obrigatória';
      } else if (!isDateAllowed(formData.date)) {
        const workingDaysText =
          userSettings?.workingDays === 'weekdays'
            ? 'dias de semana'
            : userSettings?.workingDays === 'weekends'
              ? 'finais de semana'
              : 'todos os dias';
        newErrors.date = `Data não permitida. Você configurou para trabalhar apenas em ${workingDaysText}`;
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

      if (
        formData.startTime &&
        formData.endTime &&
        !timeUtils.isValidTimeRange(formData.startTime, formData.endTime)
      ) {
        newErrors.endTime = 'Horário de término deve ser diferente do início';
      }

      if (!formData.description || formData.description.trim().length === 0) {
        newErrors.description = 'Descrição é obrigatória';
      } else if (formData.description.trim().length < 10) {
        newErrors.description = 'Descrição deve ter pelo menos 10 caracteres';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    try {
      if (isMultipleMode) {
        const validDays = multipleDays.filter(
          (day) =>
            day.date &&
            day.startTime &&
            day.endTime &&
            timeUtils.isValidTimeRange(day.startTime, day.endTime) &&
            isDateAllowed(day.date)
        );

        for (const day of validDays) {
          const record = timeUtils.createTimeRecord(
            userId || '',
            userName || 'Usuário',
            day.date,
            day.startTime,
            day.endTime,
            day.type
          );

          await createRecord.mutateAsync(record);

          if (record.type === 'time_off') {
            const conversion = {
              id: timeUtils.generateId(),
              userId: userId || '',
              hours: record.totalHours,
              amount: 0,
              type: 'time_off' as 'money' | 'time_off',
              date: record.date,
              createdAt: new Date().toISOString(),
            } as HourConversion;

            await createConversion.mutateAsync(conversion);
          }
        }

        setMultipleDays([]);
      } else {
        const record = timeUtils.createTimeRecord(
          userId || '',
          userName || 'Usuário',
          formData.date,
          formData.startTime,
          formData.endTime,
          formData.type,
          formData.description
        );

        await createRecord.mutateAsync(record);

        if (record.type === 'time_off') {
          const conversion = {
            id: timeUtils.generateId(),
            userId: userId || '',
            hours: record.totalHours,
            amount: 0,
            type: 'time_off' as 'money' | 'time_off',
            date: record.date,
            createdAt: new Date().toISOString(),
          } as HourConversion;

          await createConversion.mutateAsync(conversion);
        }

        setFormData({
          date: timeUtils.getCurrentDate(),
          startTime: '',
          endTime: '',
          type: 'work' as 'work' | 'time_off',
          description: '',
        });
      }

      onRecordAdded?.();
    } catch (error) {
      console.error('Error saving record:', error);
      setErrors({ submit: 'Erro ao salvar registro. Tente novamente.' });
    }
  };

  const getWeekdayName = (dateStr: string): string => {
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
    return weekdays[date.getDay()];
  };

  const getDateRestrictions = (): { min?: string; max?: string } => {
    const today = new Date();
    const minDate = new Date(today);
    minDate.setDate(today.getDate() - 30);
    const maxDate = new Date(today);
    maxDate.setDate(today.getDate() + 30);

    return {
      min: minDate.toISOString().split('T')[0],
      max: maxDate.toISOString().split('T')[0],
    };
  };

  const isDateDisabled = (dateStr: string): boolean => {
    if (!userSettings) return false;
    return !isDateAllowed(dateStr);
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));

    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: '' }));
    }
  };

  return (
    <div className="glass-panel p-6 mb-6 fade-in-up">
      <div className="flex items-center justify-between mb-6">
        <div>
          <span className="font-mono text-[9px] text-white/25 uppercase tracking-widest block mb-2">
            REGISTER // TIME
          </span>
          <h2 className="text-2xl font-bold text-white">Registrar Horas</h2>
        </div>
        {userId && (
          <button
            onClick={() => setIsSettingsModalOpen(true)}
            className="p-2 text-neutral-400 hover:text-white hover:bg-white/5 rounded-md transition-colors"
            title="Configurações"
          >
            ⚙️
          </button>
        )}
      </div>

      {}
      <div className="bg-white/5 border border-white/10 rounded-md p-3 mb-6">
        <p className="text-white/80 text-sm">
          <span className="font-semibold">👤 Registrando para:</span> {userName || 'Usuário'}
        </p>
        {userSettings && (
          <p className="text-xs text-white/50 mt-2">
            ⚙️ Configuração:{' '}
            {userSettings.workingDays === 'weekdays'
              ? 'Segunda a Sexta'
              : userSettings.workingDays === 'weekends'
                ? 'Finais de Semana'
                : 'Todos os dias'}
            {userSettings.defaultStartTime && userSettings.defaultEndTime && (
              <span className="ml-2">
                | 🕐 {userSettings.defaultStartTime} - {userSettings.defaultEndTime}
              </span>
            )}
          </p>
        )}
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {}
        <div className="bg-white/5 rounded-md p-4 mb-4 border border-white/10">
          <p className="text-sm font-medium text-neutral-300 mb-3">Modo de Registro:</p>
          <div className="flex space-x-4">
            <label className="flex items-center space-x-2 cursor-pointer">
              <input
                type="radio"
                checked={!isMultipleMode}
                onChange={() => setIsMultipleMode(false)}
                className="text-blue-600 bg-white/5 border-white/10 focus:ring-blue-500"
              />
              <span className="text-neutral-300">📅 Registro Único</span>
            </label>
            <label className="flex items-center space-x-2 cursor-pointer">
              <input
                type="radio"
                checked={isMultipleMode}
                onChange={() => setIsMultipleMode(true)}
                className="text-blue-600 bg-white/5 border-white/10 focus:ring-blue-500"
              />
              <span className="text-neutral-300">📋 Múltiplos Dias</span>
            </label>
          </div>
        </div>

        {!isMultipleMode ? (
          <>
            <div>
              <label htmlFor="date" className="block text-sm font-medium text-neutral-300 mb-2">
                Data
                {userSettings && userSettings.workingDays !== 'all' && (
                  <span className="ml-2 text-xs text-yellow-400">
                    (
                    {userSettings.workingDays === 'weekdays'
                      ? 'Segunda a Sexta'
                      : 'Finais de Semana'}
                    )
                  </span>
                )}
              </label>
              <input
                type="date"
                id="date"
                value={formData.date}
                onChange={(e) => {
                  const newDate = e.target.value;
                  handleInputChange('date', newDate);

                  if (newDate && !isDateAllowed(newDate)) {
                    const workingDaysText =
                      userSettings?.workingDays === 'weekdays'
                        ? 'dias de semana (Segunda a Sexta)'
                        : userSettings?.workingDays === 'weekends'
                          ? 'finais de semana (Sábado e Domingo)'
                          : 'todos os dias';
                    setErrors((prev) => ({
                      ...prev,
                      date: `Data não permitida. Você configurou para trabalhar apenas em ${workingDaysText}`,
                    }));
                  } else {
                    setErrors((prev) => {
                      const newErrors = { ...prev };
                      delete newErrors.date;
                      return newErrors;
                    });
                  }
                }}
                {...getDateRestrictions()}
                className={`w-full px-3 py-2 bg-white/5 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-400 text-white ${
                  errors.date
                    ? 'border-red-500'
                    : isDateDisabled(formData.date)
                      ? 'border-yellow-500'
                      : 'border-white/10'
                }`}
              />
              {formData.date && (
                <p
                  className={`text-sm mt-1 ${
                    isDateDisabled(formData.date) ? 'text-yellow-400' : 'text-blue-300'
                  }`}
                >
                  📅 {getWeekdayName(formData.date)}
                  {isDateDisabled(formData.date) && (
                    <span className="ml-2 text-yellow-400">
                      ⚠️ Dia não configurado para trabalho
                    </span>
                  )}
                </p>
              )}
              {errors.date && <p className="text-red-400 text-sm mt-1">{errors.date}</p>}
            </div>

            <div>
              <label htmlFor="type" className="block text-sm font-medium text-neutral-300 mb-2">
                Tipo de Registro
              </label>
              <select
                id="type"
                value={formData.type}
                onChange={(e) => handleInputChange('type', e.target.value)}
                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-white transition-all duration-300 hover:bg-white/10 [&>option]:bg-[#1a1a1a] [&>option]:text-white"
              >
                <option value="work">🏢 Trabalho Normal</option>
                <option value="time_off">🏖️ Folga (desconta horas extras)</option>
              </select>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label
                  htmlFor="startTime"
                  className="block text-sm font-medium text-neutral-300 mb-2"
                >
                  Horário de Início
                </label>
                <input
                  type="time"
                  id="startTime"
                  value={formData.startTime}
                  onChange={(e) => handleInputChange('startTime', e.target.value)}
                  className={`w-full px-3 py-2 bg-white/5 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-400 text-white ${
                    errors.startTime ? 'border-red-500' : 'border-white/10'
                  }`}
                />
                {errors.startTime && (
                  <p className="text-red-400 text-sm mt-1">{errors.startTime}</p>
                )}
              </div>

              <div>
                <label
                  htmlFor="endTime"
                  className="block text-sm font-medium text-neutral-300 mb-2"
                >
                  Horário de Término
                </label>
                <input
                  type="time"
                  id="endTime"
                  value={formData.endTime}
                  onChange={(e) => handleInputChange('endTime', e.target.value)}
                  className={`w-full px-3 py-2 bg-white/5 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-400 text-white ${
                    errors.endTime ? 'border-red-500' : 'border-white/10'
                  }`}
                />
                {errors.endTime && <p className="text-red-400 text-sm mt-1">{errors.endTime}</p>}
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <label
                  htmlFor="description"
                  className="block text-sm font-medium text-neutral-300"
                >
                  Descrição do que foi feito <span className="text-red-400">*</span>
                </label>
                {userSettings?.githubUsername && (
                  <button
                    type="button"
                    onClick={handleImportCommits}
                    disabled={loadingCommits || !formData.date}
                    className="px-3 py-1 text-xs bg-purple-600/20 hover:bg-purple-600/30 border border-purple-500/30 text-purple-300 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
                    title={!formData.date ? 'Selecione uma data primeiro' : 'Importar commits do GitHub'}
                  >
                    {loadingCommits ? (
                      <>
                        <span className="animate-spin">⏳</span> Importando...
                      </>
                    ) : (
                      <>
                        🐙 Importar Commits
                      </>
                    )}
                  </button>
                )}
              </div>
              <textarea
                id="description"
                value={formData.description}
                onChange={(e) => handleInputChange('description', e.target.value)}
                placeholder="Descreva as atividades realizadas durante este período...&#10;&#10;Você pode usar Markdown:&#10;- **negrito**&#10;- *itálico*&#10;- `código`&#10;- [link](url)&#10;- # Título"
                rows={15}
                className={`w-full px-3 py-2 bg-white/5 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-400 text-white resize-y font-mono text-sm ${
                  errors.description ? 'border-red-500' : 'border-white/10'
                }`}
              />
              {errors.description && (
                <p className="text-red-400 text-sm mt-1">{errors.description}</p>
              )}
              <p className="text-white/50 text-xs mt-1">
                💡 Mínimo de 10 caracteres ({formData.description.length}/10) • Suporta Markdown
              </p>
            </div>

            {formData.startTime &&
              formData.endTime &&
              timeUtils.isValidTimeRange(formData.startTime, formData.endTime) && (
                <div className="bg-white/5 border border-white/10 rounded-md p-3">
                  <p className="text-white/80 text-sm">
                    <strong>Horas calculadas:</strong>{' '}
                    {timeUtils.formatHours(
                      timeUtils.calculateHoursDifference(formData.startTime, formData.endTime)
                    )}
                  </p>
                </div>
              )}
          </>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <label className="block text-sm font-medium text-neutral-300">
                Registro Múltiplo
              </label>
              <button
                type="button"
                onClick={() => {
                  const newDay = {
                    date: timeUtils.getCurrentDate(),
                    startTime: userSettings?.defaultStartTime || '',
                    endTime: userSettings?.defaultEndTime || '',
                    type: 'work' as 'work' | 'time_off',
                  };
                  setMultipleDays((prev) => [...prev, newDay]);
                }}
                className="px-3 py-1 text-sm bg-linear-to-r from-green-600 to-green-500 hover:from-green-700 hover:to-green-600 text-white rounded-md shadow-lg shadow-green-500/20 hover:shadow-green-500/40 transition-all"
              >
                + Adicionar Dia
              </button>
            </div>

            {multipleDays.length === 0 ? (
              <div className="text-center py-8 bg-white/5 rounded-md border border-white/10">
                <p className="text-neutral-400">Clique em &quot;Adicionar Dia&quot; para começar</p>
              </div>
            ) : (
              <div className="space-y-3 max-h-60 overflow-y-auto">
                {multipleDays.map((day, index) => (
                  <div key={index} className="bg-white/5 rounded-md p-4 border border-white/10">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-3 items-end">
                      <div>
                        <label className="block text-xs font-medium text-neutral-300 mb-1">
                          Data
                          {userSettings && userSettings.workingDays !== 'all' && (
                            <span className="ml-1 text-yellow-400">*</span>
                          )}
                        </label>
                        <input
                          type="date"
                          value={day.date}
                          onChange={(e) => {
                            const newMultipleDays = [...multipleDays];
                            newMultipleDays[index].date = e.target.value;
                            setMultipleDays(newMultipleDays);
                          }}
                          {...getDateRestrictions()}
                          className={`w-full px-2 py-1 text-sm bg-white/5 border rounded-md focus:outline-none focus:ring-1 focus:ring-blue-400 text-white ${
                            day.date && isDateDisabled(day.date)
                              ? 'border-yellow-500'
                              : 'border-white/10'
                          }`}
                        />
                        {day.date && (
                          <p
                            className={`text-xs mt-1 ${
                              isDateDisabled(day.date) ? 'text-yellow-400' : 'text-blue-300'
                            }`}
                          >
                            {getWeekdayName(day.date)}
                            {isDateDisabled(day.date) && (
                              <span className="block text-yellow-400">⚠️ Não permitido</span>
                            )}
                          </p>
                        )}
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-neutral-300 mb-1">
                          Início
                        </label>
                        <input
                          type="time"
                          value={day.startTime}
                          onChange={(e) => {
                            const newMultipleDays = [...multipleDays];
                            newMultipleDays[index].startTime = e.target.value;
                            setMultipleDays(newMultipleDays);
                          }}
                          className="w-full px-2 py-1 text-sm bg-white/5 border border-white/10 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-400 text-white"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-neutral-300 mb-1">
                          Fim
                        </label>
                        <input
                          type="time"
                          value={day.endTime}
                          onChange={(e) => {
                            const newMultipleDays = [...multipleDays];
                            newMultipleDays[index].endTime = e.target.value;
                            setMultipleDays(newMultipleDays);
                          }}
                          className="w-full px-2 py-1 text-sm bg-white/5 border border-white/10 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-400 text-white"
                        />
                      </div>
                      <div className="flex space-x-1">
                        <select
                          value={day.type}
                          onChange={(e) => {
                            const newMultipleDays = [...multipleDays];
                            newMultipleDays[index].type = e.target.value as 'work' | 'time_off';
                            setMultipleDays(newMultipleDays);
                          }}
                          className="flex-1 px-2 py-1 text-xs bg-white/5 border border-white/10 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-400 text-white [&>option]:bg-[#1a1a1a] [&>option]:text-white"
                        >
                          <option value="work">🏢</option>
                          <option value="time_off">🏖️</option>
                        </select>
                        <button
                          type="button"
                          onClick={() => {
                            const newMultipleDays = multipleDays.filter((_, i) => i !== index);
                            setMultipleDays(newMultipleDays);
                          }}
                          className="px-2 py-1 text-xs bg-linear-to-r from-red-600 to-red-500 hover:from-red-700 hover:to-red-600 text-white rounded-md shadow-lg shadow-red-500/20 hover:shadow-red-500/40 transition-all"
                        >
                          🗑️
                        </button>
                      </div>
                    </div>
                    {day.startTime &&
                      day.endTime &&
                      timeUtils.isValidTimeRange(day.startTime, day.endTime) && (
                        <div className="mt-2 text-xs text-blue-300">
                          💡{' '}
                          {timeUtils.formatHours(
                            timeUtils.calculateHoursDifference(day.startTime, day.endTime)
                          )}
                        </div>
                      )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {errors.submit && (
          <div className="bg-red-900/50 border border-red-700 rounded-md p-3">
            <p className="text-red-300 text-sm">{errors.submit}</p>
          </div>
        )}

        <button
          type="submit"
          disabled={isSubmitting || (isMultipleMode && multipleDays.length === 0)}
          className={`w-full py-2 px-4 rounded-md font-medium transition-colors ${
            isSubmitting || (isMultipleMode && multipleDays.length === 0)
              ? 'bg-white/10 text-white/40 cursor-not-allowed border border-white/10'
              : 'bg-linear-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600 text-white shadow-lg shadow-blue-500/20 hover:shadow-blue-500/40'
          }`}
        >
          {isSubmitting
            ? 'Salvando...'
            : isMultipleMode
              ? `Registrar ${multipleDays.length} Dia${multipleDays.length !== 1 ? 's' : ''}`
              : 'Registrar Horas'}
        </button>
      </form>

      {}
      {userId && (
        <UserSettingsModal
          isOpen={isSettingsModalOpen}
          onClose={() => setIsSettingsModalOpen(false)}
          userId={userId}
          onSettingsUpdated={() => {}}
        />
      )}
    </div>
  );
}
