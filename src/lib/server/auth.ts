import { NextRequest } from 'next/server';
import { adminAuth } from '@/lib/firebase/admin';

export type UserRole = 'admin' | 'collaborator';

export interface AuthenticatedUser {
  uid: string;
  email: string | undefined;
  role: UserRole;
}

export async function getUserFromRequest(request: NextRequest): Promise<AuthenticatedUser | null> {
  try {
    const authHeader = request.headers.get('Authorization');

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return null;
    }

    const token = authHeader.split('Bearer ')[1];
    const decodedToken = await adminAuth.verifyIdToken(token, true);

    if (!decodedToken.authorized) {
      console.warn(`Unauthorized access attempt by user: ${decodedToken.email}`);
      return null;
    }

    const role: UserRole = (decodedToken.role as UserRole) || 'collaborator';

    return {
      uid: decodedToken.uid,
      email: decodedToken.email,
      role,
    };
  } catch (error) {
    console.error('Error verifying token:', error);
    return null;
  }
}

export async function getUserIdFromRequest(request: NextRequest): Promise<string | null> {
  const user = await getUserFromRequest(request);
  return user?.uid || null;
}

export function isAdmin(user: AuthenticatedUser): boolean {
  return user.role === 'admin';
}

export function canAccessUserData(
  authenticatedUser: AuthenticatedUser,
  targetUserId: string
): boolean {
  if (isAdmin(authenticatedUser)) {
    return true;
  }

  return authenticatedUser.uid === targetUserId;
}

export function unauthorized() {
  return Response.json({ error: 'Unauthorized' }, { status: 401 });
}

export function badRequest(message: string) {
  return Response.json({ error: message }, { status: 400 });
}

export function serverError(message: string) {
  return Response.json({ error: message }, { status: 500 });
}

export async function withAdminAccess(
  request: NextRequest,
  handler: (adminUserId: string) => Promise<Response>
): Promise<Response> {
  const user = await getUserFromRequest(request);

  if (!user) {
    return unauthorized();
  }

  if (!isAdmin(user)) {
    return Response.json({ error: 'Forbidden - Admin access required' }, { status: 403 });
  }

  return handler(user.uid);
}

export async function withUserAccess(
  request: NextRequest,
  handler: (userId: string) => Promise<Response>
): Promise<Response> {
  const user = await getUserFromRequest(request);

  if (!user) {
    return unauthorized();
  }

  return handler(user.uid);
}
