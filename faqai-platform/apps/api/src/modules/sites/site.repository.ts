import {
  getDb,
  sites,
  crawlJobs,
  crawlPages,
  faqCategories,
  pageScreenshots,
  eq,
  and,
  desc,
} from '@faqai/db';
import type { CrawlConfig } from '@faqai/db';

function generateSlug(name: string, url: string): string {
  // Try name first: lowercase, replace non-alphanumeric with hyphens
  const fromName = name
    .toLowerCase()
    .replace(/[^a-z0-9\u3000-\u9fff\uf900-\ufaff]+/g, '-')
    .replace(/^-+|-+$/g, '');
  if (fromName) return fromName;

  // Fallback: extract from domain
  try {
    const domain = new URL(url).hostname.replace(/^www\./, '');
    return domain.replace(/\.[^.]+$/, '').replace(/[^a-z0-9-]/g, '-');
  } catch {
    return `site-${Date.now()}`;
  }
}

export type CreateSiteInput = {
  organizationId: string;
  name: string;
  url: string;
  domain: string;
  crawlConfig?: CrawlConfigPatch | undefined;
};

export type CrawlConfigPatch = {
  max_pages?: number | undefined;
  max_depth?: number | undefined;
  respect_robots_txt?: boolean | undefined;
  rate_limit_ms?: number | undefined;
};

export type UpdateSiteInput = {
  name?: string | undefined;
  description?: string | null | undefined;
  notes?: string | null | undefined;
  aiContext?: string | null | undefined;
  logoUrl?: string | null | undefined;
  themeColor?: string | null | undefined;
  crawlConfig?: CrawlConfigPatch | undefined;
  scheduleCron?: string | null | undefined;
};

export class SiteRepository {
  private get db() {
    return getDb();
  }

  async findAll(organizationId: string) {
    return this.db
      .select({
        id: sites.id,
        organizationId: sites.organizationId,
        name: sites.name,
        url: sites.url,
        slug: sites.slug,
        domain: sites.domain,
        description: sites.description,
        notes: sites.notes,
        aiContext: sites.aiContext,
        logoUrl: sites.logoUrl,
        themeColor: sites.themeColor,
        crawlConfig: sites.crawlConfig,
        scheduleCron: sites.scheduleCron,
        isVerified: sites.isVerified,
        lastCrawledAt: sites.lastCrawledAt,
        createdAt: sites.createdAt,
        updatedAt: sites.updatedAt,
      })
      .from(sites)
      .where(eq(sites.organizationId, organizationId))
      .orderBy(desc(sites.createdAt));
  }

  async findById(id: string, organizationId: string) {
    const [site] = await this.db
      .select()
      .from(sites)
      .where(and(eq(sites.id, id), eq(sites.organizationId, organizationId)));
    return site ?? null;
  }

  async create(input: CreateSiteInput) {
    const defaultConfig: CrawlConfig = {
      max_pages: 20,
      max_depth: 3,
      respect_robots_txt: true,
      rate_limit_ms: 1000,
      include_patterns: [],
      exclude_patterns: [],
      auth_config: null,
      screenshot_enabled: false,
      js_rendering: false,
    };

    const slug = generateSlug(input.name, input.url);

    const [site] = await this.db
      .insert(sites)
      .values({
        organizationId: input.organizationId,
        name: input.name,
        url: input.url,
        domain: input.domain,
        slug,
        crawlConfig: {
          ...defaultConfig,
          ...(input.crawlConfig?.max_pages !== undefined ? { max_pages: input.crawlConfig.max_pages } : {}),
          ...(input.crawlConfig?.max_depth !== undefined ? { max_depth: input.crawlConfig.max_depth } : {}),
          ...(input.crawlConfig?.respect_robots_txt !== undefined ? { respect_robots_txt: input.crawlConfig.respect_robots_txt } : {}),
          ...(input.crawlConfig?.rate_limit_ms !== undefined ? { rate_limit_ms: input.crawlConfig.rate_limit_ms } : {}),
        },
      })
      .returning();

    if (!site) throw new Error('Failed to create site');

    // デフォルトカテゴリを自動作成
    await this.db.insert(faqCategories).values({
      organizationId: input.organizationId,
      siteId: site.id,
      name: '全般',
      slug: 'general',
      description: 'デフォルトカテゴリ',
      sortOrder: 0,
    });

    return site;
  }

  async update(id: string, organizationId: string, input: UpdateSiteInput) {
    const existing = await this.findById(id, organizationId);
    if (!existing) return null;

    const updateData: Partial<typeof sites.$inferInsert> = {
      updatedAt: new Date(),
    };
    if (input.name !== undefined) updateData.name = input.name;
    if (input.description !== undefined) updateData.description = input.description ?? undefined;
    if (input.notes !== undefined) updateData.notes = input.notes ?? undefined;
    if (input.aiContext !== undefined) updateData.aiContext = input.aiContext ?? undefined;
    if (input.logoUrl !== undefined) updateData.logoUrl = input.logoUrl ?? undefined;
    if (input.themeColor !== undefined) updateData.themeColor = input.themeColor ?? undefined;
    if (input.crawlConfig !== undefined) {
      const patch = input.crawlConfig;
      updateData.crawlConfig = {
        ...existing.crawlConfig,
        ...(patch.max_pages !== undefined ? { max_pages: patch.max_pages } : {}),
        ...(patch.max_depth !== undefined ? { max_depth: patch.max_depth } : {}),
        ...(patch.respect_robots_txt !== undefined ? { respect_robots_txt: patch.respect_robots_txt } : {}),
        ...(patch.rate_limit_ms !== undefined ? { rate_limit_ms: patch.rate_limit_ms } : {}),
      };
    }
    if (input.scheduleCron !== undefined) {
      updateData.scheduleCron = input.scheduleCron ?? undefined;
    }

    const [updated] = await this.db
      .update(sites)
      .set(updateData)
      .where(and(eq(sites.id, id), eq(sites.organizationId, organizationId)))
      .returning();
    return updated ?? null;
  }

