import { NextRequest, NextResponse } from 'next/server';
import { storageUtils } from '@/lib/storage';
import { TimeRecord } from '@/types';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    const records = userId 
      ? await storageUtils.getUserTimeRecords(userId)
      : await storageUtils.getTimeRecords();
      
    return NextResponse.json(records);
  } catch (error) {
    console.error('Error getting time records:', error);
    return NextResponse.json({ error: 'Failed to get time records' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const record: TimeRecord = await request.json();
    await storageUtils.saveTimeRecord(record);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error saving time record:', error);
    return NextResponse.json({ error: 'Failed to save time record' }, { status: 500 });
  }
}
