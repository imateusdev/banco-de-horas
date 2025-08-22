import { NextRequest, NextResponse } from 'next/server';
import { storageUtils } from '@/lib/storage';
import { User } from '@/types';

export async function GET() {
  try {
    const users = await storageUtils.getUsers();
    return NextResponse.json(users);
  } catch (error) {
    console.error('Error getting users:', error);
    return NextResponse.json({ error: 'Failed to get users' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const user: User = await request.json();
    await storageUtils.saveUser(user);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error saving user:', error);
    return NextResponse.json({ error: 'Failed to save user' }, { status: 500 });
  }
}
