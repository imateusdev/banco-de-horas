import { TimeRecord, MonthlyGoal, User } from '@/types';

export const clientStorageUtils = {
  // Time Records
  async getTimeRecords(userId?: string): Promise<TimeRecord[]> {
    const url = userId ? `/api/time-records?userId=${userId}` : '/api/time-records';
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error('Failed to fetch time records');
    }
    return response.json();
  },

  async saveTimeRecord(record: TimeRecord): Promise<void> {
    const response = await fetch('/api/time-records', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(record),
    });
    if (!response.ok) {
      throw new Error('Failed to save time record');
    }
  },

  async updateTimeRecord(id: string, updatedRecord: Partial<TimeRecord>): Promise<void> {
    const response = await fetch(`/api/time-records/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updatedRecord),
    });
    if (!response.ok) {
      throw new Error('Failed to update time record');
    }
  },

  async deleteTimeRecord(id: string): Promise<void> {
    const response = await fetch(`/api/time-records/${id}`, {
      method: 'DELETE',
    });
    if (!response.ok) {
      throw new Error('Failed to delete time record');
    }
  },

  // Monthly Goals
  async getMonthlyGoals(userId?: string): Promise<MonthlyGoal[]> {
    const url = userId ? `/api/monthly-goals?userId=${userId}` : '/api/monthly-goals';
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error('Failed to fetch monthly goals');
    }
    return response.json();
  },

  async getMonthlyGoal(month: string, userId?: string): Promise<number> {
    const url = userId 
      ? `/api/monthly-goals?userId=${userId}&month=${month}` 
      : `/api/monthly-goals?month=${month}`;
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error('Failed to fetch monthly goal');
    }
    const data = await response.json();
    return data.goal;
  },

  async saveMonthlyGoal(goal: MonthlyGoal): Promise<void> {
    const response = await fetch('/api/monthly-goals', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(goal),
    });
    if (!response.ok) {
      throw new Error('Failed to save monthly goal');
    }
  },

  // Users
  async getUsers(): Promise<User[]> {
    const response = await fetch('/api/users');
    if (!response.ok) {
      throw new Error('Failed to fetch users');
    }
    return response.json();
  },

  async saveUser(user: User): Promise<void> {
    const response = await fetch('/api/users', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(user),
    });
    if (!response.ok) {
      throw new Error('Failed to save user');
    }
  },

  async getUserBySlug(slug: string): Promise<User | null> {
    const response = await fetch(`/api/users/${slug}`);
    if (response.status === 404) {
      return null;
    }
    if (!response.ok) {
      throw new Error('Failed to fetch user');
    }
    return response.json();
  },

  // Utility functions (remain client-side)
  generateUserSlug(name: string): string {
    return name.toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '') // Remove acentos
      .replace(/[^a-z0-9]/g, '') // Remove caracteres especiais
      .slice(0, 20); // Limita tamanho
  },

  // Filtered methods by userId
  async getUserTimeRecords(userId: string): Promise<TimeRecord[]> {
    return this.getTimeRecords(userId);
  },

  async getUserMonthlyGoals(userId: string): Promise<MonthlyGoal[]> {
    return this.getMonthlyGoals(userId);
  },

  async getUserMonthlyGoal(userId: string, month: string): Promise<number> {
    return this.getMonthlyGoal(month, userId);
  },

  // Hour Conversions
  async getHourConversions(userId?: string): Promise<import('@/types').HourConversion[]> {
    try {
      const url = userId ? `/api/hour-conversions?userId=${userId}` : '/api/hour-conversions';
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error('Failed to fetch hour conversions');
      }
      return await response.json();
    } catch (error) {
      console.error('Error fetching hour conversions:', error);
      return [];
    }
  },

  async getUserHourConversions(userId: string): Promise<import('@/types').HourConversion[]> {
    return this.getHourConversions(userId);
  },

  async saveHourConversion(conversion: import('@/types').HourConversion): Promise<void> {
    try {
      const response = await fetch('/api/hour-conversions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(conversion),
      });
      
      if (!response.ok) {
        throw new Error('Failed to save hour conversion');
      }
    } catch (error) {
      console.error('Error saving hour conversion:', error);
      throw error;
    }
  }
};
