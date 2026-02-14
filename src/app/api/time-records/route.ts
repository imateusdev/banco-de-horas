import { NextRequest } from 'next/server';
import { badRequest, isAdmin } from '@/lib/server/auth';
import { withAuth, withUserAccess, getQueryParam, getJsonBody, successResponse } from '@/lib/server/api-helpers';
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
  return withUserAccess(
    request,
    async (req) => {
      const body = await getJsonBody<{ userId: string }>(req);
      return body.userId;
    },
    async (user, userId, req) => {
      const record = await getJsonBody<any>(req);
      await createTimeRecord(record);
      return successResponse({ success: true }, 201);
    },
    'Forbidden - You can only create records for yourself'
  );
}

export async function PATCH(request: NextRequest) {
  return withUserAccess(
    request,
    async (req) => {
      const body = await getJsonBody<{ userId: string }>(req);
      return body.userId;
    },
    async (user, userId, req) => {
      const { id, ...updates } = await getJsonBody<{ id: string; [key: string]: any }>(req);

      if (!id) {
        return badRequest('Record ID is required');
      }

      await updateTimeRecord(id, userId, updates);
      return successResponse();
    },
    'Forbidden - You can only update your own records'
  );
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
