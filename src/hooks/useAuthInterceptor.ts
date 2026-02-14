import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { auth } from '@/lib/firebase/config';

export function useAuthInterceptor() {
  const router = useRouter();

  useEffect(() => {
    const originalFetch = window.fetch;

    window.fetch = async function (...args) {
      const response = await originalFetch(...args);

      if (response.status === 401) {
        const url = args[0] as string;
        if (url.startsWith('/api/')) {
          console.warn('Token revogado ou expirado. Fazendo logout...');
          await auth.signOut();
          router.push('/');
        }
      }

      return response;
    };

    return () => {
      window.fetch = originalFetch;
    };
  }, [router]);
}
