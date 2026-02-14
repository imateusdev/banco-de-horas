import { NextRequest } from 'next/server';
import { badRequest } from '@/lib/server/auth';
import {
  withAuth,
  withUserAccess,
  getQueryParam,
  getJsonBody,
  successResponse,
} from '@/lib/server/api-helpers';
import {
  getUserMonthlyGoals,
  getUserMonthlyGoal,
  getUserMonthlyGoalWithStatus,
  saveMonthlyGoal,
} from '@/lib/server/firestore';
import { MonthlyGoal } from '@/types';

export async function GET(request: NextRequest) {
  return withUserAccess(
    request,
    (req) => getQueryParam(req, 'userId'),
    async (user, userId, req) => {
      const month = getQueryParam(req, 'month');
      const withStatus = getQueryParam(req, 'withStatus');

      if (month) {
        const { validateMonth } = await import('@/lib/server/validation');
        if (!validateMonth(month)) {
          return badRequest('Invalid month format. Use YYYY-MM');
        }

        if (withStatus === 'true') {
          const goalData = await getUserMonthlyGoalWithStatus(userId, month);
          return Response.json({ goal: goalData });
        } else {
          const goal = await getUserMonthlyGoal(userId, month);
          return Response.json({ goal });
        }
      } else {
        const goals = await getUserMonthlyGoals(userId);
        return Response.json(goals);
      }
    },
    'Forbidden - You can only access your own monthly goals'
  );
}

export async function POST(request: NextRequest) {
  return withAuth(request, async (user, req) => {
    const body = await getJsonBody<any>(req);
    const targetUserId = body.userId || user.uid;

    const { canAccessUserData, isAdmin } = await import('@/lib/server/auth');
    const isAdminUser = isAdmin(user);

    if (!canAccessUserData(user, targetUserId)) {
      return Response.json(
        { error: 'Forbidden - You can only create your own monthly goals' },
        { status: 403 }
      );
    }

    const { validateMonth, validateNumber } = await import('@/lib/server/validation');

    if (!validateMonth(body.month)) {
      return badRequest('Invalid month format. Use YYYY-MM');
    }

    const goal: MonthlyGoal = {
      id: body.id || `${targetUserId}-${body.month}`,
      userId: targetUserId,
      month: body.month,
      hoursGoal: validateNumber(body.hoursGoal, 0, 500),
      status: (isAdminUser ? 'approved' : 'pending') as 'approved' | 'pending',
      requestedBy: user.uid,
      approvedBy: isAdminUser ? user.uid : undefined,
      approvedAt: isAdminUser ? new Date().toISOString() : undefined,
      createdAt: new Date().toISOString(),
    };

    await saveMonthlyGoal(goal);
    return successResponse({ success: true }, 201);
  });
}
