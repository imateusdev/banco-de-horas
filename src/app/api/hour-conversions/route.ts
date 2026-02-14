import { NextRequest } from 'next/server';
import { badRequest } from '@/lib/server/auth';
import {
  withAuth,
  withUserAccess,
  getQueryParam,
  getJsonBody,
  successResponse,
} from '@/lib/server/api-helpers';
import { getUserHourConversions, createHourConversion } from '@/lib/server/firestore';
import { HourConversion } from '@/types';

export async function GET(request: NextRequest) {
  return withUserAccess(
    request,
    (req) => getQueryParam(req, 'userId'),
    async (user, userId) => {
      const conversions = await getUserHourConversions(userId);
      return Response.json(conversions);
    },
    'Forbidden - You can only access your own hour conversions'
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
        { error: 'Forbidden - You can only create your own hour conversions' },
        { status: 403 }
      );
    }

    const { validateDate, validateConversionType, validateNumber } =
      await import('@/lib/server/validation');

    if (!validateDate(body.date)) {
      return badRequest('Invalid date format. Use YYYY-MM-DD');
    }

    if (!validateConversionType(body.type)) {
      return badRequest('Invalid type. Must be "money" or "time_off"');
    }

    const conversion: HourConversion = {
      id: body.id || crypto.randomUUID(),
      userId: targetUserId,
      hours: validateNumber(body.hours, 0, 1000),
      amount: validateNumber(body.amount, 0, 999999),
      type: body.type,
      date: body.date,
      status: (isAdminUser ? 'approved' : 'pending') as 'approved' | 'pending',
      requestedBy: user.uid,
      approvedBy: isAdminUser ? user.uid : undefined,
      approvedAt: isAdminUser ? new Date().toISOString() : undefined,
      createdAt: new Date().toISOString(),
    };

    await createHourConversion(conversion);
    return successResponse({ success: true }, 201);
  });
}
