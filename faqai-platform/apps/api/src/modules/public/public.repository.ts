import {
  getDb,
  sites,
  chatbots,
  faqItems,
  faqCategories,
  faqItemScreenshots,
  pageScreenshots,
  eq,
  and,
  desc,
  count,
  sql,
  inArray,
} from '@faqai/db';

export class PublicRepository {
  private get db() {
    return getDb();
  }

  async findSiteBySlug(slug: string) {
    const [site] = await this.db
      .select({
        id: sites.id,
        name: sites.name,
        domain: sites.domain,
        slug: sites.slug,
        logoUrl: sites.logoUrl,
        themeColor: sites.themeColor,
      })
      .from(sites)
      .where(eq(sites.slug, slug));
    return site ?? null;
  }

  async findSiteByDomain(domain: string) {
    const [site] = await this.db
      .select({
        id: sites.id,
        name: sites.name,
        domain: sites.domain,
        slug: sites.slug,
      })
      .from(sites)
      .where(eq(sites.domain, domain));
    return site ?? null;
  }

  async findCategories(siteId: string) {
    return this.db
      .select({
        id: faqCategories.id,
        name: faqCategories.name,
        slug: faqCategories.slug,
        description: faqCategories.description,
        icon: faqCategories.icon,
        sortOrder: faqCategories.sortOrder,
      })
      .from(faqCategories)
      .where(
        and(
          eq(faqCategories.siteId, siteId),
          eq(faqCategories.isVisible, true),
        ),
      )
      .orderBy(faqCategories.sortOrder);
  }

  async findPublishedFaqs(
    siteId: string,
    options?: {
      q?: string;
      categorySlug?: string;
      limit?: number;
      offset?: number;
    },
  ) {
    const conditions: ReturnType<typeof eq>[] = [
      eq(faqItems.siteId, siteId),
      eq(faqItems.status, 'published'),
    ];

    if (options?.q) {
      conditions.push(
        sql`${faqItems.searchVector} @@ plainto_tsquery('simple', ${options.q})` as ReturnType<typeof eq>,
      );
    }

    if (options?.categorySlug) {
      // Find category by slug first
      const [cat] = await this.db
        .select({ id: faqCategories.id })
        .from(faqCategories)
        .where(
          and(
            eq(faqCategories.siteId, siteId),
            eq(faqCategories.slug, options.categorySlug),
          ),
        );
      if (cat) {
        conditions.push(eq(faqItems.categoryId, cat.id));
      }
    }

    const [items, countResult, categories] = await Promise.all([
      this.db
        .select({
          id: faqItems.id,
          question: faqItems.question,
          answer: faqItems.answer,
          categoryId: faqItems.categoryId,
          categoryName: faqCategories.name,
          categorySlug: faqCategories.slug,
          categoryIcon: faqCategories.icon,
          sortOrder: faqItems.sortOrder,
          viewCount: faqItems.viewCount,
          helpfulCount: faqItems.helpfulCount,
          createdAt: faqItems.createdAt,
        })
        .from(faqItems)
        .leftJoin(faqCategories, eq(faqItems.categoryId, faqCategories.id))
        .where(and(...conditions))
        .orderBy(faqCategories.sortOrder, faqItems.sortOrder, desc(faqItems.createdAt))
        .limit(options?.limit ?? 100)
        .offset(options?.offset ?? 0),
      this.db
        .select({ total: count() })
        .from(faqItems)
        .where(and(...conditions)),
      this.findCategories(siteId),
    ]);

    const totalRow = countResult[0];

    // Fetch screenshots for all FAQ items in this result set
    const faqIds = items.map((item) => item.id);
    const screenshotMap = faqIds.length > 0
      ? await this.findScreenshotsForFaqItems(faqIds)
      : new Map<string, { id: string; thumbnailPath: string | null; storagePath: string }[]>();

    const itemsWithScreenshots = items.map((item) => ({
      ...item,
      screenshots: screenshotMap.get(item.id) ?? [],
    }));

    return {
      items: itemsWithScreenshots,
      total: totalRow ? Number(totalRow.total) : 0,
      categories,
    };
  }

  async findScreenshotsForFaqItems(
    faqItemIds: string[],
  ): Promise<Map<string, { id: string; thumbnailPath: string | null; storagePath: string }[]>> {
    if (faqItemIds.length === 0) {
      return new Map();
    }

    const rows = await this.db
      .select({
        faqItemId: faqItemScreenshots.faqItemId,
        screenshotId: pageScreenshots.id,
        storagePath: pageScreenshots.storagePath,
        thumbnailPath: pageScreenshots.thumbnailPath,
        sortOrder: faqItemScreenshots.sortOrder,
      })
      .from(faqItemScreenshots)
      .innerJoin(pageScreenshots, eq(faqItemScreenshots.screenshotId, pageScreenshots.id))
      .where(inArray(faqItemScreenshots.faqItemId, faqItemIds))
      .orderBy(faqItemScreenshots.sortOrder);

    const result = new Map<string, { id: string; thumbnailPath: string | null; storagePath: string }[]>();
    for (const row of rows) {
      const existing = result.get(row.faqItemId) ?? [];
      existing.push({
        id: row.screenshotId,
        thumbnailPath: row.thumbnailPath,
        storagePath: row.storagePath,
      });
      result.set(row.faqItemId, existing);
    }

    return result;
  }

  async findScreenshotById(screenshotId: string) {
    const [row] = await this.db
      .select({
        id: pageScreenshots.id,
        storagePath: pageScreenshots.storagePath,
      })
      .from(pageScreenshots)
      .where(eq(pageScreenshots.id, screenshotId));
    return row ?? null;
  }

  async findActiveChatbotBySite(siteId: string) {
    const [chatbot] = await this.db
      .select({
        id: chatbots.id,
        name: chatbots.name,
        type: chatbots.type,
        widgetConfig: chatbots.widgetConfig,
      })
      .from(chatbots)
      .where(and(eq(chatbots.siteId, siteId), eq(chatbots.isActive, true)))
      .limit(1);
    return chatbot ?? null;
  }
}
