import { NextRequest } from 'next/server';
import {
  getUserFromRequest,
  canAccessUserData,
  unauthorized,
  badRequest,
  serverError,
} from '@/lib/server/auth';
import { getUserSettings, createOrUpdateUserSettings } from '@/lib/server/firestore';

export async function GET(request: NextRequest) {
  try {
    const user = await getUserFromRequest(request);
    if (!user) return unauthorized();

    const { searchParams } = new URL(request.url);
    const targetUserId = searchParams.get('userId') || user.uid;

    if (!canAccessUserData(user, targetUserId)) {
      return Response.json(
        { error: 'Forbidden - You can only access your own settings' },
        { status: 403 }
      );
    }

    const settings = await getUserSettings(targetUserId);

    if (!settings) {
      return Response.json({
        userId: targetUserId,
        defaultStartTime: null,
        defaultEndTime: null,
        workingDays: 'weekdays',
      });
    }

    return Response.json(settings);
  } catch (error) {
    console.error('Error fetching user settings:', error);
    return serverError('Failed to fetch user settings');
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getUserFromRequest(request);
    if (!user) return unauthorized();

    const { defaultStartTime, defaultEndTime, workingDays } = await request.json();

    if (!canAccessUserData(user, user.uid)) {
      return Response.json(
        { error: 'Forbidden - You can only update your own settings' },
        { status: 403 }
      );
    }

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
      workingDays: workingDays || 'weekdays',
    });

    const settings = await getUserSettings(user.uid);
    return Response.json(settings);
  } catch (error) {
    console.error('Error saving user settings:', error);
    return serverError('Failed to save user settings');
  }
}
