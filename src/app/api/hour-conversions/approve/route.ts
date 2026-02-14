import { NextRequest } from 'next/server';
import { withAdminAccess, getJsonBody } from '@/lib/server/api-helpers';
import { badRequest } from '@/lib/server/auth';
import { adminDb } from '@/lib/firebase/admin';
import { Timestamp } from 'firebase-admin/firestore';

export async function POST(request: NextRequest) {
  return withAdminAccess(request, async (user, req) => {
    const { conversionId, action } = await getJsonBody<{
      conversionId: string;
      action: 'approve' | 'reject';
    }>(req);

    if (!conversionId || !action) {
      return badRequest('Missing conversionId or action');
    }

    if (action !== 'approve' && action !== 'reject') {
      return badRequest('Invalid action. Must be "approve" or "reject"');
    }

    const conversionRef = adminDb.collection('hourConversions').doc(conversionId);
    const doc = await conversionRef.get();

    if (!doc.exists) {
      return Response.json({ error: 'Conversion not found' }, { status: 404 });
    }

    const data = doc.data();
    if (data?.status !== 'pending') {
      return badRequest('Conversion is not pending');
    }

    await conversionRef.update({
      status: action === 'approve' ? 'approved' : 'rejected',
      approvedBy: user.uid,
      approvedAt: Timestamp.now(),
    });

    return Response.json({
      success: true,
      message: `Conversion ${action === 'approve' ? 'approved' : 'rejected'} successfully`,
    });
  });
}
