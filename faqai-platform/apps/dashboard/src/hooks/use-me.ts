'use client';

import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import { useAuthStore } from '@/stores/auth-store';
import type { User } from '@faqai/types';

interface MeResponse {
  success: boolean;
  data: {
    user: User;
    organizationId: string;
  };
}

export function useMe() {
  const { isAuthenticated } = useAuthStore();

  return useQuery({
    queryKey: ['me'],
    queryFn: async () => {
      const response = await apiClient.get<MeResponse>('/api/v1/me');
      return response.data;
    },
    enabled: isAuthenticated,
    staleTime: 5 * 60 * 1000, // 5分
    retry: false,
  });
}
