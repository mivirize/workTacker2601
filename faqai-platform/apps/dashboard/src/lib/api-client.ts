import { useAuthStore } from '@/stores/auth-store';

export class ApiError extends Error {
  constructor(
    message: string,
    public readonly statusCode: number,
    public readonly code?: string,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

class ApiClient {
  private readonly baseUrl: string;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
  }

  private getAuthHeaders(): Record<string, string> {
    const { tokens } = useAuthStore.getState();
    if (!tokens?.accessToken) return {};
    return { Authorization: `Bearer ${tokens.accessToken}` };
  }

  private async refreshAccessToken(): Promise<string | null> {
    const { tokens, user, setUser, setTokens, clearAuth } = useAuthStore.getState();
    if (!tokens?.refreshToken) return null;

    try {
      const response = await fetch(`${this.baseUrl}/api/v1/auth/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken: tokens.refreshToken }),
      });

      if (!response.ok) {
        clearAuth();
        return null;
      }

      const data = (await response.json()) as {
        success: boolean;
        data: { accessToken: string; refreshToken: string; expiresIn: number };
      };
      const newTokens = data.data;

      if (user) {
        setUser(user, newTokens);
      } else {
        setTokens(newTokens);
      }
      return newTokens.accessToken;
    } catch {
      clearAuth();
      return null;
    }
  }

  private async request<T>(
    path: string,
    options: RequestInit = {},
    retry = true,
  ): Promise<T> {
    const url = `${this.baseUrl}${path}`;
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...this.getAuthHeaders(),
      ...(options.headers as Record<string, string> | undefined),
    };

    const response = await fetch(url, { ...options, headers });

    if (response.status === 401 && retry) {
      const newToken = await this.refreshAccessToken();
      if (newToken) {
        return this.request<T>(path, options, false);
      }

      if (typeof window !== 'undefined') {
        window.location.href = '/login';
      }
      throw new ApiError('認証が必要です', 401, 'UNAUTHORIZED');
    }

    if (!response.ok) {
      const errorData = (await response.json().catch(() => ({}))) as {
        error?: { message?: string; code?: string };
      };
      throw new ApiError(
        errorData.error?.message ?? `HTTPエラー: ${response.status}`,
        response.status,
        errorData.error?.code,
      );
    }

    if (response.status === 204) {
      return undefined as unknown as T;
    }

    const body = (await response.json()) as { success: boolean; data: T };
    return body.data;
  }

  async get<T>(path: string, options?: RequestInit): Promise<T> {
    return this.request<T>(path, { ...options, method: 'GET' });
  }

  async post<T>(path: string, body: unknown, options?: RequestInit): Promise<T> {
    return this.request<T>(path, {
      ...options,
      method: 'POST',
      body: JSON.stringify(body),
    });
  }

  async patch<T>(path: string, body: unknown): Promise<T> {
    return this.request<T>(path, {
      method: 'PATCH',
      body: JSON.stringify(body),
    });
  }

  async put<T>(path: string, body: unknown): Promise<T> {
    return this.request<T>(path, {
      method: 'PUT',
      body: JSON.stringify(body),
    });
  }

  async delete<T>(path: string): Promise<T> {
    return this.request<T>(path, { method: 'DELETE' });
  }
}

export const apiClient = new ApiClient(
  process.env['NEXT_PUBLIC_API_URL'] ?? '',
);

// ---------------------------------------------------------------------------
// Domain types (DB response shapes)
// ---------------------------------------------------------------------------

export type SiteRecord = {
  id: string;
  organizationId: string;
  name: string;
  url: string;
  domain: string;
  slug: string;
  description: string | null;
  notes: string | null;
  aiContext: string | null;
  logoUrl: string | null;
  themeColor: string | null;
  crawlConfig: {
    max_pages: number;
    max_depth: number;
    respect_robots_txt: boolean;
    rate_limit_ms: number;
    include_patterns: string[];
    exclude_patterns: string[];
    auth_config: null;
    screenshot_enabled: boolean;
    js_rendering: boolean;
  };
  scheduleCron: string | null;
  isVerified: boolean;
  lastCrawledAt: string | null;
  createdAt: string;
  updatedAt: string;
};

export type CrawlJobRecord = {
  id: string;
  siteId: string;
  organizationId: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  totalPages: number | null;
  crawledPages: number | null;
  faqGenerated: number | null;
  errorLog: Record<string, unknown>[] | null;
  startedAt: string | null;
  completedAt: string | null;
  createdAt: string;
  updatedAt: string;
};

export type FaqRecord = {
  id: string;
  organizationId: string;
  siteId: string;
  categoryId: string;
  sourcePageId: string | null;
  question: string;
  answer: string;
  status: 'draft' | 'published' | 'archived';
  metadata: { aiGenerated: boolean; generationModel?: string };
  qualityScore: number | null;
  viewCount: number;
  publishedAt: string | null;
  createdAt: string;
  updatedAt: string;
};

// ---------------------------------------------------------------------------
// Domain-specific API helpers
// ---------------------------------------------------------------------------

export const siteApi = {
  list: () =>
    apiClient.get<{ sites: SiteRecord[] }>('/api/v1/sites'),
  create: (data: {
    name: string;
    url: string;
    crawlConfig?: { max_pages?: number; max_depth?: number; rate_limit_ms?: number };
  }) => apiClient.post<{ site: SiteRecord }>('/api/v1/sites', data),
  get: (id: string) =>
    apiClient.get<{ site: SiteRecord }>(`/api/v1/sites/${id}`),
  update: (id: string, data: {
    name?: string;
    description?: string | null;
    notes?: string | null;
    aiContext?: string | null;
    logoUrl?: string | null;
    themeColor?: string | null;
  }) => apiClient.patch<{ site: SiteRecord }>(`/api/v1/sites/${id}`, data),
  updateSlug: (id: string, slug: string) =>
    apiClient.patch<{ site: SiteRecord }>(`/api/v1/sites/${id}/slug`, { slug }),
  remove: (id: string) =>
    apiClient.delete<{ message: string }>(`/api/v1/sites/${id}`),
  startCrawl: (id: string) =>
    apiClient.post<{ job: CrawlJobRecord; message: string }>(
      `/api/v1/sites/${id}/crawl`,
      {},
    ),
  getCrawlJobs: (id: string) =>
    apiClient.get<{ jobs: CrawlJobRecord[] }>(`/api/v1/sites/${id}/crawl-jobs`),
};

export type UserProfile = {
  id: string;
  email: string;
  name: string;
  avatarUrl?: string;
  createdAt: string;
  updatedAt: string;
};

export const authApi = {
  me: () =>
    apiClient.get<{ user: UserProfile; organizationId: string }>('/api/v1/auth/me'),
  updateProfile: (data: { name?: string }) =>
    apiClient.patch<{ user: UserProfile }>('/api/v1/auth/me', data),
};

export type TagRecord = {
  id: string;
  organizationId: string;
  name: string;
  color: string | null;
  createdAt: string;
};

export const tagApi = {
  list: () =>
    apiClient.get<{ tags: TagRecord[] }>('/api/v1/tags'),
  create: (data: { name: string; color?: string }) =>
    apiClient.post<{ tag: TagRecord }>('/api/v1/tags', data),
  update: (id: string, data: { name?: string; color?: string }) =>
    apiClient.patch<{ tag: TagRecord }>(`/api/v1/tags/${id}`, data),
  remove: (id: string) =>
    apiClient.delete<void>(`/api/v1/tags/${id}`),
  getForFaq: (faqId: string) =>
    apiClient.get<{ tags: TagRecord[] }>(`/api/v1/tags/faqs/${faqId}/tags`),
  setForFaq: (faqId: string, tagIds: string[]) =>
    apiClient.put<{ tags: TagRecord[] }>(`/api/v1/tags/faqs/${faqId}/tags`, { tagIds }),
};

// ---------------------------------------------------------------------------
// Chatbot types
// ---------------------------------------------------------------------------

export type ChatbotWidgetConfig = {
  position: 'bottom-right' | 'bottom-left';
  primary_color: string;
  greeting_message: string;
  placeholder_text: string;
  avatar_url: string | null;
  icon_type: string;
  show_branding: boolean;
  auto_open_delay_ms: number | null;
  mobile_full_screen: boolean;
};

export type ChatbotAiConfig = {
  provider: string;
  model: string;
  temperature: number;
  max_tokens: number;
  system_prompt: string | null;
  confidence_threshold: number;
  fallback_message: string;
  max_context_messages: number;
};

export type ChatbotRecord = {
  id: string;
  organizationId: string;
  siteId: string;
  name: string;
  type: 'scenario' | 'ai' | 'hybrid';
  isActive: boolean;
  widgetConfig: ChatbotWidgetConfig;
  aiConfig: ChatbotAiConfig;
  allowedDomains: string[];
  createdAt: string;
  updatedAt: string;
};

export type CreateChatbotInput = {
  siteId: string;
  name: string;
  type: 'scenario' | 'ai' | 'hybrid';
  widgetConfig?: Partial<ChatbotWidgetConfig>;
  aiConfig?: Partial<ChatbotAiConfig>;
};

export type UpdateChatbotInput = {
  name?: string;
  type?: 'scenario' | 'ai' | 'hybrid';
  isActive?: boolean;
  widgetConfig?: Partial<ChatbotWidgetConfig>;
  aiConfig?: Partial<ChatbotAiConfig>;
  allowedDomains?: string[];
};

// ---------------------------------------------------------------------------
// Scenario types
// ---------------------------------------------------------------------------

export type ScenarioNodeType = 'message' | 'question' | 'choice' | 'action' | 'end';

export type ScenarioNode = {
  id: string;
  scenarioId: string;
  nodeType: ScenarioNodeType;
  content: Record<string, unknown>;
  isStart: boolean;
  isEnd: boolean;
  positionX: number;
  positionY: number;
  createdAt: string;
  updatedAt: string;
};

export type ScenarioEdge = {
  id: string;
  scenarioId: string;
  fromNodeId: string;
  toNodeId: string;
  label: string | null;
  condition: Record<string, unknown> | null;
  createdAt: string;
};

export type ScenarioRecord = {
  id: string;
  chatbotId: string;
  organizationId: string;
  name: string;
  description: string | null;
  triggerKeywords: string[];
  isActive: boolean;
  sortOrder: number;
  nodes?: ScenarioNode[];
  edges?: ScenarioEdge[];
  createdAt: string;
  updatedAt: string;
};

export type CreateScenarioInput = {
  name: string;
  description?: string;
  triggerKeywords?: string[];
};

export type CreateNodeInput = {
  nodeType: ScenarioNodeType;
  content: Record<string, unknown>;
  isStart?: boolean;
  isEnd?: boolean;
  positionX?: number;
  positionY?: number;
};

export type CreateEdgeInput = {
  fromNodeId: string;
  toNodeId: string;
  label?: string;
  condition?: Record<string, unknown>;
};

export const chatbotApi = {
  list: () =>
    apiClient.get<{ chatbots: ChatbotRecord[] }>('/api/v1/chatbot'),
  listBySite: (siteId: string) =>
    apiClient.get<{ chatbots: ChatbotRecord[] }>(`/api/v1/chatbot?siteId=${encodeURIComponent(siteId)}`),
  getById: (id: string) =>
    apiClient.get<{ chatbot: ChatbotRecord }>(`/api/v1/chatbot/${id}`),
  create: (data: CreateChatbotInput) =>
    apiClient.post<{ chatbot: ChatbotRecord }>('/api/v1/chatbot', data),
  update: (id: string, data: UpdateChatbotInput) =>
    apiClient.put<{ chatbot: ChatbotRecord }>(`/api/v1/chatbot/${id}`, data),
  remove: (id: string) =>
    apiClient.delete<{ message: string }>(`/api/v1/chatbot/${id}`),

  // Preview chat (authenticated, isActive不問)
  previewChat: (chatbotId: string, message: string, sessionId: string) =>
    apiClient.post<{ message: string; choices?: string[]; isEnd?: boolean }>(
      `/api/v1/chatbot/${chatbotId}/preview-chat`,
      { message, sessionId },
    ),

  // FAQ → Scenario 自動生成
  generateFaqScenario: (
    chatbotId: string,
    opts?: { scenarioName?: string; greetingMessage?: string; maxQuestionsPerCategory?: number },
  ) =>
    apiClient.post<{
      scenarioId: string;
      nodeCount: number;
      edgeCount: number;
      categoryCount: number;
      faqCount: number;
    }>(`/api/v1/chatbot/${chatbotId}/generate-faq-scenario`, opts ?? {}),

  // Scenario CRUD
  listScenarios: (chatbotId: string) =>
    apiClient.get<{ scenarios: ScenarioRecord[] }>(`/api/v1/chatbot/${chatbotId}/scenarios`),
  createScenario: (chatbotId: string, data: CreateScenarioInput) =>
    apiClient.post<{ scenario: ScenarioRecord }>(`/api/v1/chatbot/${chatbotId}/scenarios`, data),
  getScenario: (scenarioId: string) =>
    apiClient.get<{ scenario: ScenarioRecord; nodes: ScenarioNode[]; edges: ScenarioEdge[] }>(`/api/v1/chatbot/scenarios/${scenarioId}`),
  updateScenario: (scenarioId: string, data: Partial<CreateScenarioInput> & { isActive?: boolean }) =>
    apiClient.put<{ scenario: ScenarioRecord }>(`/api/v1/chatbot/scenarios/${scenarioId}`, data),
  deleteScenario: (scenarioId: string) =>
    apiClient.delete<{ message: string }>(`/api/v1/chatbot/scenarios/${scenarioId}`),

  // Node CRUD
  createNode: (scenarioId: string, data: CreateNodeInput) =>
    apiClient.post<{ node: ScenarioNode }>(`/api/v1/chatbot/scenarios/${scenarioId}/nodes`, data),
  updateNode: (scenarioId: string, nodeId: string, data: Partial<CreateNodeInput>) =>
    apiClient.put<{ node: ScenarioNode }>(`/api/v1/chatbot/scenarios/${scenarioId}/nodes/${nodeId}`, data),
  deleteNode: (scenarioId: string, nodeId: string) =>
    apiClient.delete<{ message: string }>(`/api/v1/chatbot/scenarios/${scenarioId}/nodes/${nodeId}`),

  // Edge CRUD
  createEdge: (scenarioId: string, data: CreateEdgeInput) =>
    apiClient.post<{ edge: ScenarioEdge }>(`/api/v1/chatbot/scenarios/${scenarioId}/edges`, data),
  deleteEdge: (scenarioId: string, edgeId: string) =>
    apiClient.delete<{ message: string }>(`/api/v1/chatbot/scenarios/${scenarioId}/edges/${edgeId}`),
};

export const faqApi = {
  list: (params?: {
    siteId?: string;
    status?: string;
    limit?: number;
    offset?: number;
  }) => {
    const query = new URLSearchParams();
    if (params?.siteId) query.set('siteId', params.siteId);
    if (params?.status) query.set('status', params.status);
    if (params?.limit !== undefined) query.set('limit', String(params.limit));
    if (params?.offset !== undefined) query.set('offset', String(params.offset));
    const qs = query.toString();
    return apiClient.get<{ items: FaqRecord[]; total: number }>(
      `/api/v1/faqs${qs ? `?${qs}` : ''}`,
    );
  },
  update: (
    id: string,
    data: {
      question?: string;
      answer?: string;
      status?: 'draft' | 'published' | 'archived';
      categoryId?: string;
    },
  ) => apiClient.patch<{ faq: FaqRecord }>(`/api/v1/faqs/${id}`, data),
  remove: (id: string) => apiClient.delete<void>(`/api/v1/faqs/${id}`),
};
