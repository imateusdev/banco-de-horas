'use client';

import {
  useAdminUsers,
  useAddUser,
  usePromoteUser,
  useDemoteUser,
  useDeleteUser,
} from '@/hooks/useQueries';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import AdminLayout from '@/components/AdminLayout';

export default function AdminUsersPage() {
  const router = useRouter();

  const { data: users = [], isLoading: usersLoading } = useAdminUsers();
  const addUser = useAddUser();
  const promoteUser = usePromoteUser();
  const demoteUser = useDemoteUser();
  const deleteUser = useDeleteUser();

  const [newUserEmail, setNewUserEmail] = useState('');
  const [newUserRole, setNewUserRole] = useState<'admin' | 'collaborator'>('collaborator');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleAddUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    try {
      await addUser.mutateAsync({ email: newUserEmail, role: newUserRole });
      setSuccess(
        `Usuário ${newUserEmail} adicionado com sucesso como ${newUserRole === 'admin' ? 'administrador' : 'colaborador'}`
      );
      setNewUserEmail('');
      setNewUserRole('collaborator');
    } catch (error: any) {
      setError(error.message);
    }
  };

  const handlePromote = async (email: string) => {
    if (!confirm(`Promover ${email} para administrador?`)) return;

    setError(null);
    setSuccess(null);

    try {
      await promoteUser.mutateAsync(email);
      setSuccess(`${email} promovido para administrador`);
    } catch (error: any) {
      setError(error.message);
    }
  };

  const handleDemote = async (email: string) => {
    if (!confirm(`Rebaixar ${email} para colaborador?`)) return;

    setError(null);
    setSuccess(null);

    try {
      await demoteUser.mutateAsync(email);
      setSuccess(`${email} rebaixado para colaborador`);
    } catch (error: any) {
      setError(error.message);
    }
  };

  const handleRemove = async (email: string) => {
    if (!confirm(`Remover autorização de ${email}? O usuário não poderá mais acessar o sistema.`))
      return;

    setError(null);
    setSuccess(null);

    try {
      await deleteUser.mutateAsync(email);
      setSuccess(`Autorização de ${email} removida`);
    } catch (error: any) {
      setError(error.message);
    }
  };

  const activeAdmins = users.filter((u) => u.role === 'admin' && u.status === 'active');
  const activeCollaborators = users.filter(
    (u) => u.role === 'collaborator' && u.status === 'active'
  );
  const pendingAdmins = users.filter((u) => u.role === 'admin' && u.status === 'pending');
  const pendingCollaborators = users.filter(
    (u) => u.role === 'collaborator' && u.status === 'pending'
  );

  return (
    <AdminLayout loading={usersLoading}>
      <div className="text-center mb-8 fade-in-up">
        <span className="font-mono text-[9px] text-white/25 uppercase tracking-widest block mb-2">
          USERS // MANAGEMENT
        </span>
        <h2 className="text-3xl font-bold text-white mb-2">Gerenciador de Usuários</h2>
        <p className="text-white/60">Autorize usuários e gerencie permissões</p>
      </div>

      {}
      {error && (
        <div className="mb-6 p-4 bg-red-500/10 border border-red-500/30 rounded-lg backdrop-blur-sm fade-in-up">
          <p className="text-red-300 text-center">{error}</p>
        </div>
      )}

      {success && (
        <div className="mb-6 p-4 bg-green-500/10 border border-green-500/30 rounded-lg backdrop-blur-sm fade-in-up">
          <p className="text-green-300 text-center">{success}</p>
        </div>
      )}

      {}
      <div className="glass-panel p-6 mb-8 fade-in-up stagger-1">
        <div className="mb-6">
          <span className="font-mono text-[9px] text-white/25 uppercase tracking-widest block mb-2">
            ADD // USER
          </span>
          <h3 className="text-xl font-bold text-white">Autorizar Novo Usuário</h3>
        </div>
        <form onSubmit={handleAddUser} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-white/70 mb-2">Email do Usuário</label>
            <input
              type="email"
              value={newUserEmail}
              onChange={(e) => setNewUserEmail(e.target.value)}
              placeholder="usuario@empresa.com"
              required
              className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300 hover:bg-white/10"
            />
            <p className="mt-1 text-sm text-white/50">
              Se o email não existir, será pré-autorizado para login futuro
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-white/70 mb-2">Tipo de Usuário</label>
            <select
              value={newUserRole}
              onChange={(e) => setNewUserRole(e.target.value as 'admin' | 'collaborator')}
              className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300 hover:bg-white/10 [&>option]:bg-[#1a1a1a] [&>option]:text-white"
            >
              <option value="collaborator">Colaborador (apenas suas horas)</option>
              <option value="admin">Administrador (todas as horas)</option>
            </select>
          </div>

          <button
            type="submit"
            disabled={
              addUser.isPending ||
              promoteUser.isPending ||
              demoteUser.isPending ||
              deleteUser.isPending ||
              !newUserEmail
            }
            className={`w-full font-semibold py-3 rounded-lg transition-all duration-300 ${
              addUser.isPending ||
              promoteUser.isPending ||
              demoteUser.isPending ||
              deleteUser.isPending ||
              !newUserEmail
                ? 'bg-white/10 text-white/40 cursor-not-allowed border border-white/10'
                : 'bg-linear-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600 text-white shadow-lg shadow-blue-500/20 hover:shadow-blue-500/40'
            }`}
          >
            {addUser.isPending ||
            promoteUser.isPending ||
            demoteUser.isPending ||
            deleteUser.isPending
              ? 'Autorizando...'
              : 'Autorizar Usuário'}
          </button>
        </form>
      </div>

      {}
      <div className="glass-panel p-6 fade-in-up stagger-2">
        <div className="mb-6">
          <span className="font-mono text-[9px] text-white/25 uppercase tracking-widest block mb-2">
            AUTHORIZED // USERS
          </span>
          <h3 className="text-xl font-bold text-white">Usuários Autorizados</h3>
        </div>

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
                  className="flex items-center justify-between p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-lg hover:bg-yellow-500/15 transition-all duration-300"
                >
                  <div>
                    <p className="text-white font-medium">{admin.email}</p>
                    {admin.displayName && (
                      <p className="text-white/50 text-sm">{admin.displayName}</p>
                    )}
                  </div>
                  <div className="flex space-x-2">
                    {admin.uid && (
                      <button
                        onClick={() => router.push(`/admin/users/${admin.uid}`)}
                        className="px-4 py-2 bg-linear-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600 text-white rounded-lg transition-all duration-300 shadow-lg shadow-blue-500/20 hover:shadow-blue-500/40"
                      >
                        📊 Ver Dashboard
                      </button>
                    )}
                    <button
                      onClick={() => handleDemote(admin.email)}
                      disabled={
                        addUser.isPending ||
                        promoteUser.isPending ||
                        demoteUser.isPending ||
                        deleteUser.isPending ||
                        activeAdmins.length === 1
                      }
                      className={`px-4 py-2 rounded-lg transition-all duration-300 ${
                        addUser.isPending ||
                        promoteUser.isPending ||
                        demoteUser.isPending ||
                        deleteUser.isPending ||
                        activeAdmins.length === 1
                          ? 'bg-white/10 text-white/40 cursor-not-allowed border border-white/10'
                          : 'bg-linear-to-r from-gray-600 to-gray-500 hover:from-gray-700 hover:to-gray-600 text-white shadow-lg shadow-gray-500/20 hover:shadow-gray-500/40'
                      }`}
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
                      disabled={
                        addUser.isPending ||
                        promoteUser.isPending ||
                        demoteUser.isPending ||
                        deleteUser.isPending ||
                        activeAdmins.length === 1
                      }
                      className={`px-4 py-2 rounded-lg transition-all duration-300 ${
                        addUser.isPending ||
                        promoteUser.isPending ||
                        demoteUser.isPending ||
                        deleteUser.isPending ||
                        activeAdmins.length === 1
                          ? 'bg-white/10 text-white/40 cursor-not-allowed border border-white/10'
                          : 'bg-linear-to-r from-red-600 to-red-500 hover:from-red-700 hover:to-red-600 text-white shadow-lg shadow-red-500/20 hover:shadow-red-500/40'
                      }`}
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
                  className="flex items-center justify-between p-4 bg-blue-500/10 border border-blue-500/20 rounded-lg hover:bg-blue-500/15 transition-all duration-300"
                >
                  <div>
                    <p className="text-white font-medium">{collaborator.email}</p>
                    {collaborator.displayName && (
                      <p className="text-white/50 text-sm">{collaborator.displayName}</p>
                    )}
                  </div>
                  <div className="flex space-x-2">
                    {collaborator.uid && (
                      <button
                        onClick={() => router.push(`/admin/users/${collaborator.uid}`)}
                        className="px-4 py-2 bg-linear-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600 text-white rounded-lg transition-all duration-300 shadow-lg shadow-blue-500/20 hover:shadow-blue-500/40"
                      >
                        📊 Ver Dashboard
                      </button>
                    )}
                    <button
                      onClick={() => handlePromote(collaborator.email)}
                      disabled={
                        addUser.isPending ||
                        promoteUser.isPending ||
                        demoteUser.isPending ||
                        deleteUser.isPending
                      }
                      className={`px-4 py-2 rounded-lg transition-all duration-300 ${
                        addUser.isPending ||
                        promoteUser.isPending ||
                        demoteUser.isPending ||
                        deleteUser.isPending
                          ? 'bg-white/10 text-white/40 cursor-not-allowed border border-white/10'
                          : 'bg-linear-to-r from-yellow-600 to-yellow-500 hover:from-yellow-700 hover:to-yellow-600 text-white shadow-lg shadow-yellow-500/20 hover:shadow-yellow-500/40'
                      }`}
                    >
                      Promover
                    </button>
                    <button
                      onClick={() => handleRemove(collaborator.email)}
                      disabled={
                        addUser.isPending ||
                        promoteUser.isPending ||
                        demoteUser.isPending ||
                        deleteUser.isPending
                      }
                      className={`px-4 py-2 rounded-lg transition-all duration-300 ${
                        addUser.isPending ||
                        promoteUser.isPending ||
                        demoteUser.isPending ||
                        deleteUser.isPending
                          ? 'bg-white/10 text-white/40 cursor-not-allowed border border-white/10'
                          : 'bg-linear-to-r from-red-600 to-red-500 hover:from-red-700 hover:to-red-600 text-white shadow-lg shadow-red-500/20 hover:shadow-red-500/40'
                      }`}
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
            <p className="text-sm text-white/50 mb-3">Aguardando primeiro login</p>
            <div className="space-y-3">
              {pendingAdmins.map((admin, index) => (
                <div
                  key={`pending-admin-${index}`}
                  className="flex items-center justify-between p-4 bg-yellow-500/5 border border-yellow-500/10 rounded-lg hover:bg-yellow-500/10 transition-all duration-300"
                >
                  <div>
                    <p className="text-white/80 font-medium">{admin.email}</p>
                    <p className="text-white/40 text-sm">Pré-autorizado - aguardando login</p>
                  </div>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => handleRemove(admin.email)}
                      disabled={
                        addUser.isPending ||
                        promoteUser.isPending ||
                        demoteUser.isPending ||
                        deleteUser.isPending
                      }
                      className={`px-4 py-2 rounded-lg transition-all duration-300 ${
                        addUser.isPending ||
                        promoteUser.isPending ||
                        demoteUser.isPending ||
                        deleteUser.isPending
                          ? 'bg-white/10 text-white/40 cursor-not-allowed border border-white/10'
                          : 'bg-linear-to-r from-red-600 to-red-500 hover:from-red-700 hover:to-red-600 text-white shadow-lg shadow-red-500/20 hover:shadow-red-500/40'
                      }`}
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
            <p className="text-sm text-white/50 mb-3">Aguardando primeiro login</p>
            <div className="space-y-3">
              {pendingCollaborators.map((collaborator, index) => (
                <div
                  key={`pending-collab-${index}`}
                  className="flex items-center justify-between p-4 bg-blue-500/5 border border-blue-500/10 rounded-lg hover:bg-blue-500/10 transition-all duration-300"
                >
                  <div>
                    <p className="text-white/80 font-medium">{collaborator.email}</p>
                    <p className="text-white/40 text-sm">Pré-autorizado - aguardando login</p>
                  </div>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => handleRemove(collaborator.email)}
                      disabled={
                        addUser.isPending ||
                        promoteUser.isPending ||
                        demoteUser.isPending ||
                        deleteUser.isPending
                      }
                      className={`px-4 py-2 rounded-lg transition-all duration-300 ${
                        addUser.isPending ||
                        promoteUser.isPending ||
                        demoteUser.isPending ||
                        deleteUser.isPending
                          ? 'bg-white/10 text-white/40 cursor-not-allowed border border-white/10'
                          : 'bg-linear-to-r from-red-600 to-red-500 hover:from-red-700 hover:to-red-600 text-white shadow-lg shadow-red-500/20 hover:shadow-red-500/40'
                      }`}
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
          <div className="text-center py-12">
            <p className="text-white/40 text-lg">Nenhum usuário autorizado ainda</p>
            <p className="text-white/30 text-sm mt-2">Adicione o primeiro usuário acima</p>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
