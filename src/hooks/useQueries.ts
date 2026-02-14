import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import { auth } from '@/lib/firebase/config';
import { TimeRecord, HourConversion } from '@/types';

const STALE_TIME = 1000 * 60 * 10;
const GC_TIME = 1000 * 60 * 30;
const ADMIN_STALE_TIME = 1000 * 60 * 5;

async function getAuthHeaders(): Promise<HeadersInit> {
  const user = auth.currentUser;
  if (!user) throw new Error('User not authenticated');
  const token = await user.getIdToken();
  return {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token}`,
  };
}

async function fetchWithAuth(url: string, options?: RequestInit) {
  const headers = await getAuthHeaders();
  const response = await fetch(url, { ...options, headers: { ...headers, ...options?.headers } });
  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    throw new Error(data.error || `Request failed: ${response.statusText}`);
  }
  return response.json();
}

function invalidateUserQueries(queryClient: any, userId: string) {
  queryClient.invalidateQueries({ queryKey: ['timeRecords', userId] });
  queryClient.invalidateQueries({
    predicate: (query: any) => query.queryKey[0] === 'dashboard' && query.queryKey[1] === userId,
  });
}

export function useDashboardData(userId: string, date: string, month: string) {
  return useQuery({
    queryKey: ['dashboard', userId, date, month],
    queryFn: () => apiClient.getDashboardData(date, month, userId),
    enabled: !!userId,
    staleTime: STALE_TIME,
    gcTime: GC_TIME,
    refetchOnMount: false,
    refetchOnWindowFocus: false,
    placeholderData: (previousData) => previousData,
  });
}

export function useTimeRecords(userId: string) {
  return useQuery({
    queryKey: ['timeRecords', userId],
    queryFn: () => apiClient.getTimeRecords(userId),
    enabled: !!userId,
    staleTime: STALE_TIME,
    gcTime: GC_TIME,
    refetchOnMount: false,
    refetchOnWindowFocus: false,
    placeholderData: (previousData) => previousData,
  });
}

export function useCreateTimeRecord() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (record: TimeRecord) => apiClient.createTimeRecord(record),
    onSuccess: (_, variables) => invalidateUserQueries(queryClient, variables.userId),
  });
}

export function useUpdateTimeRecord() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: Partial<TimeRecord>; userId: string }) =>
      apiClient.updateTimeRecord(id, updates),
    onSuccess: (_, variables) => invalidateUserQueries(queryClient, variables.userId),
  });
}

export function useDeleteTimeRecord() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, userId }: { id: string; userId: string }) =>
      apiClient.deleteTimeRecord(id, userId),
    onSuccess: (_, variables) => invalidateUserQueries(queryClient, variables.userId),
  });
}

export function useHourConversions(userId: string) {
  return useQuery({
    queryKey: ['hourConversions', userId],
    queryFn: () => apiClient.getHourConversions(userId),
    enabled: !!userId,
    staleTime: STALE_TIME,
    gcTime: GC_TIME,
    refetchOnMount: false,
    refetchOnWindowFocus: false,
    placeholderData: (previousData) => previousData,
  });
}

export function useCreateHourConversion() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (conversion: HourConversion) => apiClient.createHourConversion(conversion),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['hourConversions', variables.userId] });
      queryClient.invalidateQueries({
        predicate: (query) =>
          query.queryKey[0] === 'dashboard' && query.queryKey[1] === variables.userId,
      });
    },
  });
}

export function useMonthlyGoal(userId: string, month: string) {
  return useQuery({
    queryKey: ['monthlyGoal', userId, month],
    queryFn: () => apiClient.getMonthlyGoal(userId, month),
    enabled: !!userId && !!month,
    staleTime: STALE_TIME,
    gcTime: GC_TIME,
    refetchOnMount: false,
    refetchOnWindowFocus: false,
    placeholderData: (previousData) => previousData,
  });
}

export function useSaveMonthlyGoal() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ userId, month, goal }: { userId: string; month: string; goal: number }) =>
      apiClient.saveMonthlyGoal(userId, month, goal),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ['monthlyGoal', variables.userId, variables.month],
      });
      queryClient.invalidateQueries({
        predicate: (query) =>
          query.queryKey[0] === 'dashboard' && query.queryKey[1] === variables.userId,
      });
    },
  });
}

export function useUserData(userId: string) {
  return useQuery({
    queryKey: ['userData', userId],
    queryFn: () => fetchWithAuth(`/api/users/${userId}`),
    enabled: !!userId,
    staleTime: STALE_TIME,
    gcTime: GC_TIME,
    refetchOnMount: false,
    refetchOnWindowFocus: false,
    placeholderData: (previousData) => previousData,
  });
}

export function useUserSettings(userId: string) {
  return useQuery({
    queryKey: ['userSettings', userId],
    queryFn: () => fetchWithAuth(`/api/user-settings?userId=${userId}`),
    enabled: !!userId,
    staleTime: STALE_TIME,
    gcTime: GC_TIME,
    refetchOnMount: false,
    refetchOnWindowFocus: false,
    placeholderData: (previousData) => previousData,
  });
}

export function useSaveUserSettings() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      userId,
      defaultStartTime,
      defaultEndTime,
      workingDays,
    }: {
      userId: string;
      defaultStartTime: string | null;
      defaultEndTime: string | null;
      workingDays: string;
    }) =>
      fetchWithAuth('/api/user-settings', {
        method: 'POST',
        body: JSON.stringify({ userId, defaultStartTime, defaultEndTime, workingDays }),
      }),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['userSettings', variables.userId] });
    },
  });
}

export function useAdminUsers() {
  return useQuery({
    queryKey: ['adminUsers'],
    queryFn: async () => {
      const data = await fetchWithAuth('/api/admin/users');
      return data.users || [];
    },
    staleTime: ADMIN_STALE_TIME,
    placeholderData: (previousData) => previousData,
  });
}

function createAdminMutation(
  url: string,
  method: 'POST' | 'DELETE' = 'POST',
  getBody: (input: any) => any = (input) => input
) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: any) =>
      fetchWithAuth(url, {
        method,
        body: JSON.stringify(getBody(input)),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminUsers'] });
    },
  });
}

export function useAddUser() {
  return createAdminMutation('/api/admin/users', 'POST', ({ email, role }) => ({ email, role }));
}

export function usePromoteUser() {
  return createAdminMutation('/api/admin/users/promote', 'POST', (email) => ({ email }));
}

export function useDemoteUser() {
  return createAdminMutation('/api/admin/users/demote', 'POST', (email) => ({ email }));
}

export function useDeleteUser() {
  return createAdminMutation('/api/admin/users', 'DELETE', (email) => ({ email }));
}
