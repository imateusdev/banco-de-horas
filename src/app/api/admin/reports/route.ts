import { NextRequest } from 'next/server';
import { withAdminAccess } from '@/lib/server/auth';
import { getAllAIReports, getAIReportsByUser, deleteAIReport } from '@/lib/server/firestore';

export async function GET(request: NextRequest) {
  return withAdminAccess(request, async () => {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    try {
      const reports = userId
        ? await getAIReportsByUser(userId)
        : await getAllAIReports();

      return Response.json({ success: true, reports });
    } catch (error: any) {
      console.error('Error fetching reports:', error);
      return Response.json(
        { error: 'Failed to fetch reports', details: error.message },
        { status: 500 }
      );
    }
  });
}

export async function DELETE(request: NextRequest) {
  return withAdminAccess(request, async () => {
    const { searchParams } = new URL(request.url);
    const reportId = searchParams.get('reportId');

    if (!reportId) {
      return Response.json({ error: 'reportId is required' }, { status: 400 });
    }

    try {
      await deleteAIReport(reportId);
      return Response.json({ success: true });
    } catch (error: any) {
      console.error('Error deleting report:', error);
      return Response.json(
        { error: 'Failed to delete report', details: error.message },
        { status: 500 }
      );
    }
  });
}
