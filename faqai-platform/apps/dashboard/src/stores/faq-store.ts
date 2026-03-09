import { create } from 'zustand';
import { faqApi, type FaqRecord } from '@/lib/api-client';

interface FaqState {
  items: FaqRecord[];
  total: number;
  isLoading: boolean;
  error: string | null;
  currentPage: number;
  pageSize: number;
  filters: { siteId?: string; status?: string };

  fetchFaqs: (params?: { siteId?: string; status?: string; page?: number }) => Promise<void>;
  setFilters: (filters: { siteId?: string; status?: string }) => void;
  updateFaq: (
    id: string,
    data: { question?: string; answer?: string; status?: 'draft' | 'published' | 'archived'; categoryId?: string },
  ) => Promise<void>;
  removeFaq: (id: string) => Promise<void>;
}

export const useFaqStore = create<FaqState>((set, get) => ({
  items: [],
  total: 0,
  isLoading: false,
  error: null,
  currentPage: 1,
  pageSize: 20,
  filters: {},

  setFilters: (filters) => {
    set({ filters, currentPage: 1 });
  },

  fetchFaqs: async (params) => {
    const { pageSize, filters, currentPage } = get();
    const page = params?.page ?? currentPage;
    const siteId = params?.siteId ?? filters.siteId;
    const status = params?.status ?? filters.status;

    set({ isLoading: true, error: null, currentPage: page });
    try {
      const listParams: Parameters<typeof faqApi.list>[0] = {
        limit: pageSize,
        offset: (page - 1) * pageSize,
      };
      if (siteId !== undefined) listParams.siteId = siteId;
      if (status !== undefined) listParams.status = status;
      const data = await faqApi.list(listParams);
      set({ items: data.items, total: data.total, isLoading: false });
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'FAQ一覧の取得に失敗しました';
      set({ error: msg, isLoading: false });
    }
  },

  updateFaq: async (id, data) => {
    const result = await faqApi.update(id, data);
    set((state) => ({
      items: state.items.map((item) => (item.id === id ? result.faq : item)),
    }));
  },

  removeFaq: async (id) => {
    await faqApi.remove(id);
    set((state) => ({
      items: state.items.filter((item) => item.id !== id),
      total: state.total - 1,
    }));
  },
}));
