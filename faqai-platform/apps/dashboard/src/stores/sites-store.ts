import { create } from 'zustand';
import { siteApi, type SiteRecord, type CrawlJobRecord } from '@/lib/api-client';

interface SitesState {
  sites: SiteRecord[];
  isLoading: boolean;
  error: string | null;

  crawlJobs: Record<string, CrawlJobRecord[]>;
  crawlJobsLoading: Record<string, boolean>;

  fetchSites: () => Promise<void>;
  createSite: (data: {
    name: string;
    url: string;
    crawlConfig?: { max_pages?: number; max_depth?: number; rate_limit_ms?: number };
  }) => Promise<SiteRecord>;
  removeSite: (id: string) => Promise<void>;
  startCrawl: (id: string) => Promise<CrawlJobRecord>;
  fetchCrawlJobs: (siteId: string) => Promise<void>;
}

export const useSitesStore = create<SitesState>((set, get) => ({
  sites: [],
  isLoading: false,
  error: null,
  crawlJobs: {},
  crawlJobsLoading: {},

  fetchSites: async () => {
    set({ isLoading: true, error: null });
    try {
      const data = await siteApi.list();
      set({ sites: data.sites, isLoading: false });
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'サイト一覧の取得に失敗しました';
      set({ error: msg, isLoading: false });
    }
  },

  createSite: async (input) => {
    const data = await siteApi.create(input);
    set((state) => ({ sites: [data.site, ...state.sites] }));
    return data.site;
  },

  removeSite: async (id) => {
    await siteApi.remove(id);
    set((state) => ({ sites: state.sites.filter((s) => s.id !== id) }));
  },

  startCrawl: async (id) => {
    const data = await siteApi.startCrawl(id);
    return data.job;
  },

  fetchCrawlJobs: async (siteId) => {
    set((state) => ({
      crawlJobsLoading: { ...state.crawlJobsLoading, [siteId]: true },
    }));
    try {
      const data = await siteApi.getCrawlJobs(siteId);
      set((state) => ({
        crawlJobs: { ...state.crawlJobs, [siteId]: data.jobs },
        crawlJobsLoading: { ...state.crawlJobsLoading, [siteId]: false },
      }));
    } catch {
      const prev = get().crawlJobsLoading;
      set({ crawlJobsLoading: { ...prev, [siteId]: false } });
    }
  },
}));
