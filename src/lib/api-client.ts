import { TimeRecord, MonthlyStats, DailyStats, HourConversion } from '@/types';
import { auth } from './firebase/config';

async function getAuthHeaders(): Promise<HeadersInit> {
  const user = auth.currentUser;
  if (!user) {
    throw new Error('User not authenticated');
  }

  const token = await user.getIdToken();
  return {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token}`,
  };
}

export const apiClient = {
  async getTimeRecords(userId: string): Promise<TimeRecord[]> {
    const headers = await getAuthHeaders();
    const response = await fetch(`/api/time-records?userId=${userId}`, { headers });
    if (!response.ok) throw new Error('Failed to fetch time records');
    return response.json();
  },

  async createTimeRecord(record: TimeRecord): Promise<void> {
    const headers = await getAuthHeaders();
    const response = await fetch('/api/time-records', {
      method: 'POST',
      headers,
      body: JSON.stringify(record),
    });
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || 'Failed to create time record');
    }
  },

  async updateTimeRecord(id: string, updates: Partial<TimeRecord>): Promise<void> {
    const headers = await getAuthHeaders();
    const response = await fetch(`/api/time-records`, {
      method: 'PATCH',
      headers,
      body: JSON.stringify({ id, ...updates }),
    });
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || 'Failed to update time record');
    }
  },

  async deleteTimeRecord(id: string, userId: string): Promise<void> {
    const headers = await getAuthHeaders();
    const response = await fetch(`/api/time-records?id=${id}&userId=${userId}`, {
      method: 'DELETE',
      headers,
    });
    if (!response.ok) throw new Error('Failed to delete time record');
  },

  async getHourConversions(userId: string): Promise<HourConversion[]> {
    const headers = await getAuthHeaders();
    const response = await fetch(`/api/hour-conversions?userId=${userId}`, { headers });
    if (!response.ok) throw new Error('Failed to fetch hour conversions');
    return response.json();
  },

  async createHourConversion(conversion: HourConversion): Promise<void> {
    const headers = await getAuthHeaders();
    const response = await fetch('/api/hour-conversions', {
      method: 'POST',
      headers,
      body: JSON.stringify(conversion),
    });
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || 'Failed to create hour conversion');
    }
  },

  async getMonthlyGoal(userId: string, month: string): Promise<number> {
    const headers = await getAuthHeaders();
    const response = await fetch(`/api/monthly-goals?userId=${userId}&month=${month}`, { headers });
    if (!response.ok) return 0;
    const data = await response.json();
    return data.goal || 0;
  },

  async saveMonthlyGoal(userId: string, month: string, goal: number): Promise<void> {
    const headers = await getAuthHeaders();
    const response = await fetch('/api/monthly-goals', {
      method: 'POST',
      headers,
      body: JSON.stringify({ userId, month, hoursGoal: goal }),
    });
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || 'Failed to save monthly goal');
    }
  },

  async getDailyStats(date: string, userId: string): Promise<DailyStats> {
    const records = await this.getTimeRecords(userId);
    const dayRecords = records.filter((record) => record.date === date);
    const totalHours = dayRecords.reduce((sum, record) => sum + record.totalHours, 0);

    return {
      date,
      totalHours,
      records: dayRecords,
    };
  },

  async getMonthlyStats(month: string, userId: string): Promise<MonthlyStats> {
    const [records, , goal] = await Promise.all([
      this.getTimeRecords(userId),
      this.getHourConversions(userId),
      this.getMonthlyGoal(userId, month),
    ]);

    const monthRecords = records.filter((record) => record.date.startsWith(month));

    const workRecords = monthRecords.filter((record) => record.type === 'work');
    const timeOffRecords = monthRecords.filter((record) => record.type === 'time_off');

    const workHours = workRecords.reduce((sum, record) => sum + record.totalHours, 0);
    const timeOffHours = timeOffRecords.reduce((sum, record) => sum + record.totalHours, 0);

    const totalHours = workHours - timeOffHours;

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

  async getAccumulatedHours(userId: string): Promise<number> {
    const [records, conversions] = await Promise.all([
      this.getTimeRecords(userId),
      this.getHourConversions(userId),
    ]);

    const workHours = records
      .filter((r) => r.type === 'work')
      .reduce((sum, r) => sum + r.totalHours, 0);

    const timeOffHours = records
      .filter((r) => r.type === 'time_off')
      .reduce((sum, r) => sum + r.totalHours, 0);

    const totalWorkedHours = workHours - timeOffHours;

    const convertedHours = conversions.reduce((sum, c) => sum + c.hours, 0);

    return totalWorkedHours - convertedHours;
  },

  async getDashboardData(
    date: string,
    month: string
  ): Promise<{
    dailyStats: DailyStats;
    monthlyStats: MonthlyStats;
    accumulatedHours: any;
    hourConversions: HourConversion[];
  }> {
    const headers = await getAuthHeaders();
    const response = await fetch(`/api/dashboard?date=${date}&month=${month}`, { headers });
    if (!response.ok) throw new Error('Failed to fetch dashboard data');
    return response.json();
  },
};
