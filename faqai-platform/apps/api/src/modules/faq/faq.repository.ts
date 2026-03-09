import {
  getDb,
  faqItems,
  eq,
  and,
  desc,
  count,
} from '@faqai/db';

export type CreateFaqInput = {
  organizationId: string;
  siteId: string;
  categoryId: string;
  question: string;
  answer: string;
  status?: 'draft' | 'published' | 'archived';
  sourcePageId?: string;
  aiGenerated?: boolean;
  generationModel?: string | undefined;
};

export type UpdateFaqInput = {
  question?: string | undefined;
  answer?: string | undefined;
  status?: 'draft' | 'published' | 'archived' | undefined;
  categoryId?: string | undefined;
};

export class FaqRepository {
  private get db() {
    return getDb();
  }

  async findAll(
    organizationId: string,
    options?: {
      siteId?: string | undefined;
      status?: string | undefined;
      limit?: number | undefined;
      offset?: number | undefined;
    },
  ) {
    const conditions = [eq(faqItems.organizationId, organizationId)];
    if (options?.siteId) conditions.push(eq(faqItems.siteId, options.siteId));
    if (options?.status) {
      conditions.push(
        eq(
          faqItems.status,
          options.status as 'draft' | 'published' | 'archived',
        ),
      );
    }

    const [items, countResult] = await Promise.all([
      this.db
        .select({
          id: faqItems.id,
          organizationId: faqItems.organizationId,
          siteId: faqItems.siteId,
          categoryId: faqItems.categoryId,
          sourcePageId: faqItems.sourcePageId,
          question: faqItems.question,
          answer: faqItems.answer,
          status: faqItems.status,
          metadata: faqItems.metadata,
          qualityScore: faqItems.qualityScore,
          viewCount: faqItems.viewCount,
          publishedAt: faqItems.publishedAt,
          createdAt: faqItems.createdAt,
          updatedAt: faqItems.updatedAt,
        })
        .from(faqItems)
        .where(and(...conditions))
        .orderBy(desc(faqItems.createdAt))
        .limit(options?.limit ?? 50)
        .offset(options?.offset ?? 0),
      this.db
        .select({ total: count() })
        .from(faqItems)
        .where(and(...conditions)),
    ]);

    const totalRow = countResult[0];
    return { items, total: totalRow ? Number(totalRow.total) : 0 };
  }

  async findById(id: string, organizationId: string) {
    const [item] = await this.db
      .select()
      .from(faqItems)
      .where(
        and(eq(faqItems.id, id), eq(faqItems.organizationId, organizationId)),
      );
    return item ?? null;
  }

  async create(input: CreateFaqInput) {
    const metadata: import('@faqai/db').FaqItemMetadata = {
      aiGenerated: input.aiGenerated ?? false,
      ...(input.generationModel !== undefined
        ? { generationModel: input.generationModel }
        : {}),
    };

    const [item] = await this.db
      .insert(faqItems)
      .values({
        organizationId: input.organizationId,
        siteId: input.siteId,
        categoryId: input.categoryId,
        question: input.question,
        answer: input.answer,
        status: input.status ?? 'draft',
        ...(input.sourcePageId !== undefined
          ? { sourcePageId: input.sourcePageId }
          : {}),
        metadata,
      })
      .returning({
        id: faqItems.id,
        organizationId: faqItems.organizationId,
        siteId: faqItems.siteId,
        categoryId: faqItems.categoryId,
        sourcePageId: faqItems.sourcePageId,
        question: faqItems.question,
        answer: faqItems.answer,
        status: faqItems.status,
        metadata: faqItems.metadata,
        qualityScore: faqItems.qualityScore,
        viewCount: faqItems.viewCount,
        publishedAt: faqItems.publishedAt,
        createdAt: faqItems.createdAt,
        updatedAt: faqItems.updatedAt,
      });
    return item;
  }

  async update(id: string, organizationId: string, input: UpdateFaqInput) {
    const updateData: Partial<typeof faqItems.$inferInsert> = {
      updatedAt: new Date(),
    };
    if (input.question !== undefined) updateData.question = input.question;
    if (input.answer !== undefined) updateData.answer = input.answer;
    if (input.status !== undefined) {
      updateData.status = input.status;
      if (input.status === 'published') updateData.publishedAt = new Date();
    }
    if (input.categoryId !== undefined) updateData.categoryId = input.categoryId;

    const [updated] = await this.db
      .update(faqItems)
      .set(updateData)
      .where(
        and(eq(faqItems.id, id), eq(faqItems.organizationId, organizationId)),
      )
      .returning({
        id: faqItems.id,
        organizationId: faqItems.organizationId,
        siteId: faqItems.siteId,
        categoryId: faqItems.categoryId,
        sourcePageId: faqItems.sourcePageId,
        question: faqItems.question,
        answer: faqItems.answer,
        status: faqItems.status,
        metadata: faqItems.metadata,
        qualityScore: faqItems.qualityScore,
        viewCount: faqItems.viewCount,
        publishedAt: faqItems.publishedAt,
        createdAt: faqItems.createdAt,
        updatedAt: faqItems.updatedAt,
      });
    return updated ?? null;
  }

  async delete(id: string, organizationId: string) {
    const [deleted] = await this.db
      .delete(faqItems)
      .where(
        and(eq(faqItems.id, id), eq(faqItems.organizationId, organizationId)),
      )
      .returning({ id: faqItems.id });
    return !!deleted;
  }
}
