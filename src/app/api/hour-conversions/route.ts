import { NextRequest } from 'next/server';
import { withUserAccess, getQueryParam, getJsonBody, successResponse } from '@/lib/server/api-helpers';
import { getUserHourConversions, createHourConversion } from '@/lib/server/firestore';

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
  return withUserAccess(
    request,
    async (req) => {
      const body = await getJsonBody<{ userId: string }>(req);
      return body.userId;
    },
    async (user, userId, req) => {
      const conversion = await getJsonBody<any>(req);
      await createHourConversion(conversion);
      return successResponse({ success: true }, 201);
    },
    'Forbidden - You can only create your own hour conversions'
  );
}
