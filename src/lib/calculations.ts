import { TimeRecord, MonthlyStats, DailyStats } from '@/types';
import { storageUtils } from './storage';

export const timeUtils = {
  // Converte string HH:MM para minutos
  timeToMinutes: (time: string): number => {
    const [hours, minutes] = time.split(':').map(Number);
    return hours * 60 + minutes;
  },

  // Converte minutos para horas decimais
  minutesToHours: (minutes: number): number => {
    return minutes / 60;
  },

  // Calcula diferença entre dois horários em horas
  calculateHoursDifference: (startTime: string, endTime: string): number => {
    const startMinutes = timeUtils.timeToMinutes(startTime);
    const endMinutes = timeUtils.timeToMinutes(endTime);
    
    let diffMinutes = endMinutes - startMinutes;
    
    // Se o horário de fim for menor que o de início, assumimos que passou da meia-noite
    if (diffMinutes < 0) {
      diffMinutes += 24 * 60; // Adiciona 24 horas em minutos
    }
    
    return timeUtils.minutesToHours(diffMinutes);
  },

  // Formata horas para exibição (ex: 8.5 -> "8h 30min")
  formatHours: (hours: number): string => {
    const wholeHours = Math.floor(hours);
    const minutes = Math.round((hours - wholeHours) * 60);
    
    if (minutes === 0) {
      return `${wholeHours}h`;
    }
    
    return `${wholeHours}h ${minutes}min`;
  },

  // Obtém data atual no formato YYYY-MM-DD
  getCurrentDate: (): string => {
    return new Date().toISOString().split('T')[0];
  },

  // Obtém mês atual no formato YYYY-MM
  getCurrentMonth: (): string => {
    return new Date().toISOString().slice(0, 7);
  },

  // Obtém estatísticas do dia
  getDailyStats: async (date: string, userId?: string): Promise<DailyStats> => {
    const records = userId ? await storageUtils.getUserTimeRecords(userId) : await storageUtils.getTimeRecords();
    const dayRecords = records.filter(record => record.date === date);
    const totalHours = dayRecords.reduce((sum, record) => sum + record.totalHours, 0);
    
    return {
      date,
      totalHours,
      records: dayRecords,
    };
  },

  // Obtém estatísticas do mês
  getMonthlyStats: async (month: string, userId?: string): Promise<MonthlyStats> => {
    const records = userId ? await storageUtils.getUserTimeRecords(userId) : await storageUtils.getTimeRecords();
    const monthRecords = records.filter(record => record.date.startsWith(month));
    
    // Separa registros de trabalho e folga
    const workRecords = monthRecords.filter(record => record.type === 'work');
    const timeOffRecords = monthRecords.filter(record => record.type === 'time_off');
    
    // Calcula horas de trabalho e folga
    const workHours = workRecords.reduce((sum, record) => sum + record.totalHours, 0);
    const timeOffHours = timeOffRecords.reduce((sum, record) => sum + record.totalHours, 0);
    
    // Total é horas de trabalho - horas de folga (folga desconta das horas extras)
    const totalHours = workHours - timeOffHours;
    
    const goal = userId ? await storageUtils.getUserMonthlyGoal(userId, month) : await storageUtils.getMonthlyGoal(month);
    const difference = totalHours - goal;
    const isOverGoal = difference > 0;
    
    // Conta dias únicos trabalhados no mês
    const uniqueDates = [...new Set(monthRecords.map(record => record.date))];
    const workingDays = uniqueDates.length;
    
    return {
      totalHours,
      goal,
      difference: Math.abs(difference),
      isOverGoal,
      workingDays,
    };
  },

  // Gera ID único para registros
  generateId: (): string => {
    return Date.now().toString() + Math.random().toString(36).substr(2, 9);
  },

  // Valida formato de tempo HH:MM
  isValidTimeFormat: (time: string): boolean => {
    const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
    return timeRegex.test(time);
  },

  // Valida se o horário de fim é posterior ao de início
  isValidTimeRange: (startTime: string, endTime: string): boolean => {
    if (!timeUtils.isValidTimeFormat(startTime) || !timeUtils.isValidTimeFormat(endTime)) {
      return false;
    }
    
    const startMinutes = timeUtils.timeToMinutes(startTime);
    const endMinutes = timeUtils.timeToMinutes(endTime);
    
    // Aceita tanto horários no mesmo dia quanto horários que passam da meia-noite
    return startMinutes !== endMinutes;
  },

  // Cria um novo registro de tempo
  createTimeRecord: (userId: string, name: string, date: string, startTime: string, endTime: string, type: 'work' | 'time_off' = 'work'): TimeRecord => {
    const totalHours = timeUtils.calculateHoursDifference(startTime, endTime);
    
    return {
      id: timeUtils.generateId(),
      userId,
      name,
      date,
      type,
      startTime,
      endTime,
      totalHours,
      createdAt: new Date().toISOString(),
    };
  },
};
