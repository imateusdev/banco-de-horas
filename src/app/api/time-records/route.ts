import { NextRequest } from 'next/server';
import { getUserFromRequest, unauthorized, badRequest, serverError, canAccessUserData, isAdmin } from '@/lib/server/auth';
import {
  getTimeRecordsByUser,
  getAllTimeRecords,
  createTimeRecord,
  updateTimeRecord,
  deleteTimeRecord,
} from '@/lib/server/firestore';

export async function GET(request: NextRequest) {
  try {
    const user = await getUserFromRequest(request);
    if (!user) return unauthorized();

    const { searchParams } = new URL(request.url);
    const targetUserId = searchParams.get('userId');

    // Se admin requisitou todos os registros (sem userId específico)
    if (!targetUserId && isAdmin(user)) {
      const allRecords = await getAllTimeRecords();
      return Response.json(allRecords);
    }

    // Define qual userId buscar
    const userIdToFetch = targetUserId || user.uid;

    // Verifica se pode acessar os dados desse usuário
    if (!canAccessUserData(user, userIdToFetch)) {
      return Response.json(
        { error: 'Forbidden - You can only access your own records' },
        { status: 403 }
      );
    }

    const records = await getTimeRecordsByUser(userIdToFetch);
    return Response.json(records);
  } catch (error) {
    console.error('Error fetching time records:', error);
    return serverError('Failed to fetch time records');
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getUserFromRequest(request);
    if (!user) return unauthorized();

    const record = await request.json();

    // Collaborators só podem criar registros para si mesmos
    if (!canAccessUserData(user, record.userId)) {
      return Response.json(
        { error: 'Forbidden - You can only create records for yourself' },
        { status: 403 }
      );
    }

    await createTimeRecord(record);
    return Response.json({ success: true }, { status: 201 });
  } catch (error) {
    console.error('Error creating time record:', error);
    return serverError('Failed to create time record');
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const user = await getUserFromRequest(request);
    if (!user) return unauthorized();

    const { id, userId, ...updates } = await request.json();

    if (!id) {
      return badRequest('Record ID is required');
    }

    // Verifica se pode modificar registros desse usuário
    if (!canAccessUserData(user, userId)) {
      return Response.json(
        { error: 'Forbidden - You can only update your own records' },
        { status: 403 }
      );
    }

    await updateTimeRecord(id, userId, updates);
    return Response.json({ success: true });
  } catch (error: any) {
    console.error('Error updating time record:', error);
    if (error.message.includes('unauthorized')) {
      return unauthorized();
    }
    return serverError('Failed to update time record');
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const user = await getUserFromRequest(request);
    if (!user) return unauthorized();

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    const userId = searchParams.get('userId');

    if (!id) {
      return badRequest('Record ID is required');
    }

    if (!userId) {
      return badRequest('User ID is required');
    }

    // Verifica se pode deletar registros desse usuário
    if (!canAccessUserData(user, userId)) {
      return Response.json(
        { error: 'Forbidden - You can only delete your own records' },
        { status: 403 }
      );
    }

    await deleteTimeRecord(id, userId);
    return Response.json({ success: true });
  } catch (error: any) {
    console.error('Error deleting time record:', error);
    if (error.message.includes('unauthorized')) {
      return unauthorized();
    }
    return serverError('Failed to delete time record');
  }
}
