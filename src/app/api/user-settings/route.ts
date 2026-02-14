import { NextRequest } from 'next/server';
import { badRequest } from '@/lib/server/auth';
import { withAuth, withUserAccess, getQueryParam, getJsonBody } from '@/lib/server/api-helpers';
import { getUserSettings, createOrUpdateUserSettings } from '@/lib/server/firestore';

export async function GET(request: NextRequest) {
  return withUserAccess(
    request,
    (req) => getQueryParam(req, 'userId'),
    async (user, userId) => {
      const settings = await getUserSettings(userId);

      if (!settings) {
        return Response.json({
          userId,
          defaultStartTime: null,
          defaultEndTime: null,
          workingDays: 'weekdays',
          githubUsername: null,
          githubProjectId: null,
        });
      }

      return Response.json(settings);
    },
    'Forbidden - You can only access your own settings'
  );
}

export async function POST(request: NextRequest) {
  return withAuth(request, async (user, req) => {
    const body = await getJsonBody<{
      userId?: string;
      defaultStartTime?: string | null;
      defaultEndTime?: string | null;
      workingDays?: string;
      githubUsername?: string | null;
      githubProjectId?: string | null;
    }>(req);

    const { validateTime, validateWorkingDays } = await import('@/lib/server/validation');

    if (body.workingDays && !validateWorkingDays(body.workingDays)) {
      return badRequest('Invalid workingDays value. Must be "weekdays", "all", or "weekends"');
    }

    if (body.defaultStartTime && !validateTime(body.defaultStartTime)) {
      return badRequest('Invalid defaultStartTime format. Use HH:MM');
    }

    if (body.defaultEndTime && !validateTime(body.defaultEndTime)) {
      return badRequest('Invalid defaultEndTime format. Use HH:MM');
    }

    await createOrUpdateUserSettings(user.uid, {
      defaultStartTime: body.defaultStartTime,
      defaultEndTime: body.defaultEndTime,
      workingDays: body.workingDays as 'weekdays' | 'all' | undefined,
      githubUsername: body.githubUsername,
      githubProjectId: body.githubProjectId,
    });

    const settings = await getUserSettings(user.uid);
    return Response.json(settings);
  });
}
