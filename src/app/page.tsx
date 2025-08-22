'use client';

import UsersManager from '@/components/UsersManager';

export default function Home() {

  return (
    <div className="min-h-screen bg-gray-900">
      {/* Header */}
      <header className="bg-gray-800 shadow-lg border-b border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center h-16">
            <h1 className="text-2xl font-bold text-white">
              ⏰ Banco de Horas
            </h1>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold text-white mb-2">👥 Gerenciador de Usuários</h2>
          <p className="text-gray-400">
            Selecione um usuário existente ou crie um novo para acessar o sistema de controle de horas
          </p>
        </div>
        <UsersManager />
      </main>
    </div>
  );
}
