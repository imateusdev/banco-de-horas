'use client';

import { useState, useEffect } from 'react';
import { clientStorageUtils } from '@/lib/client-storage';
import { timeUtils } from '@/lib/calculations';
import { User } from '@/types';
import { useRouter } from 'next/navigation';

function UserCard({ user, onViewUser }: { user: User; onViewUser: (user: User) => void }) {
  const [userStats, setUserStats] = useState({ totalHours: 0, recordsCount: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadUserStats = async () => {
      try {
        const userRecords = await clientStorageUtils.getUserTimeRecords(user.id);
        const totalHours = userRecords.reduce((sum, record) => sum + record.totalHours, 0);
        setUserStats({ totalHours, recordsCount: userRecords.length });
      } catch (error) {
        console.error('Error loading user stats:', error);
      } finally {
        setLoading(false);
      }
    };

    loadUserStats();
  }, [user.id]);

  const formatDate = (dateStr: string): string => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const slug = clientStorageUtils.generateUserSlug(user.name);

  return (
    <div className="flex items-center justify-between p-4 bg-neutral-700 rounded-md border border-neutral-600 hover:border-neutral-500 transition-colors">
      <div>
        <h3 className="font-semibold text-white text-lg">{user.name}</h3>
        <p className="text-neutral-400 text-sm">/{slug}</p>
        <p className="text-neutral-400 text-sm">Criado em: {formatDate(user.createdAt)}</p>
      </div>

      <div className="text-right">
        {loading ? (
          <p className="text-neutral-400">Carregando...</p>
        ) : (
          <>
            <p className="text-blue-400 font-semibold text-lg">
              {timeUtils.formatHours(userStats.totalHours)}
            </p>
            <p className="text-neutral-400 text-sm">
              {userStats.recordsCount} registro{userStats.recordsCount !== 1 ? 's' : ''}
            </p>
          </>
        )}
      </div>

      <button
        onClick={() => onViewUser(user)}
        className="ml-4 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
      >
        Ver Horas
      </button>
    </div>
  );
}

export default function UsersManager() {
  const [users, setUsers] = useState<User[]>([]);
  const [newUserName, setNewUserName] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      const allUsers = await clientStorageUtils.getUsers();
      setUsers(allUsers.sort((a, b) => b.createdAt.localeCompare(a.createdAt)));
    } catch (error) {
      console.error('Error loading users:', error);
    }
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!newUserName.trim()) {
      setError('Nome é obrigatório');
      return;
    }

    if (newUserName.trim().length < 2) {
      setError('Nome deve ter pelo menos 2 caracteres');
      return;
    }

    const slug = clientStorageUtils.generateUserSlug(newUserName);
    const existingUser = await clientStorageUtils.getUserBySlug(slug);

    if (existingUser) {
      setError('Já existe um usuário com um nome similar');
      return;
    }

    setError('');
    setIsCreating(true);

    try {
      const newUser: User = {
        id: timeUtils.generateId(),
        name: newUserName.trim(),
        createdAt: new Date().toISOString(),
      };

      await clientStorageUtils.saveUser(newUser);
      setNewUserName('');
      await loadUsers();

      router.push(`/${slug}`);
    } catch (error) {
      console.error('Error creating user:', error);
      setError('Erro ao criar usuário');
    } finally {
      setIsCreating(false);
    }
  };

  const handleViewUser = (user: User) => {
    const slug = clientStorageUtils.generateUserSlug(user.name);
    router.push(`/${slug}`);
  };

  return (
    <div className="space-y-6">
      {}
      <div className="bg-neutral-800 rounded-lg shadow-lg p-6 border border-neutral-700">
        <h2 className="text-2xl font-bold text-white mb-6">Criar Novo Usuário</h2>

        <form onSubmit={handleCreateUser} className="space-y-4">
          <div>
            <label htmlFor="userName" className="block text-sm font-medium text-neutral-300 mb-2">
              Nome do Usuário
            </label>
            <input
              type="text"
              id="userName"
              value={newUserName}
              onChange={(e) => {
                setNewUserName(e.target.value);
                setError('');
              }}
              className={`w-full px-3 py-2 bg-neutral-700 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-400 text-white placeholder-gray-400 ${
                error ? 'border-red-500' : 'border-neutral-600'
              }`}
              placeholder="Digite o nome do usuário"
              maxLength={50}
            />
            {error && <p className="text-red-400 text-sm mt-1">{error}</p>}
            {newUserName && (
              <p className="text-neutral-400 text-sm mt-1">
                URL: /{clientStorageUtils.generateUserSlug(newUserName)}
              </p>
            )}
          </div>

          <button
            type="submit"
            disabled={isCreating || !newUserName.trim()}
            className={`w-full py-2 px-4 rounded-md font-medium transition-colors ${
              isCreating || !newUserName.trim()
                ? 'bg-neutral-600 cursor-not-allowed'
                : 'bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600 text-white shadow-lg shadow-blue-500/20 hover:shadow-blue-500/40'
            }`}
          >
            {isCreating ? 'Criando...' : 'Criar Usuário'}
          </button>
        </form>
      </div>

      {}
      <div className="bg-neutral-800 rounded-lg shadow-lg p-6 border border-neutral-700">
        <h2 className="text-2xl font-bold text-white mb-6">Usuários Existentes</h2>

        {users.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-neutral-400">Nenhum usuário criado ainda</p>
          </div>
        ) : (
          <div className="space-y-3">
            {users.map((user) => (
              <UserCard key={user.id} user={user} onViewUser={handleViewUser} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
