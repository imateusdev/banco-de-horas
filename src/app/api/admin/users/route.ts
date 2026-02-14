import { NextRequest } from 'next/server';
import {
  getUserFromRequest,
  isAdmin,
  unauthorized,
  badRequest,
  serverError,
} from '@/lib/server/auth';
import { adminAuth } from '@/lib/firebase/admin';
import { getPreAuthorizedEmails } from '@/lib/server/firestore';

export async function GET(request: NextRequest) {
  try {
    const user = await getUserFromRequest(request);
    if (!user) return unauthorized();
    if (!isAdmin(user)) {
      return Response.json({ error: 'Forbidden - Admin access required' }, { status: 403 });
    }

    const listUsersResult = await adminAuth.listUsers();
    const authorizedUsers = [];

    for (const authUser of listUsersResult.users) {
      if (authUser.customClaims?.authorized) {
        authorizedUsers.push({
          uid: authUser.uid,
          email: authUser.email,
          displayName: authUser.displayName,
          role: authUser.customClaims.role || 'collaborator',
          status: 'active',
        });
      }
    }

    const preAuthorizedEmails = await getPreAuthorizedEmails();
    const preAuthorizedUsers = preAuthorizedEmails.map((preAuth) => ({
      email: preAuth.email,
      role: preAuth.role,
      status: 'pending',
      addedBy: preAuth.addedBy,
      addedAt: preAuth.addedAt,
    }));

    const allUsers = [...authorizedUsers, ...preAuthorizedUsers];
    allUsers.sort((a, b) => {
      if (a.status === 'active' && b.status !== 'active') return -1;
      if (a.status !== 'active' && b.status === 'active') return 1;

      if (a.role === 'admin' && b.role !== 'admin') return -1;
      if (a.role !== 'admin' && b.role === 'admin') return 1;

      return (a.email || '').localeCompare(b.email || '');
    });

    return Response.json({ users: allUsers });
  } catch (error) {
    console.error('Error listing users:', error);
    return serverError('Failed to list users');
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getUserFromRequest(request);
    if (!user) return unauthorized();
    if (!isAdmin(user)) {
      return Response.json({ error: 'Forbidden - Admin access required' }, { status: 403 });
    }

    const { email, role } = await request.json();

    if (!email) {
      return badRequest('Email is required');
    }

    if (role && !['admin', 'collaborator'].includes(role)) {
      return badRequest('Invalid role');
    }

    const targetRole = role || 'collaborator';

    let targetUser;
    try {
      targetUser = await adminAuth.getUserByEmail(email);
    } catch {
      const { addPreAuthorizedEmail } = await import('@/lib/server/firestore');
      await addPreAuthorizedEmail(email, targetRole, user.email || user.uid);

      return Response.json({
        success: true,
        message: `Email ${email} pré-autorizado como ${targetRole}. Quando o usuário fizer login será autorizado automaticamente.`,
        preAuthorized: true,
      });
    }

    if (targetUser.customClaims?.authorized) {
      return Response.json({ error: 'Usuário já está autorizado' }, { status: 400 });
    }

    await adminAuth.setCustomUserClaims(targetUser.uid, {
      authorized: true,
      role: targetRole,
    });

    return Response.json({
      success: true,
      message: `Usuário ${email} autorizado como ${targetRole}`,
    });
  } catch (error) {
    console.error('Error authorizing user:', error);
    return serverError('Failed to authorize user');
  }
}

export async function DELETE(request: NextRequest) {
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

    let targetUser;
    try {
      targetUser = await adminAuth.getUserByEmail(email);
    } catch {
      const { getPreAuthorizedEmail, removePreAuthorizedEmail } =
        await import('@/lib/server/firestore');
      const preAuth = await getPreAuthorizedEmail(email);

      if (preAuth) {
        await removePreAuthorizedEmail(email);
        return Response.json({
          success: true,
          message: `Email ${email} removido da lista de pré-autorizados`,
        });
      }

      return Response.json({ error: 'Email não encontrado' }, { status: 404 });
    }

    if (targetUser.customClaims?.role === 'admin') {
      const listUsersResult = await adminAuth.listUsers();
      const adminCount = listUsersResult.users.filter(
        (u) => u.customClaims?.authorized && u.customClaims?.role === 'admin'
      ).length;

      if (adminCount <= 1) {
        return Response.json(
          { error: 'Não é possível remover o último administrador' },
          { status: 400 }
        );
      }
    }

    await adminAuth.setCustomUserClaims(targetUser.uid, {
      authorized: false,
      role: null,
    });

    const { getPreAuthorizedEmail, removePreAuthorizedEmail } =
      await import('@/lib/server/firestore');
    const preAuth = await getPreAuthorizedEmail(email);
    if (preAuth) {
      await removePreAuthorizedEmail(email);
    }

    return Response.json({
      success: true,
      message: `Autorização de ${email} removida`,
    });
  } catch (error) {
    console.error('Error removing user:', error);
    return serverError('Failed to remove user');
  }
}
