import { NextRequest } from 'next/server';
import { withUserAccess, getQueryParam, getJsonBody, successResponse } from '@/lib/server/api-helpers';
import { getUserMonthlyGoals, getUserMonthlyGoal, saveMonthlyGoal } from '@/lib/server/firestore';

export async function GET(request: NextRequest) {
  return withUserAccess(
    request,
    (req) => getQueryParam(req, 'userId'),
    async (user, userId, req) => {
      const month = getQueryParam(req, 'month');

      if (month) {
        const goal = await getUserMonthlyGoal(userId, month);
        return Response.json({ goal });
      } else {
        const goals = await getUserMonthlyGoals(userId);
        return Response.json(goals);
      }
    },
    'Forbidden - You can only access your own monthly goals'
  );
}

export async function POST(request: NextRequest) {
  return withUserAccess(
    request,
    async (req) => {
      const body = await getJsonBody<{ userId: string }>(req);
      return body.userId;
    },
    async (user, userId, req) => {
      const goal = await getJsonBody<any>(req);
      await saveMonthlyGoal(goal);
      return successResponse({ success: true }, 201);
    },
    'Forbidden - You can only create your own monthly goals'
  );
}
