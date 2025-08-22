import { NextRequest, NextResponse } from 'next/server';
import { storageUtils } from '@/lib/storage';
import { MonthlyGoal } from '@/types';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const month = searchParams.get('month');

    if (month) {
      // Get specific monthly goal
      const goal = userId 
        ? await storageUtils.getUserMonthlyGoal(userId, month)
        : await storageUtils.getMonthlyGoal(month);
      return NextResponse.json({ goal });
    } else {
      // Get all monthly goals
      const goals = userId
        ? await storageUtils.getUserMonthlyGoals(userId)
        : await storageUtils.getMonthlyGoals();
      return NextResponse.json(goals);
    }
  } catch (error) {
    console.error('Error getting monthly goals:', error);
    return NextResponse.json({ error: 'Failed to get monthly goals' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const goal: MonthlyGoal = await request.json();
    await storageUtils.saveMonthlyGoal(goal);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error saving monthly goal:', error);
    return NextResponse.json({ error: 'Failed to save monthly goal' }, { status: 500 });
  }
}
