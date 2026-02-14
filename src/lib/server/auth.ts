import { NextRequest } from 'next/server';
import { adminAuth } from '@/lib/firebase/admin';

export type UserRole = 'admin' | 'collaborator';

export interface AuthenticatedUser {
  uid: string;
  email: string | undefined;
  role: UserRole;
}

export async function getUserFromRequest(request: NextRequest): Promise<AuthenticatedUser | null> {
  try {
    const authHeader = request.headers.get('Authorization');

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return null;
    }

    const token = authHeader.split('Bearer ')[1];
    const decodedToken = await adminAuth.verifyIdToken(token);

    // Verificar se o usuário tem a custom claim 'authorized'
    if (!decodedToken.authorized) {
      console.warn(`Unauthorized access attempt by user: ${decodedToken.email}`);
      return null;
    }

    // Extrair role (padrão: collaborator)
    const role: UserRole = (decodedToken.role as UserRole) || 'collaborator';

    return {
      uid: decodedToken.uid,
      email: decodedToken.email,
      role,
    };
  } catch (error) {
    console.error('Error verifying token:', error);
    return null;
  }
}

// Função de compatibilidade (mantida para não quebrar código existente)
export async function getUserIdFromRequest(request: NextRequest): Promise<string | null> {
  const user = await getUserFromRequest(request);
  return user?.uid || null;
}

// Verifica se o usuário é admin
export function isAdmin(user: AuthenticatedUser): boolean {
  return user.role === 'admin';
}

// Verifica se o usuário pode acessar dados de outro usuário
export function canAccessUserData(authenticatedUser: AuthenticatedUser, targetUserId: string): boolean {
  // Admins podem acessar dados de qualquer usuário
  if (isAdmin(authenticatedUser)) {
    return true;
  }

  // Collaborators só podem acessar seus próprios dados
  return authenticatedUser.uid === targetUserId;
}

export function unauthorized() {
  return Response.json({ error: 'Unauthorized' }, { status: 401 });
}

export function badRequest(message: string) {
  return Response.json({ error: message }, { status: 400 });
}

export function serverError(message: string) {
  return Response.json({ error: message }, { status: 500 });
}
