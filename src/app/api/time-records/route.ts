import { NextRequest } from 'next/server';
import { badRequest, isAdmin } from '@/lib/server/auth';
import {
  withAuth,
  withUserAccess,
  getQueryParam,
  getJsonBody,
  successResponse,
} from '@/lib/server/api-helpers';
import {
  getTimeRecordsByUser,
  getAllTimeRecords,
  createTimeRecord,
  updateTimeRecord,
  deleteTimeRecord,
} from '@/lib/server/firestore';

export async function GET(request: NextRequest) {
  return withAuth(request, async (user, req) => {
    const targetUserId = getQueryParam(req, 'userId');

    if (!targetUserId && isAdmin(user)) {
      const allRecords = await getAllTimeRecords();
      return Response.json(allRecords);
    }

    return withUserAccess(
      req,
      () => targetUserId,
      async (user, userId) => {
        const records = await getTimeRecordsByUser(userId);
        return Response.json(records);
      },
      'Forbidden - You can only access your own records'
    );
  });
}

export async function POST(request: NextRequest) {
  return withAuth(request, async (user, req) => {
    const body = await getJsonBody<any>(req);
    const targetUserId = body.userId || user.uid;

    const { canAccessUserData } = await import('@/lib/server/auth');
    if (!canAccessUserData(user, targetUserId)) {
      return Response.json(
        { error: 'Forbidden - You can only create records for yourself' },
        { status: 403 }
      );
    }

    const { validateDate, validateTime, validateRecordType, sanitizeString, validateNumber } =
      await import('@/lib/server/validation');

    if (!validateDate(body.date)) {
      return badRequest('Invalid date format. Use YYYY-MM-DD');
    }

    if (!validateTime(body.startTime)) {
      return badRequest('Invalid startTime format. Use HH:MM');
    }

    if (!validateTime(body.endTime)) {
      return badRequest('Invalid endTime format. Use HH:MM');
    }

    if (!validateRecordType(body.type)) {
      return badRequest('Invalid type. Must be "work" or "overtime"');
    }

    const record = {
      id: body.id || crypto.randomUUID(),
      userId: targetUserId,
      name: sanitizeString(body.name, 100),
      date: body.date,
      type: body.type,
      startTime: body.startTime,
      endTime: body.endTime,
      totalHours: validateNumber(body.totalHours, 0, 24),
      description: body.description ? sanitizeString(body.description, 10000) : undefined,
      createdAt: new Date().toISOString(),
    };

    await createTimeRecord(record);
    return successResponse({ success: true }, 201);
  });
}

export async function PATCH(request: NextRequest) {
  return withAuth(request, async (user, req) => {
    const {
      id,
      userId: targetUserId,
      ...updates
    } = await getJsonBody<{ id: string; userId: string; [key: string]: any }>(req);

    if (!id) {
      return badRequest('Record ID is required');
    }

    const userId = targetUserId || user.uid;
    const { canAccessUserData } = await import('@/lib/server/auth');
    if (!canAccessUserData(user, userId)) {
      return Response.json(
        { error: 'Forbidden - You can only update your own records' },
        { status: 403 }
      );
    }

    const { validateDate, validateTime, validateRecordType, sanitizeString, validateNumber } =
      await import('@/lib/server/validation');

    const sanitizedUpdates: any = {};

    if (updates.name !== undefined) {
      sanitizedUpdates.name = sanitizeString(updates.name, 100);
    }

    if (updates.date !== undefined) {
      if (!validateDate(updates.date)) {
        return badRequest('Invalid date format. Use YYYY-MM-DD');
      }
      sanitizedUpdates.date = updates.date;
    }

    if (updates.type !== undefined) {
      if (!validateRecordType(updates.type)) {
        return badRequest('Invalid type. Must be "work" or "overtime"');
      }
      sanitizedUpdates.type = updates.type;
    }

    if (updates.startTime !== undefined) {
      if (!validateTime(updates.startTime)) {
        return badRequest('Invalid startTime format. Use HH:MM');
      }
      sanitizedUpdates.startTime = updates.startTime;
    }

    if (updates.endTime !== undefined) {
      if (!validateTime(updates.endTime)) {
        return badRequest('Invalid endTime format. Use HH:MM');
      }
      sanitizedUpdates.endTime = updates.endTime;
    }

    if (updates.totalHours !== undefined) {
      sanitizedUpdates.totalHours = validateNumber(updates.totalHours, 0, 24);
    }

    if (updates.description !== undefined) {
      sanitizedUpdates.description = updates.description
        ? sanitizeString(updates.description, 10000)
        : undefined;
    }

    await updateTimeRecord(id, userId, sanitizedUpdates);
    return successResponse();
  });
}

export async function DELETE(request: NextRequest) {
  return withUserAccess(
    request,
    (req) => getQueryParam(req, 'userId'),
    async (user, userId, req) => {
      const id = getQueryParam(req, 'id');

      if (!id) {
        return badRequest('Record ID is required');
      }

      if (!userId) {
        return badRequest('User ID is required');
      }

      await deleteTimeRecord(id, userId);
      return successResponse();
    },
    'Forbidden - You can only delete your own records'
  );
}
