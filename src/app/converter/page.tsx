'use client';

import HourConversionForm from '@/components/HourConversionForm';
import HourConversionsList from '@/components/HourConversionsList';
import AuthenticatedLayout from '@/components/AuthenticatedLayout';

export default function ConverterPage() {
  return (
    <AuthenticatedLayout activeTab="conversion">
      {(user) => (
        <>
          <HourConversionForm
            userId={user.uid}
            userName={user.displayName || user.email || 'Usuário'}
          />
          <HourConversionsList userId={user.uid} />
        </>
      )}
    </AuthenticatedLayout>
  );
}
