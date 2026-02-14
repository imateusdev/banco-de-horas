import { NextRequest } from 'next/server';
import { badRequest } from '@/lib/server/auth';
import { withAdminAccess, getJsonBody } from '@/lib/server/api-helpers';
import { adminAuth } from '@/lib/firebase/admin';
import { getPreAuthorizedEmails } from '@/lib/server/firestore';

export async function GET(request: NextRequest) {
  return withAdminAccess(request, async () => {
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
  });
}

export async function POST(request: NextRequest) {
  return withAdminAccess(request, async (user, req) => {
    const { email, role } = await getJsonBody<{ email: string; role?: string }>(req);

    const { validateEmail, validateRole } = await import('@/lib/server/validation');

    if (!email || !validateEmail(email)) {
      return badRequest('Invalid email address');
    }

    const targetRole = role || 'collaborator';
    if (!validateRole(targetRole)) {
      return badRequest('Invalid role. Must be "admin" or "collaborator"');
    }

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
  });
}

export async function DELETE(request: NextRequest) {
  return withAdminAccess(request, async (user, req) => {
    const { email } = await getJsonBody<{ email: string }>(req);

    const { validateEmail } = await import('@/lib/server/validation');

    if (!email || !validateEmail(email)) {
      return badRequest('Invalid email address');
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
  });
}
