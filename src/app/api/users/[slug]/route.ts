import { NextRequest, NextResponse } from 'next/server';
import { getUserFromRequest, isAdmin, unauthorized, serverError } from '@/lib/server/auth';
import { adminAuth } from '@/lib/firebase/admin';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    // Verificar autenticação
    const authUser = await getUserFromRequest(request);
    if (!authUser) return unauthorized();

    const resolvedParams = await params;
    const userId = resolvedParams.slug;

    // Apenas admins podem ver dados de outros usuários
    if (!isAdmin(authUser) && authUser.uid !== userId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Buscar usuário no Firebase Auth
    const userRecord = await adminAuth.getUser(userId);

    return NextResponse.json({
      uid: userRecord.uid,
      email: userRecord.email,
      displayName: userRecord.displayName || null,
      photoURL: userRecord.photoURL || null,
    });
  } catch (error) {
    console.error('Error fetching user:', error);
    return serverError('Failed to fetch user');
  }
}
