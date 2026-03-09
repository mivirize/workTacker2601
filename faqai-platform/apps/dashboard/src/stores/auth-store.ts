import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { User, AuthTokens } from '@faqai/types';
import { authApi } from '@/lib/api-client';

interface AuthState {
  user: User | null;
  tokens: AuthTokens | null;
  isAuthenticated: boolean;
  organizationId: string | null;
  setUser: (user: User, tokens: AuthTokens) => void;
  setTokens: (tokens: AuthTokens) => void;
  clearAuth: () => void;
  updateProfile: (data: { name?: string }) => Promise<void>;
  fetchMe: () => Promise<void>;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      tokens: null,
      isAuthenticated: false,
      organizationId: null,
      setUser: (user, tokens) =>
        set({
          user,
          tokens,
          isAuthenticated: true,
        }),
      setTokens: (tokens) =>
        set((state) => ({
          ...state,
          tokens,
        })),
      clearAuth: () =>
        set({
          user: null,
          tokens: null,
          isAuthenticated: false,
          organizationId: null,
        }),
      updateProfile: async (data) => {
        const result = await authApi.updateProfile(data);
        const { user: currentUser, tokens } = get();
        if (currentUser && tokens) {
          set({ user: { ...currentUser, ...result.user } });
        }
      },
      fetchMe: async () => {
        try {
          const result = await authApi.me();
          set((state) => ({
            user: state.user ? { ...state.user, ...result.user } : null,
            organizationId: result.organizationId,
          }));
        } catch {
          // トークンが切れていても無視（AuthGuardが処理）
        }
      },
    }),
    {
      name: 'faqai-auth',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        user: state.user,
        tokens: state.tokens,
        isAuthenticated: state.isAuthenticated,
        organizationId: state.organizationId,
      }),
    },
  ),
);
