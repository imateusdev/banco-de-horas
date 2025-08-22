'use client';

import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center px-4">
      <div className="text-center">
        <h1 className="text-6xl font-bold text-white mb-4">404</h1>
        <h2 className="text-2xl font-bold text-gray-300 mb-4">Página não encontrada</h2>
        <p className="text-gray-400 mb-8">
          O usuário que você está procurando não existe ou a página foi removida.
        </p>
        <Link
          href="/"
          className="inline-block px-6 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
        >
          ← Voltar para o início
        </Link>
      </div>
    </div>
  );
}
