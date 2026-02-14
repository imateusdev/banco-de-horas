import { NextRequest } from 'next/server';
import { badRequest } from '@/lib/server/auth';
import { withAdminAccess, getJsonBody } from '@/lib/server/api-helpers';
import { adminAuth } from '@/lib/firebase/admin';

export async function POST(request: NextRequest) {
  return withAdminAccess(request, async (user, req) => {
    const { email } = await getJsonBody<{ email: string }>(req);

    if (!email) {
      return badRequest('Email is required');
    }

    let targetUser;
    try {
      targetUser = await adminAuth.getUserByEmail(email);
    } catch {
      return Response.json({ error: 'Usuário não encontrado' }, { status: 404 });
    }

    if (!targetUser.customClaims?.authorized) {
      return Response.json({ error: 'Usuário não está autorizado' }, { status: 400 });
    }

    if (targetUser.customClaims.role === 'admin') {
      return Response.json({ error: 'Usuário já é administrador' }, { status: 400 });
    }

    await adminAuth.setCustomUserClaims(targetUser.uid, {
      ...targetUser.customClaims,
      role: 'admin',
    });

    return Response.json({
      success: true,
      message: `Usuário ${email} promovido para administrador`,
    });
  });
}
