export interface TimeRecord {
  id: string;
  userId: string;
  name: string;
  date: string; // YYYY-MM-DD format
  type: 'work' | 'time_off'; // work = trabalho normal, time_off = folga
  startTime: string; // HH:MM format
  endTime: string; // HH:MM format
  totalHours: number;
  createdAt: string;
}

export interface MonthlyGoal {
  id: string;
  userId: string;
  month: string; // YYYY-MM format
  hoursGoal: number;
  createdAt: string;
}

export interface MonthlyStats {
  totalHours: number;
  goal: number;
  difference: number;
  isOverGoal: boolean;
  workingDays: number;
}

export interface HourConversion {
  id: string;
  userId: string;
  hours: number;
  amount: number;
  type: 'money' | 'time_off'; // money = conversão em dinheiro, time_off = folga
  date: string;
  createdAt: string;
}

export interface AccumulatedHours {
  totalExtraHours: number;
  availableHours: number; // total - convertidas - folgas
  convertedToMoney: number;
  usedForTimeOff: number;
}

export interface DailyStats {
  date: string;
  totalHours: number;
  records: TimeRecord[];
}

export interface User {
  id: string;
  name: string;
  createdAt: string;
}

export interface UserSession {
  currentUserId: string | null;
  currentUserName: string | null;
}

export interface UserSettings {
  id: string;
  userId: string;
  defaultStartTime: string | null;
  defaultEndTime: string | null;
  workingDays: 'weekdays' | 'all' | 'weekends';
  createdAt: string;
  updatedAt: string;
}
