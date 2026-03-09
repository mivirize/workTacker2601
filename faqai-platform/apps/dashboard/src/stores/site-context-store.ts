import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { siteApi, type SiteRecord } from '@/lib/api-client';

interface SiteContextState {
  currentSiteId: string | null;
  currentSite: SiteRecord | null;
  isLoading: boolean;
  error: string | null;

  setCurrentSite: (site: SiteRecord) => void;
  fetchSite: (siteId: string) => Promise<void>;
  updateSite: (siteId: string, data: {
    name?: string;
    description?: string | null;
    notes?: string | null;
    aiContext?: string | null;
    logoUrl?: string | null;
    themeColor?: string | null;
  }) => Promise<SiteRecord>;
  updateSlug: (siteId: string, slug: string) => Promise<SiteRecord>;
  clearContext: () => void;
}

export const useSiteContextStore = create<SiteContextState>()(
  persist(
    (set) => ({
      currentSiteId: null,
      currentSite: null,
      isLoading: false,
      error: null,

      setCurrentSite: (site) => {
        set({ currentSiteId: site.id, currentSite: site, error: null });
      },

      fetchSite: async (siteId) => {
        set({ isLoading: true, error: null });
        try {
          const data = await siteApi.get(siteId);
          set({
            currentSiteId: data.site.id,
            currentSite: data.site,
            isLoading: false,
          });
        } catch (err) {
          const msg = err instanceof Error ? err.message : 'サイト情報の取得に失敗しました';
          set({ error: msg, isLoading: false });
        }
      },

      updateSite: async (siteId, data) => {
        const result = await siteApi.update(siteId, data);
        set({ currentSite: result.site });
        return result.site;
      },

      updateSlug: async (siteId, slug) => {
        const result = await siteApi.updateSlug(siteId, slug);
        set({ currentSite: result.site });
        return result.site;
      },

      clearContext: () => {
        set({ currentSiteId: null, currentSite: null, error: null });
      },
    }),
    {
      name: 'faqai-site-context',
      partialize: (state) => ({
        currentSiteId: state.currentSiteId,
      }),
    },
  ),
);
