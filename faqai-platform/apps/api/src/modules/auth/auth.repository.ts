import { eq, getDb, users } from '@faqai/db';

export type DbUser = typeof users.$inferSelect;
export type CreateUserData = {
  email: string;
  passwordHash: string;
  name: string;
};

export class AuthRepository {
  private get db() {
    return getDb();
  }

  async findUserByEmail(email: string): Promise<DbUser | null> {
    const result = await this.db
      .select()
      .from(users)
      .where(eq(users.email, email.toLowerCase()))
      .limit(1);

    return result[0] ?? null;
  }

  async createUser(data: CreateUserData): Promise<DbUser> {
    const result = await this.db
      .insert(users)
      .values({
        email: data.email.toLowerCase(),
        passwordHash: data.passwordHash,
        name: data.name,
      })
      .returning();

    const created = result[0];
    if (!created) {
      throw new Error('Failed to create user');
    }
    return created;
  }

  async findUserById(id: string): Promise<DbUser | null> {
    const result = await this.db
      .select()
      .from(users)
      .where(eq(users.id, id))
      .limit(1);

    return result[0] ?? null;
  }

  async updateLastLogin(userId: string): Promise<void> {
    await this.db
      .update(users)
      .set({ lastLoginAt: new Date(), updatedAt: new Date() })
      .where(eq(users.id, userId));
  }

  async updateUser(userId: string, data: { name?: string }): Promise<DbUser> {
    const result = await this.db
      .update(users)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(users.id, userId))
      .returning();

    const updated = result[0];
    if (!updated) {
      throw new Error('Failed to update user');
    }
    return updated;
  }
}
