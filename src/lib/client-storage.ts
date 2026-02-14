import { TimeRecord, MonthlyGoal, User, HourConversion } from '@/types';
import { auth } from './firebase/config';

// Helper para obter token de autenticação
async function getAuthToken(): Promise<string | null> {
  const user = auth.currentUser;
  if (!user) return null;
  return await user.getIdToken();
}

// Helper para fazer requisições autenticadas
async function authenticatedFetch(url: string, options: RequestInit = {}): Promise<Response> {
  const token = await getAuthToken();

  if (!token) {
    throw new Error('User not authenticated');
  }

  return fetch(url, {
    ...options,
    headers: {
      ...options.headers,
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });
}

export const clientStorageUtils = {
  // Time Records
  async getTimeRecords(userId?: string): Promise<TimeRecord[]> {
    const response = await authenticatedFetch('/api/time-records');
    if (!response.ok) {
      throw new Error('Failed to fetch time records');
    }
    return response.json();
  },

  async saveTimeRecord(record: TimeRecord): Promise<void> {
    const response = await authenticatedFetch('/api/time-records', {
      method: 'POST',
      body: JSON.stringify(record),
    });
    if (!response.ok) {
      throw new Error('Failed to save time record');
    }
  },

  async updateTimeRecord(id: string, updatedRecord: Partial<TimeRecord>): Promise<void> {
    const response = await authenticatedFetch('/api/time-records', {
      method: 'PATCH',
      body: JSON.stringify({ id, ...updatedRecord }),
    });
    if (!response.ok) {
      throw new Error('Failed to update time record');
    }
  },

  async deleteTimeRecord(id: string): Promise<void> {
    const response = await authenticatedFetch(`/api/time-records?id=${id}`, {
      method: 'DELETE',
    });
    if (!response.ok) {
      throw new Error('Failed to delete time record');
    }
  },

  async getUserTimeRecords(userId: string): Promise<TimeRecord[]> {
    return this.getTimeRecords(userId);
  },

  // Monthly Goals
  async getMonthlyGoals(userId?: string): Promise<MonthlyGoal[]> {
    const response = await authenticatedFetch('/api/monthly-goals');
    if (!response.ok) {
      throw new Error('Failed to fetch monthly goals');
    }
    return response.json();
  },

  async getMonthlyGoal(month: string, userId?: string): Promise<number> {
    const response = await authenticatedFetch(`/api/monthly-goals?month=${month}`);
    if (!response.ok) {
      throw new Error('Failed to fetch monthly goal');
    }
    const data = await response.json();
    return data.goal || 0;
  },

  async saveMonthlyGoal(goal: MonthlyGoal): Promise<void> {
    const response = await authenticatedFetch('/api/monthly-goals', {
      method: 'POST',
      body: JSON.stringify(goal),
    });
    if (!response.ok) {
      throw new Error('Failed to save monthly goal');
    }
  },

  async getUserMonthlyGoals(userId: string): Promise<MonthlyGoal[]> {
    return this.getMonthlyGoals(userId);
  },

  async getUserMonthlyGoal(userId: string, month: string): Promise<number> {
    return this.getMonthlyGoal(month, userId);
  },

  // Users
  async getUsers(): Promise<User[]> {
    const response = await authenticatedFetch('/api/users');
    if (!response.ok) {
      throw new Error('Failed to fetch users');
    }
    return response.json();
  },

  async saveUser(user: User): Promise<void> {
    const response = await authenticatedFetch('/api/users', {
      method: 'POST',
      body: JSON.stringify(user),
    });
    if (!response.ok) {
      throw new Error('Failed to save user');
    }
  },

  async getUserBySlug(slug: string): Promise<User | null> {
    const response = await authenticatedFetch(`/api/users/${slug}`);
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
    return name
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]/g, '')
      .slice(0, 20);
  },

  // Hour Conversions
  async getHourConversions(userId?: string): Promise<HourConversion[]> {
    try {
      const response = await authenticatedFetch('/api/hour-conversions');
      if (!response.ok) {
        throw new Error('Failed to fetch hour conversions');
      }
      return await response.json();
    } catch (error) {
      console.error('Error fetching hour conversions:', error);
      return [];
    }
  },

  async getUserHourConversions(userId: string): Promise<HourConversion[]> {
    return this.getHourConversions(userId);
  },

  async saveHourConversion(conversion: HourConversion): Promise<void> {
    try {
      const response = await authenticatedFetch('/api/hour-conversions', {
        method: 'POST',
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
