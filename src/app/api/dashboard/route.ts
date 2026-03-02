import { NextRequest, NextResponse } from 'next/server';
import { withAuth, getQueryParam } from '@/lib/server/api-helpers';
import {
  getTimeRecordsByUser,
  getUserMonthlyGoal,
  getUserMonthlyGoals,
  getUserHourConversions,
} from '@/lib/server/firestore';
import { timeUtils } from '@/lib/calculations';
import { DailyStats, MonthlyStats, AccumulatedHours } from '@/types';

export async function GET(request: NextRequest) {
  return withAuth(request, async (user, req) => {
    const requestedUserId = getQueryParam(req, 'userId');
    if (requestedUserId) {
      const { canAccessUserData } = await import('@/lib/server/auth');
      if (!canAccessUserData(user, requestedUserId)) {
        return Response.json(
          { error: 'Forbidden - You can only access your own dashboard' },
          { status: 403 }
        );
      }
    }
    const userId = requestedUserId || user.uid;

    const selectedDate = getQueryParam(req, 'date') || timeUtils.getCurrentDate();
    const selectedMonth = getQueryParam(req, 'month') || timeUtils.getCurrentMonth();

    const [timeRecords, monthlyGoal, allMonthlyGoals, hourConversions] = await Promise.all([
      getTimeRecordsByUser(userId),
      getUserMonthlyGoal(userId, selectedMonth),
      getUserMonthlyGoals(userId),
      getUserHourConversions(userId),
    ]);

    const monthlyGoalsMap = new Map(
      allMonthlyGoals.filter((g) => g.status === 'approved').map((g) => [g.month, g.hoursGoal])
    );

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

    const processedMonths = new Set<string>();
    let allExtraHours = 0;
    for (const record of timeRecords) {
      const recordMonth = record.date.substring(0, 7);
      if (processedMonths.has(recordMonth)) continue;
      processedMonths.add(recordMonth);
      const goal = monthlyGoalsMap.get(recordMonth) ?? 176;
      const monthRecords = timeRecords.filter((r) => r.date.startsWith(recordMonth));
      const monthTotal = monthRecords.reduce((s, r) => s + r.totalHours, 0);
      allExtraHours += Math.max(0, monthTotal - goal);
    }

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
  });
}
