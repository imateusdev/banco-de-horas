import { NextRequest } from 'next/server';
import { getUserFromRequest, isAdmin, unauthorized, badRequest, serverError } from '@/lib/server/auth';
import { adminAuth } from '@/lib/firebase/admin';

export async function POST(request: NextRequest) {
  try {
    const user = await getUserFromRequest(request);
    if (!user) return unauthorized();
    if (!isAdmin(user)) {
      return Response.json({ error: 'Forbidden - Admin access required' }, { status: 403 });
    }

    const { email } = await request.json();

    if (!email) {
      return badRequest('Email is required');
    }

    // Buscar usuário pelo email
    let targetUser;
    try {
      targetUser = await adminAuth.getUserByEmail(email);
    } catch (error) {
      return Response.json({ error: 'Usuário não encontrado' }, { status: 404 });
    }

    // Verificar se está autorizado
    if (!targetUser.customClaims?.authorized) {
      return Response.json({ error: 'Usuário não está autorizado' }, { status: 400 });
    }

    // Verificar se não é admin
    if (targetUser.customClaims.role !== 'admin') {
      return Response.json({ error: 'Usuário não é administrador' }, { status: 400 });
    }

    // Verificar se é o último admin
    const listUsersResult = await adminAuth.listUsers();
    const adminCount = listUsersResult.users.filter(
      (u) => u.customClaims?.authorized && u.customClaims?.role === 'admin'
    ).length;

    if (adminCount <= 1) {
      return Response.json(
        { error: 'Não é possível rebaixar o último administrador' },
        { status: 400 }
      );
    }

    // Rebaixar para collaborator
    await adminAuth.setCustomUserClaims(targetUser.uid, {
      ...targetUser.customClaims,
      role: 'collaborator',
    });

    return Response.json({
      success: true,
      message: `Usuário ${email} rebaixado para colaborador`,
    });
  } catch (error) {
    console.error('Error demoting user:', error);
    return serverError('Failed to demote user');
  }
}
