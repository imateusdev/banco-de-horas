export interface TimeRecord {
  id: string;
  userId: string;
  name: string;
  date: string;
  type: 'work' | 'time_off';
  startTime: string;
  endTime: string;
  totalHours: number;
  createdAt: string;
}

export interface MonthlyGoal {
  id: string;
  userId: string;
  month: string;
  hoursGoal: number;
  status: 'pending' | 'approved' | 'rejected';
  requestedBy: string;
  approvedBy?: string;
  approvedAt?: string;
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
  type: 'money' | 'time_off';
  date: string;
  status: 'pending' | 'approved' | 'rejected';
  requestedBy: string;
  approvedBy?: string;
  approvedAt?: string;
  createdAt: string;
}

export interface AccumulatedHours {
  totalExtraHours: number;
  availableHours: number;
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
