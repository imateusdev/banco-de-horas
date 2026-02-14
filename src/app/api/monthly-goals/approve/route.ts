import { NextRequest } from 'next/server';
import { withAdminAccess, getJsonBody } from '@/lib/server/api-helpers';
import { badRequest } from '@/lib/server/auth';
import { adminDb } from '@/lib/firebase/admin';
import { Timestamp } from 'firebase-admin/firestore';

export async function POST(request: NextRequest) {
  return withAdminAccess(request, async (user, req) => {
    const { goalId, action } = await getJsonBody<{
      goalId: string;
      action: 'approve' | 'reject';
    }>(req);

    if (!goalId || !action) {
      return badRequest('Missing goalId or action');
    }

    if (action !== 'approve' && action !== 'reject') {
      return badRequest('Invalid action. Must be "approve" or "reject"');
    }

    const goalRef = adminDb.collection('monthlyGoals').doc(goalId);
    const doc = await goalRef.get();

    if (!doc.exists) {
      return Response.json({ error: 'Goal not found' }, { status: 404 });
    }

    const data = doc.data();
    if (data?.status !== 'pending') {
      return badRequest('Goal is not pending');
    }

    await goalRef.update({
      status: action === 'approve' ? 'approved' : 'rejected',
      approvedBy: user.uid,
      approvedAt: Timestamp.now(),
    });

    return Response.json({
      success: true,
      message: `Goal ${action === 'approve' ? 'approved' : 'rejected'} successfully`,
    });
  });
}
