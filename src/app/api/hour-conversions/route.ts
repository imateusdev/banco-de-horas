import { NextRequest, NextResponse } from 'next/server';
import { storageUtils } from '@/lib/storage';
import { HourConversion } from '@/types';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    const conversions = userId 
      ? await storageUtils.getUserHourConversions(userId)
      : await storageUtils.getHourConversions();
      
    return NextResponse.json(conversions);
  } catch (error) {
    console.error('Error getting hour conversions:', error);
    return NextResponse.json({ error: 'Failed to get hour conversions' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const conversion: HourConversion = await request.json();
    await storageUtils.saveHourConversion(conversion);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error saving hour conversion:', error);
    return NextResponse.json({ error: 'Failed to save hour conversion' }, { status: 500 });
  }
}
