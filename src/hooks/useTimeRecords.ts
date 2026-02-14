import { useState, useEffect } from 'react';
import { TimeRecord } from '@/types';

export function useTimeRecords(userId: string, refreshTrigger: number = 0) {
  const [records, setRecords] = useState<TimeRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchRecords = async () => {
      try {
        setLoading(true);
        setError(null);

        const response = await fetch(`/api/time-records?userId=${userId}`, {
          headers: {
            'Content-Type': 'application/json',
          },
        });

        if (!response.ok) {
          throw new Error('Failed to fetch time records');
        }

        const data = await response.json();
        setRecords(data);
      } catch (err) {
        console.error('Error fetching time records:', err);
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setLoading(false);
      }
    };

    if (userId) {
      fetchRecords();
    }
  }, [userId, refreshTrigger]);

  return { records, loading, error };
}
