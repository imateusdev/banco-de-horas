import { TimeRecord, MonthlyStats, DailyStats } from '@/types';
import { clientStorageUtils } from './client-storage';

export const clientTimeUtils = {
  timeToMinutes: (time: string): number => {
    const [hours, minutes] = time.split(':').map(Number);
    return hours * 60 + minutes;
  },

  minutesToHours: (minutes: number): number => {
    return minutes / 60;
  },

  calculateHoursDifference: (startTime: string, endTime: string): number => {
    const startMinutes = clientTimeUtils.timeToMinutes(startTime);
    const endMinutes = clientTimeUtils.timeToMinutes(endTime);

    let diffMinutes = endMinutes - startMinutes;

    if (diffMinutes < 0) {
      diffMinutes += 24 * 60;
    }

    return clientTimeUtils.minutesToHours(diffMinutes);
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
      ? await clientStorageUtils.getUserTimeRecords(userId)
      : await clientStorageUtils.getTimeRecords();
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
      ? await clientStorageUtils.getUserTimeRecords(userId)
      : await clientStorageUtils.getTimeRecords();
    const monthRecords = records.filter((record) => record.date.startsWith(month));

    const workRecords = monthRecords.filter((record) => record.type === 'work');
    const timeOffRecords = monthRecords.filter((record) => record.type === 'time_off');

    const workHours = workRecords.reduce((sum, record) => sum + record.totalHours, 0);
    const timeOffHours = timeOffRecords.reduce((sum, record) => sum + record.totalHours, 0);

    const totalHours = workHours - timeOffHours;

    const goal = userId
      ? await clientStorageUtils.getUserMonthlyGoal(userId, month)
      : await clientStorageUtils.getMonthlyGoal(month);
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
    if (
      !clientTimeUtils.isValidTimeFormat(startTime) ||
      !clientTimeUtils.isValidTimeFormat(endTime)
    ) {
      return false;
    }

    const startMinutes = clientTimeUtils.timeToMinutes(startTime);
    const endMinutes = clientTimeUtils.timeToMinutes(endTime);

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
    const totalHours = clientTimeUtils.calculateHoursDifference(startTime, endTime);

    return {
      id: clientTimeUtils.generateId(),
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

  getAccumulatedExtraHours: async (
    userId?: string
  ): Promise<import('@/types').AccumulatedHours> => {
    try {
      const records = userId
        ? await clientStorageUtils.getUserTimeRecords(userId)
        : await clientStorageUtils.getTimeRecords();
      const conversions = userId
        ? await clientStorageUtils.getUserHourConversions(userId)
        : await clientStorageUtils.getHourConversions();

      const monthlyData: { [month: string]: { totalHours: number; goal: number } } = {};

      for (const record of records) {
        const month = record.date.slice(0, 7);

        if (!monthlyData[month]) {
          const goal = userId
            ? await clientStorageUtils.getUserMonthlyGoal(userId, month)
            : await clientStorageUtils.getMonthlyGoal(month);
          monthlyData[month] = { totalHours: 0, goal };
        }

        if (record.type === 'work') {
          monthlyData[month].totalHours += record.totalHours;
        } else if (record.type === 'time_off') {
          monthlyData[month].totalHours -= record.totalHours;
        }
      }

      let totalExtraHours = 0;
      for (const month in monthlyData) {
        const { totalHours, goal } = monthlyData[month];
        if (totalHours > goal && goal > 0) {
          totalExtraHours += totalHours - goal;
        }
      }

      const convertedToMoney = conversions
        .filter((conv) => conv.type === 'money')
        .reduce((sum, conv) => sum + conv.hours, 0);

      const usedForTimeOff = conversions
        .filter((conv) => conv.type === 'time_off')
        .reduce((sum, conv) => sum + conv.hours, 0);

      const availableHours = Math.max(0, totalExtraHours - convertedToMoney - usedForTimeOff);

      return {
        totalExtraHours,
        availableHours,
        convertedToMoney,
        usedForTimeOff,
      };
    } catch (error) {
      console.error('Error calculating accumulated extra hours:', error);
      return {
        totalExtraHours: 0,
        availableHours: 0,
        convertedToMoney: 0,
        usedForTimeOff: 0,
      };
    }
  },
};
