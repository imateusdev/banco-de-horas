import { NextRequest, NextResponse } from 'next/server';
import { storageUtils } from '@/lib/storage';

export async function GET(request: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  try {
    const resolvedParams = await params;
    const user = await storageUtils.getUserBySlug(resolvedParams.slug);
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }
    return NextResponse.json(user);
  } catch (error) {
    console.error('Error getting user by slug:', error);
    return NextResponse.json({ error: 'Failed to get user' }, { status: 500 });
  }
}
