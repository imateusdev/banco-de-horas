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
        });
      }

      return Response.json(settings);
    },
    'Forbidden - You can only access your own settings'
  );
}

export async function POST(request: NextRequest) {
  return withAuth(request, async (user, req) => {
    const { defaultStartTime, defaultEndTime, workingDays } = await getJsonBody<{
      defaultStartTime?: string | null;
      defaultEndTime?: string | null;
      workingDays?: string;
    }>(req);

    if (workingDays && !['weekdays', 'all', 'weekends'].includes(workingDays)) {
      return badRequest('Invalid workingDays value');
    }

    const timeRegex = /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/;
    if (defaultStartTime && !timeRegex.test(defaultStartTime)) {
      return badRequest('Invalid defaultStartTime format (use HH:MM)');
    }
    if (defaultEndTime && !timeRegex.test(defaultEndTime)) {
      return badRequest('Invalid defaultEndTime format (use HH:MM)');
    }

    await createOrUpdateUserSettings(user.uid, {
      defaultStartTime,
      defaultEndTime,
      workingDays: (workingDays || 'weekdays') as 'weekdays' | 'all' | 'weekends',
    });

    const settings = await getUserSettings(user.uid);
    return Response.json(settings);
  });
}
