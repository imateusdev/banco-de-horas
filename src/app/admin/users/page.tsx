'use client';

import { useAuth } from '@/hooks/useAuth';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

interface AuthorizedUser {
  uid?: string;
  email: string;
  role: 'admin' | 'collaborator';
  displayName?: string;
  status: 'active' | 'pending';
  addedBy?: string;
  addedAt?: string;
}

export default function AdminUsersPage() {
  const { user, loading: authLoading, signOut } = useAuth();
  const router = useRouter();
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState<AuthorizedUser[]>([]);
  const [newUserEmail, setNewUserEmail] = useState('');
  const [newUserRole, setNewUserRole] = useState<'admin' | 'collaborator'>('collaborator');
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/');
    } else if (user) {
      checkAdminAndLoadUsers();
    }
  }, [user, authLoading]);

  const checkAdminAndLoadUsers = async () => {
    try {
      const token = await user!.getIdToken(true);
      const response = await fetch('/api/auth/check', {
        headers: { Authorization: `Bearer ${token}` },
      });

      const data = await response.json();

      if (!data.authorized || data.role !== 'admin') {
        router.push('/dashboard');
        return;
      }

      setIsAdmin(true);
      await loadUsers();
    } catch (error) {
      console.error('Error checking admin status:', error);
      router.push('/');
    } finally {
      setLoading(false);
    }
  };

  const loadUsers = async () => {
    try {
      const token = await user!.getIdToken();
      const response = await fetch('/api/admin/users', {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        const data = await response.json();
        setUsers(data.users || []);
      }
    } catch (error) {
      console.error('Error loading users:', error);
      setError('Erro ao carregar usuários');
    }
  };

  const handleAddUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setActionLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const token = await user!.getIdToken();
      const response = await fetch('/api/admin/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          email: newUserEmail,
          role: newUserRole,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Erro ao adicionar usuário');
      }

      setSuccess(
        `Usuário ${newUserEmail} adicionado com sucesso como ${newUserRole === 'admin' ? 'administrador' : 'colaborador'}`
      );
      setNewUserEmail('');
      setNewUserRole('collaborator');
      await loadUsers();
    } catch (error: any) {
      setError(error.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handlePromote = async (email: string) => {
    if (!confirm(`Promover ${email} para administrador?`)) return;

    setActionLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const token = await user!.getIdToken();
      const response = await fetch('/api/admin/users/promote', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Erro ao promover usuário');
      }

      setSuccess(`${email} promovido para administrador`);
      await loadUsers();
    } catch (error: any) {
      setError(error.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleDemote = async (email: string) => {
    if (!confirm(`Rebaixar ${email} para colaborador?`)) return;

    setActionLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const token = await user!.getIdToken();
      const response = await fetch('/api/admin/users/demote', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Erro ao rebaixar usuário');
      }

      setSuccess(`${email} rebaixado para colaborador`);
      await loadUsers();
    } catch (error: any) {
      setError(error.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleRemove = async (email: string) => {
    if (!confirm(`Remover autorização de ${email}? O usuário não poderá mais acessar o sistema.`))
      return;

    setActionLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const token = await user!.getIdToken();
      const response = await fetch('/api/admin/users', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Erro ao remover usuário');
      }

      setSuccess(`Autorização de ${email} removida`);
      await loadUsers();
    } catch (error: any) {
      setError(error.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleSignOut = async () => {
    await signOut();
    router.push('/');
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-white text-xl">Carregando...</div>
      </div>
    );
  }

  if (!isAdmin) {
    return null;
  }

  const activeAdmins = users.filter((u) => u.role === 'admin' && u.status === 'active');
  const activeCollaborators = users.filter(
    (u) => u.role === 'collaborator' && u.status === 'active'
  );
  const pendingAdmins = users.filter((u) => u.role === 'admin' && u.status === 'pending');
  const pendingCollaborators = users.filter(
    (u) => u.role === 'collaborator' && u.status === 'pending'
  );

  return (
    <div className="min-h-screen bg-gray-900">
      {}
      <header className="bg-gray-800 shadow-lg border-b border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <h1 className="text-2xl font-bold text-white">⏰ Banco de Horas - Admin</h1>
            <div className="flex items-center space-x-4">
              <span className="text-gray-400">{user?.email}</span>
              <button
                onClick={() => router.push('/dashboard')}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
              >
                Dashboard
              </button>
              <button
                onClick={handleSignOut}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
              >
                Sair
              </button>
            </div>
          </div>
        </div>
      </header>

      {}
      <main className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold text-white mb-2">👥 Gerenciador de Usuários</h2>
          <p className="text-gray-400">Autorize usuários e gerencie permissões</p>
        </div>

        {}
        {error && (
          <div className="mb-6 p-4 bg-red-500/10 border border-red-500/50 rounded-lg">
            <p className="text-red-400 text-center">{error}</p>
          </div>
        )}

        {success && (
          <div className="mb-6 p-4 bg-green-500/10 border border-green-500/50 rounded-lg">
            <p className="text-green-400 text-center">{success}</p>
          </div>
        )}

        {}
        <div className="bg-gray-800 rounded-xl p-6 border border-gray-700 mb-8">
          <h3 className="text-xl font-bold text-white mb-4">Autorizar Novo Usuário</h3>
          <form onSubmit={handleAddUser} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Email do Usuário
              </label>
              <input
                type="email"
                value={newUserEmail}
                onChange={(e) => setNewUserEmail(e.target.value)}
                placeholder="usuario@empresa.com"
                required
                className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <p className="mt-1 text-sm text-gray-400">
                Se o email não existir, será pré-autorizado para login futuro
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Tipo de Usuário
              </label>
              <select
                value={newUserRole}
                onChange={(e) => setNewUserRole(e.target.value as 'admin' | 'collaborator')}
                className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="collaborator">Colaborador (apenas suas horas)</option>
                <option value="admin">Administrador (todas as horas)</option>
              </select>
            </div>

            <button
              type="submit"
              disabled={actionLoading || !newUserEmail}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {actionLoading ? 'Autorizando...' : 'Autorizar Usuário'}
            </button>
          </form>
        </div>

        {}
        <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
          <h3 className="text-xl font-bold text-white mb-6">Usuários Autorizados</h3>

          {}
          {activeAdmins.length > 0 && (
            <div className="mb-8">
              <h4 className="text-lg font-semibold text-yellow-400 mb-4 flex items-center">
                <span className="mr-2">👑</span> Administradores Ativos ({activeAdmins.length})
              </h4>
              <div className="space-y-3">
                {activeAdmins.map((admin) => (
                  <div
                    key={admin.uid}
                    className="flex items-center justify-between p-4 bg-yellow-500/10 border border-yellow-500/30 rounded-lg"
                  >
                    <div>
                      <p className="text-white font-medium">{admin.email}</p>
                      {admin.displayName && (
                        <p className="text-gray-400 text-sm">{admin.displayName}</p>
                      )}
                    </div>
                    <div className="flex space-x-2">
                      {admin.uid && (
                        <button
                          onClick={() => router.push(`/admin/users/${admin.uid}`)}
                          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                        >
                          📊 Ver Dashboard
                        </button>
                      )}
                      <button
                        onClick={() => handleDemote(admin.email)}
                        disabled={actionLoading || activeAdmins.length === 1}
                        className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        title={
                          activeAdmins.length === 1
                            ? 'Não é possível rebaixar o último admin'
                            : 'Rebaixar para colaborador'
                        }
                      >
                        Rebaixar
                      </button>
                      <button
                        onClick={() => handleRemove(admin.email)}
                        disabled={actionLoading || activeAdmins.length === 1}
                        className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        title={
                          activeAdmins.length === 1
                            ? 'Não é possível remover o último admin'
                            : 'Remover autorização'
                        }
                      >
                        Remover
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {}
          {activeCollaborators.length > 0 && (
            <div className="mb-8">
              <h4 className="text-lg font-semibold text-blue-400 mb-4 flex items-center">
                <span className="mr-2">👤</span> Colaboradores Ativos ({activeCollaborators.length})
              </h4>
              <div className="space-y-3">
                {activeCollaborators.map((collaborator) => (
                  <div
                    key={collaborator.uid}
                    className="flex items-center justify-between p-4 bg-blue-500/10 border border-blue-500/30 rounded-lg"
                  >
                    <div>
                      <p className="text-white font-medium">{collaborator.email}</p>
                      {collaborator.displayName && (
                        <p className="text-gray-400 text-sm">{collaborator.displayName}</p>
                      )}
                    </div>
                    <div className="flex space-x-2">
                      {collaborator.uid && (
                        <button
                          onClick={() => router.push(`/admin/users/${collaborator.uid}`)}
                          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                        >
                          📊 Ver Dashboard
                        </button>
                      )}
                      <button
                        onClick={() => handlePromote(collaborator.email)}
                        disabled={actionLoading}
                        className="px-4 py-2 bg-yellow-600 hover:bg-yellow-700 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Promover
                      </button>
                      <button
                        onClick={() => handleRemove(collaborator.email)}
                        disabled={actionLoading}
                        className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Remover
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {}
          {pendingAdmins.length > 0 && (
            <div className="mb-8">
              <h4 className="text-lg font-semibold text-yellow-400 mb-4 flex items-center">
                <span className="mr-2">⏳</span> Administradores Pendentes ({pendingAdmins.length})
              </h4>
              <p className="text-sm text-gray-400 mb-3">Aguardando primeiro login</p>
              <div className="space-y-3">
                {pendingAdmins.map((admin, index) => (
                  <div
                    key={`pending-admin-${index}`}
                    className="flex items-center justify-between p-4 bg-yellow-500/5 border border-yellow-500/20 rounded-lg"
                  >
                    <div>
                      <p className="text-gray-300 font-medium">{admin.email}</p>
                      <p className="text-gray-500 text-sm">Pré-autorizado - aguardando login</p>
                    </div>
                    <div className="flex space-x-2">
                      <button
                        onClick={() => handleRemove(admin.email)}
                        disabled={actionLoading}
                        className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Remover
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {}
          {pendingCollaborators.length > 0 && (
            <div className="mb-8">
              <h4 className="text-lg font-semibold text-blue-400 mb-4 flex items-center">
                <span className="mr-2">⏳</span> Colaboradores Pendentes (
                {pendingCollaborators.length})
              </h4>
              <p className="text-sm text-gray-400 mb-3">Aguardando primeiro login</p>
              <div className="space-y-3">
                {pendingCollaborators.map((collaborator, index) => (
                  <div
                    key={`pending-collab-${index}`}
                    className="flex items-center justify-between p-4 bg-blue-500/5 border border-blue-500/20 rounded-lg"
                  >
                    <div>
                      <p className="text-gray-300 font-medium">{collaborator.email}</p>
                      <p className="text-gray-500 text-sm">Pré-autorizado - aguardando login</p>
                    </div>
                    <div className="flex space-x-2">
                      <button
                        onClick={() => handleRemove(collaborator.email)}
                        disabled={actionLoading}
                        className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Remover
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {}
          {users.length === 0 && (
            <div className="text-center py-8 text-gray-400">
              <p>Nenhum usuário autorizado ainda</p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
