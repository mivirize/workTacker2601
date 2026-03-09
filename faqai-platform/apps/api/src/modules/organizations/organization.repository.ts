import { organizations, memberships, getDb, eq } from '@faqai/db';

export type DbOrganization = typeof organizations.$inferSelect;

export type CreateOrganizationData = {
  name: string;
  slug: string;
};

export class OrganizationRepository {
  private get db() {
    return getDb();
  }

  async createOrganization(data: CreateOrganizationData): Promise<DbOrganization> {
    const result = await this.db
      .insert(organizations)
      .values({ name: data.name, slug: data.slug })
      .returning();
    const created = result[0];
    if (!created) throw new Error('Failed to create organization');
    return created;
  }

  async createMembership(
    organizationId: string,
    userId: string,
    role: 'owner' | 'admin' | 'editor' | 'viewer',
  ): Promise<void> {
    await this.db.insert(memberships).values({
      organizationId,
      userId,
      role,
      acceptedAt: new Date(),
    });
  }

  // ユーザーが所属する最初の Organization を返す
  async findOrganizationByUserId(userId: string): Promise<DbOrganization | null> {
    const result = await this.db
      .select({ org: organizations })
      .from(memberships)
      .innerJoin(organizations, eq(memberships.organizationId, organizations.id))
      .where(eq(memberships.userId, userId))
      .limit(1);
    return result[0]?.org ?? null;
  }

  async findOrganizationById(id: string): Promise<DbOrganization | null> {
    const result = await this.db
      .select()
      .from(organizations)
      .where(eq(organizations.id, id))
      .limit(1);
    return result[0] ?? null;
  }
}
