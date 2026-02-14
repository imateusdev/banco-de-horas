import { NextRequest, NextResponse } from 'next/server';
import { getUserFromRequest } from '@/lib/server/auth';
import {
  getTimeRecordsByUser,
  getUserMonthlyGoal,
  getUserHourConversions,
} from '@/lib/server/firestore';
import { timeUtils } from '@/lib/calculations';
import { DailyStats, MonthlyStats, AccumulatedHours } from '@/types';

export async function GET(request: NextRequest) {
  try {
    const user = await getUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = user.uid;
    const { searchParams } = new URL(request.url);
    const selectedDate = searchParams.get('date') || timeUtils.getCurrentDate();
    const selectedMonth = searchParams.get('month') || timeUtils.getCurrentMonth();

    const [timeRecords, monthlyGoal, hourConversions] = await Promise.all([
      getTimeRecordsByUser(userId),
      getUserMonthlyGoal(userId, selectedMonth),
      getUserHourConversions(userId),
    ]);

    const dailyRecords = timeRecords.filter((r) => r.date === selectedDate);
    const totalHoursDay = dailyRecords.reduce((sum, r) => sum + r.totalHours, 0);

    const dailyStats: DailyStats = {
      date: selectedDate,
      totalHours: totalHoursDay,
      records: dailyRecords,
    };

    const monthlyRecords = timeRecords.filter((r) => r.date.startsWith(selectedMonth));
    const totalHoursMonth = monthlyRecords.reduce((sum, r) => sum + r.totalHours, 0);
    const difference = totalHoursMonth - monthlyGoal;

    const monthlyStats: MonthlyStats = {
      totalHours: totalHoursMonth,
      goal: monthlyGoal,
      difference: Math.abs(difference),
      isOverGoal: difference > 0,
      workingDays: new Set(monthlyRecords.map((r) => r.date)).size,
    };

    const allExtraHours = timeRecords.reduce((sum, record) => {
      const recordMonth = record.date.substring(0, 7);
      const goal = recordMonth === selectedMonth ? monthlyGoal : 176;
      const monthRecords = timeRecords.filter((r) => r.date.startsWith(recordMonth));
      const monthTotal = monthRecords.reduce((s, r) => s + r.totalHours, 0);
      const monthExtra = Math.max(0, monthTotal - goal);
      return sum + monthExtra;
    }, 0);

    const convertedToMoney = hourConversions
      .filter((c) => c.type === 'money')
      .reduce((sum, c) => sum + c.hours, 0);

    const usedForTimeOff = hourConversions
      .filter((c) => c.type === 'time_off')
      .reduce((sum, c) => sum + c.hours, 0);

    const availableHours = allExtraHours - convertedToMoney - usedForTimeOff;

    const accumulatedHours: AccumulatedHours = {
      totalExtraHours: allExtraHours,
      availableHours,
      convertedToMoney,
      usedForTimeOff,
    };

    return NextResponse.json({
      dailyStats,
      monthlyStats,
      accumulatedHours,
      hourConversions,
    });
  } catch (error) {
    console.error('Dashboard API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
