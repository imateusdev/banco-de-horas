import { NextRequest } from 'next/server';
import {
  getUserFromRequest,
  canAccessUserData,
  unauthorized,
  serverError,
} from '@/lib/server/auth';
import { getUserHourConversions, createHourConversion } from '@/lib/server/firestore';

export async function GET(request: NextRequest) {
  try {
    const user = await getUserFromRequest(request);
    if (!user) return unauthorized();

    const { searchParams } = new URL(request.url);
    const targetUserId = searchParams.get('userId') || user.uid;

    if (!canAccessUserData(user, targetUserId)) {
      return Response.json(
        { error: 'Forbidden - You can only access your own hour conversions' },
        { status: 403 }
      );
    }

    const conversions = await getUserHourConversions(targetUserId);
    return Response.json(conversions);
  } catch (error) {
    console.error('Error fetching hour conversions:', error);
    return serverError('Failed to fetch hour conversions');
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getUserFromRequest(request);
    if (!user) return unauthorized();

    const conversion = await request.json();

    if (!canAccessUserData(user, conversion.userId)) {
      return Response.json(
        { error: 'Forbidden - You can only create your own hour conversions' },
        { status: 403 }
      );
    }

    await createHourConversion(conversion);
    return Response.json({ success: true }, { status: 201 });
  } catch (error) {
    console.error('Error creating hour conversion:', error);
    return serverError('Failed to create hour conversion');
  }
}
