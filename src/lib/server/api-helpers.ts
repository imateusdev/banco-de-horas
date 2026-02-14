import { NextRequest } from 'next/server';
import { getUserFromRequest, canAccessUserData, isAdmin, unauthorized, serverError } from './auth';

export async function withAuth<T>(
  request: NextRequest,
  handler: (user: any, request: NextRequest) => Promise<T>
): Promise<Response | T> {
  try {
    const user = await getUserFromRequest(request);
    if (!user) return unauthorized();

    return await handler(user, request);
  } catch (error) {
    console.error('API Error:', error);
    return serverError('Request failed');
  }
}

export async function withUserAccess<T>(
  request: NextRequest,
  getUserId: (request: NextRequest) => string | null | Promise<string | null>,
  handler: (user: any, userId: string, request: NextRequest) => Promise<T>,
  forbiddenMessage: string = 'Forbidden - You can only access your own data'
): Promise<Response | T> {
  return withAuth(request, async (user, req) => {
    const targetUserId = (await getUserId(req)) || user.uid;

    if (!canAccessUserData(user, targetUserId)) {
      return Response.json({ error: forbiddenMessage }, { status: 403 });
    }

    return await handler(user, targetUserId, req);
  });
}

export async function withAdminAccess<T>(
  request: NextRequest,
  handler: (user: any, request: NextRequest) => Promise<T>
): Promise<Response | T> {
  return withAuth(request, async (user, req) => {
    if (!isAdmin(user)) {
      return Response.json({ error: 'Forbidden - Admin access required' }, { status: 403 });
    }

    return await handler(user, req);
  });
}

export function getQueryParam(request: NextRequest, param: string): string | null {
  const { searchParams } = new URL(request.url);
  return searchParams.get(param);
}

export async function getJsonBody<T>(request: NextRequest): Promise<T> {
  return await request.json();
}

export function successResponse(data: any = { success: true }, status: number = 200) {
  return Response.json(data, { status });
}
