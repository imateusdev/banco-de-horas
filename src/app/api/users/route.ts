import { NextRequest } from 'next/server';
import { getUserFromRequest, canAccessUserData, unauthorized, badRequest, serverError } from '@/lib/server/auth';
import { createUser, getUser } from '@/lib/server/firestore';
import { adminAuth } from '@/lib/firebase/admin';

export async function GET(request: NextRequest) {
  try {
    const user = await getUserFromRequest(request);
    if (!user) return unauthorized();

    const { searchParams } = new URL(request.url);
    const targetUserId = searchParams.get('userId') || user.uid;

    // Check if user can access this data
    if (!canAccessUserData(user, targetUserId)) {
      return Response.json({ error: 'Forbidden - You can only access your own user data' }, { status: 403 });
    }

    const userData = await getUser(targetUserId);
    return Response.json(userData);
  } catch (error) {
    console.error('Error fetching user:', error);
    return serverError('Failed to fetch user');
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getUserFromRequest(request);
    if (!user) return unauthorized();

    const userData = await request.json();

    // Users can only create their own user record
    if (!canAccessUserData(user, userData.id)) {
      return Response.json({ error: 'Forbidden - You can only create your own user record' }, { status: 403 });
    }

    await createUser(user.uid, userData);
    return Response.json({ success: true }, { status: 201 });
  } catch (error) {
    console.error('Error creating user:', error);
    return serverError('Failed to create user');
  }
}
