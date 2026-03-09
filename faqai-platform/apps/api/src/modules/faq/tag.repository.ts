import {
  getDb,
  faqTags,
  faqItemTags,
  eq,
  and,
} from '@faqai/db';

export type CreateTagInput = {
  organizationId: string;
  name: string;
  color?: string;
};

export type UpdateTagInput = {
  name?: string;
  color?: string;
};

export class TagRepository {
  private get db() {
    return getDb();
  }

  async findAll(organizationId: string) {
    return this.db
      .select({
        id: faqTags.id,
        organizationId: faqTags.organizationId,
        name: faqTags.name,
        color: faqTags.color,
        createdAt: faqTags.createdAt,
      })
      .from(faqTags)
      .where(eq(faqTags.organizationId, organizationId))
      .orderBy(faqTags.name);
  }

  async findById(id: string, organizationId: string) {
    const [tag] = await this.db
      .select()
      .from(faqTags)
      .where(
        and(eq(faqTags.id, id), eq(faqTags.organizationId, organizationId)),
      );
    return tag ?? null;
  }

  async create(input: CreateTagInput) {
    const [tag] = await this.db
      .insert(faqTags)
      .values({
        organizationId: input.organizationId,
        name: input.name,
        color: input.color ?? '#6366f1',
      })
      .returning();
    return tag;
  }

  async update(id: string, organizationId: string, input: UpdateTagInput) {
    const updateData: Partial<typeof faqTags.$inferInsert> = {};
    if (input.name !== undefined) updateData.name = input.name;
    if (input.color !== undefined) updateData.color = input.color;

    if (Object.keys(updateData).length === 0) return null;

    const [updated] = await this.db
      .update(faqTags)
      .set(updateData)
      .where(
        and(eq(faqTags.id, id), eq(faqTags.organizationId, organizationId)),
      )
      .returning();
    return updated ?? null;
  }

  async delete(id: string, organizationId: string) {
    const [deleted] = await this.db
      .delete(faqTags)
      .where(
        and(eq(faqTags.id, id), eq(faqTags.organizationId, organizationId)),
      )
      .returning({ id: faqTags.id });
    return !!deleted;
  }

  // FAQ-Tag 関連操作

  async getTagsForFaq(faqItemId: string) {
    const results = await this.db
      .select({
        id: faqTags.id,
        name: faqTags.name,
        color: faqTags.color,
      })
      .from(faqItemTags)
      .innerJoin(faqTags, eq(faqItemTags.tagId, faqTags.id))
      .where(eq(faqItemTags.faqItemId, faqItemId));
    return results;
  }

  async setTagsForFaq(faqItemId: string, tagIds: string[]) {
    // 既存のタグ関連を削除
    await this.db
      .delete(faqItemTags)
      .where(eq(faqItemTags.faqItemId, faqItemId));

    // 新しいタグ関連を追加
    if (tagIds.length > 0) {
      await this.db.insert(faqItemTags).values(
        tagIds.map((tagId) => ({
          faqItemId,
          tagId,
        })),
      );
    }
  }

  async addTagToFaq(faqItemId: string, tagId: string) {
    await this.db
      .insert(faqItemTags)
      .values({ faqItemId, tagId })
      .onConflictDoNothing();
  }

  async removeTagFromFaq(faqItemId: string, tagId: string) {
    await this.db
      .delete(faqItemTags)
      .where(
        and(
          eq(faqItemTags.faqItemId, faqItemId),
          eq(faqItemTags.tagId, tagId),
        ),
      );
  }
}