  async findBySlug(slug: string) {
    const [site] = await this.db
      .select()
      .from(sites)
      .where(eq(sites.slug, slug));
    return site ?? null;
  }

  async updateSlug(id: string, organizationId: string, slug: string) {
    const existing = await this.findById(id, organizationId);
    if (!existing) return null;

    const conflicting = await this.findBySlug(slug);
    if (conflicting && conflicting.id !== id) {
      throw new Error('SLUG_CONFLICT');
    }

    const [updated] = await this.db
      .update(sites)
      .set({ slug, updatedAt: new Date() })
      .where(and(eq(sites.id, id), eq(sites.organizationId, organizationId)))
      .returning();
    return updated ?? null;
  }

  async delete(id: string, organizationId: string) {
    const [deleted] = await this.db
      .delete(sites)
      .where(and(eq(sites.id, id), eq(sites.organizationId, organizationId)))
      .returning({ id: sites.id });
    return !!deleted;
  }

  async getCrawlJobs(siteId: string, organizationId: string, limit = 10) {
    return this.db
      .select()
      .from(crawlJobs)
      .where(
        and(
          eq(crawlJobs.siteId, siteId),
          eq(crawlJobs.organizationId, organizationId),
        ),
      )
      .orderBy(desc(crawlJobs.createdAt))
      .limit(limit);
  }

  async createCrawlJob(
    siteId: string,
    organizationId: string,
    configSnapshot: CrawlConfig,
  ) {
    const [job] = await this.db
      .insert(crawlJobs)
      .values({
        siteId,
        organizationId,
        status: 'pending',
        configSnapshot,
      })
      .returning();
    return job;
  }

  async updateCrawlJob(
    jobId: string,
    status: 'running' | 'completed' | 'failed',
    extra?: {
      totalPages?: number;
      crawledPages?: number;
      faqGenerated?: number;
      errorLog?: Record<string, unknown>[];
    },
  ) {
    const updateData: Partial<typeof crawlJobs.$inferInsert> = {
      status,
      updatedAt: new Date(),
    };
    if (status === 'running') updateData.startedAt = new Date();
    if (status === 'completed' || status === 'failed') {
      updateData.completedAt = new Date();
    }
    if (extra?.totalPages !== undefined) updateData.totalPages = extra.totalPages;
    if (extra?.crawledPages !== undefined) updateData.crawledPages = extra.crawledPages;
    if (extra?.faqGenerated !== undefined) updateData.faqGenerated = extra.faqGenerated;
    if (extra?.errorLog !== undefined) updateData.errorLog = extra.errorLog;

    const [updated] = await this.db
      .update(crawlJobs)
      .set(updateData)
      .where(eq(crawlJobs.id, jobId))
      .returning();
    return updated ?? null;
  }

  async saveCrawlPage(data: {
    crawlJobId: string;
    siteId: string;
    organizationId: string;
    url: string;
    title: string | null;
    contentText: string | null;
    depth: number;
    httpStatus: number;
    contentHash: string;
  }) {
    const [page] = await this.db.insert(crawlPages).values(data).returning();
    return page;
  }

  async getDefaultCategoryId(
    siteId: string,
    organizationId: string,
  ): Promise<string | null> {
    const [cat] = await this.db
      .select({ id: faqCategories.id })
      .from(faqCategories)
      .where(
        and(
          eq(faqCategories.siteId, siteId),
          eq(faqCategories.organizationId, organizationId),
        ),
      )
      .limit(1);
    return cat?.id ?? null;
  }

  async updateSiteLastCrawled(siteId: string) {
    await this.db
      .update(sites)
      .set({ lastCrawledAt: new Date(), updatedAt: new Date() })
      .where(eq(sites.id, siteId));
  }

  async saveScreenshot(params: {
    crawlPageId: string;
    organizationId: string;
    storagePath: string;
    thumbnailPath?: string;
    width?: number;
    height?: number;
    fileSizeBytes?: number;
    sectionSelector?: string;
  }): Promise<string> {
    const [row] = await this.db.insert(pageScreenshots).values({
      crawlPageId: params.crawlPageId,
      organizationId: params.organizationId,
      storagePath: params.storagePath,
      thumbnailPath: params.thumbnailPath ?? null,
      width: params.width ?? null,
      height: params.height ?? null,
      fileSizeBytes: params.fileSizeBytes ?? null,
      sectionSelector: params.sectionSelector ?? null,
    }).returning({ id: pageScreenshots.id });
    return row!.id;
  }

  async getScreenshotsForPage(crawlPageId: string): Promise<Array<{
    id: string;
    storagePath: string;
    thumbnailPath: string | null;
    sectionSelector: string | null;
  }>> {
    return this.db.select({
      id: pageScreenshots.id,
      storagePath: pageScreenshots.storagePath,
      thumbnailPath: pageScreenshots.thumbnailPath,
      sectionSelector: pageScreenshots.sectionSelector,
    }).from(pageScreenshots).where(eq(pageScreenshots.crawlPageId, crawlPageId));
  }
}
