import { TimeRecord, MonthlyStats, DailyStats } from '@/types';
import { storageUtils } from './storage';

export const timeUtils = {
  timeToMinutes: (time: string): number => {
    const [hours, minutes] = time.split(':').map(Number);
    return hours * 60 + minutes;
  },

  minutesToHours: (minutes: number): number => {
    return minutes / 60;
  },

  calculateHoursDifference: (startTime: string, endTime: string): number => {
    const startMinutes = timeUtils.timeToMinutes(startTime);
    const endMinutes = timeUtils.timeToMinutes(endTime);

    let diffMinutes = endMinutes - startMinutes;

    if (diffMinutes < 0) {
      diffMinutes += 24 * 60;
    }

    return timeUtils.minutesToHours(diffMinutes);
  },

  formatHours: (hours: number): string => {
    const wholeHours = Math.floor(hours);
    const minutes = Math.round((hours - wholeHours) * 60);

    if (minutes === 0) {
      return `${wholeHours}h`;
    }

    return `${wholeHours}h ${minutes}min`;
  },

  getCurrentDate: (): string => {
    return new Date().toISOString().split('T')[0];
  },

  getCurrentMonth: (): string => {
    return new Date().toISOString().slice(0, 7);
  },

  getDailyStats: async (date: string, userId?: string): Promise<DailyStats> => {
    const records = userId
      ? await storageUtils.getUserTimeRecords(userId)
      : await storageUtils.getTimeRecords();
    const dayRecords = records.filter((record) => record.date === date);
    const totalHours = dayRecords.reduce((sum, record) => sum + record.totalHours, 0);

    return {
      date,
      totalHours,
      records: dayRecords,
    };
  },

  getMonthlyStats: async (month: string, userId?: string): Promise<MonthlyStats> => {
    const records = userId
      ? await storageUtils.getUserTimeRecords(userId)
      : await storageUtils.getTimeRecords();
    const monthRecords = records.filter((record) => record.date.startsWith(month));

    const workRecords = monthRecords.filter((record) => record.type === 'work');
    const timeOffRecords = monthRecords.filter((record) => record.type === 'time_off');

    const workHours = workRecords.reduce((sum, record) => sum + record.totalHours, 0);
    const timeOffHours = timeOffRecords.reduce((sum, record) => sum + record.totalHours, 0);

    const totalHours = workHours - timeOffHours;

    const goal = userId
      ? await storageUtils.getUserMonthlyGoal(userId, month)
      : await storageUtils.getMonthlyGoal(month);
    const difference = totalHours - goal;
    const isOverGoal = difference > 0;

    const uniqueDates = [...new Set(monthRecords.map((record) => record.date))];
    const workingDays = uniqueDates.length;

    return {
      totalHours,
      goal,
      difference: Math.abs(difference),
      isOverGoal,
      workingDays,
    };
  },

  generateId: (): string => {
    return Date.now().toString() + Math.random().toString(36).substr(2, 9);
  },

  isValidTimeFormat: (time: string): boolean => {
    const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
    return timeRegex.test(time);
  },

  isValidTimeRange: (startTime: string, endTime: string): boolean => {
    if (!timeUtils.isValidTimeFormat(startTime) || !timeUtils.isValidTimeFormat(endTime)) {
      return false;
    }

    const startMinutes = timeUtils.timeToMinutes(startTime);
    const endMinutes = timeUtils.timeToMinutes(endTime);

    return startMinutes !== endMinutes;
  },

  createTimeRecord: (
    userId: string,
    name: string,
    date: string,
    startTime: string,
    endTime: string,
    type: 'work' | 'time_off' = 'work'
  ): TimeRecord => {
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
