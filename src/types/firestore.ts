import { Timestamp } from 'firebase/firestore';

export interface User {
  id: string;
  name: string;
  slug: string;
  email: string;
  createdAt: Timestamp;
}

export interface TimeRecord {
  id: string;
  userId: string;
  name: string;
  date: Timestamp;
  type: 'work' | 'time_off';
  startTime: string;
  endTime: string;
  totalHours: number;
  createdAt: Timestamp;
}

export interface MonthlyGoal {
  id: string;
  userId: string;
  month: string;
  hoursGoal: number;
  createdAt: Timestamp;
}

export interface HourConversion {
  id: string;
  userId: string;
  hours: number;
  amount: number;
  type: 'money' | 'time_off';
  date: Timestamp;
  createdAt: Timestamp;
}

export interface UserSettings {
  id: string;
  userId: string;
  defaultStartTime?: string;
  defaultEndTime?: string;
  workingDays: 'weekdays' | 'all' | 'weekends';
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export type CreateUser = Omit<User, 'id' | 'createdAt'>;
export type CreateTimeRecord = Omit<TimeRecord, 'id' | 'createdAt'>;
export type CreateMonthlyGoal = Omit<MonthlyGoal, 'id' | 'createdAt'>;
export type CreateHourConversion = Omit<HourConversion, 'id' | 'createdAt'>;
export type CreateUserSettings = Omit<UserSettings, 'id' | 'userId' | 'createdAt' | 'updatedAt'>;

export type UpdateUser = Partial<Omit<User, 'id' | 'createdAt'>>;
export type UpdateTimeRecord = Partial<Omit<TimeRecord, 'id' | 'userId' | 'createdAt'>>;
export type UpdateMonthlyGoal = Partial<Omit<MonthlyGoal, 'id' | 'userId' | 'createdAt'>>;
export type UpdateHourConversion = Partial<Omit<HourConversion, 'id' | 'userId' | 'createdAt'>>;
export type UpdateUserSettings = Partial<
  Omit<UserSettings, 'id' | 'userId' | 'createdAt' | 'updatedAt'>
>;
