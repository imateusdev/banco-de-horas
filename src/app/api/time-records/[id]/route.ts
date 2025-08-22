import { NextRequest, NextResponse } from 'next/server';
import { storageUtils } from '@/lib/storage';
import { TimeRecord } from '@/types';

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const resolvedParams = await params;
    const updatedRecord: Partial<TimeRecord> = await request.json();
    await storageUtils.updateTimeRecord(resolvedParams.id, updatedRecord);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error updating time record:', error);
    return NextResponse.json({ error: 'Failed to update time record' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const resolvedParams = await params;
    await storageUtils.deleteTimeRecord(resolvedParams.id);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting time record:', error);
    return NextResponse.json({ error: 'Failed to delete time record' }, { status: 500 });
  }
}
