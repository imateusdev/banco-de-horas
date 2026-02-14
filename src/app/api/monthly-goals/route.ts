import { NextRequest } from 'next/server';
import { getUserFromRequest, canAccessUserData, unauthorized, badRequest, serverError } from '@/lib/server/auth';
import { getUserMonthlyGoals, getUserMonthlyGoal, saveMonthlyGoal } from '@/lib/server/firestore';

export async function GET(request: NextRequest) {
  try {
    const user = await getUserFromRequest(request);
    if (!user) return unauthorized();

    const { searchParams } = new URL(request.url);
    const month = searchParams.get('month');
    const targetUserId = searchParams.get('userId') || user.uid;

    // Check if user can access this data
    if (!canAccessUserData(user, targetUserId)) {
      return Response.json({ error: 'Forbidden - You can only access your own monthly goals' }, { status: 403 });
    }

    if (month) {
      const goal = await getUserMonthlyGoal(targetUserId, month);
      return Response.json({ goal });
    } else {
      const goals = await getUserMonthlyGoals(targetUserId);
      return Response.json(goals);
    }
  } catch (error) {
    console.error('Error fetching monthly goals:', error);
    return serverError('Failed to fetch monthly goals');
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getUserFromRequest(request);
    if (!user) return unauthorized();

    const goal = await request.json();

    // Check if user can create this goal
    if (!canAccessUserData(user, goal.userId)) {
      return Response.json({ error: 'Forbidden - You can only create your own monthly goals' }, { status: 403 });
    }

    await saveMonthlyGoal(goal);
    return Response.json({ success: true }, { status: 201 });
  } catch (error) {
    console.error('Error saving monthly goal:', error);
    return serverError('Failed to save monthly goal');
  }
}
