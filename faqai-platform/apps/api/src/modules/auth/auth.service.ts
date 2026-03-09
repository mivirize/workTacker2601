import { SignJWT, jwtVerify } from 'jose';
import bcryptjs from 'bcryptjs';
import { nanoid } from 'nanoid';
import { getRedis } from '../../lib/redis.js';
import { UnauthorizedError, ConflictError } from '../../lib/errors.js';
import { AuthRepository } from './auth.repository.js';
import { OrganizationRepository } from '../organizations/organization.repository.js';
import type { AuthTokens, JwtPayload, LoginRequest, RegisterRequest, User } from '@faqai/types';

const BCRYPT_ROUNDS = 12;
const ACCESS_TOKEN_EXPIRES_IN = 15 * 60; // 15分（秒）
const REFRESH_TOKEN_EXPIRES_IN = 7 * 24 * 60 * 60; // 7日（秒）

export class AuthService {
  private readonly repository: AuthRepository;
  private readonly orgRepository: OrganizationRepository;

  constructor(repository?: AuthRepository, orgRepository?: OrganizationRepository) {
    this.repository = repository ?? new AuthRepository();
    this.orgRepository = orgRepository ?? new OrganizationRepository();
  }

  async register(data: RegisterRequest): Promise<{ user: User; tokens: AuthTokens }> {
    // 既存ユーザーの確認
    const existing = await this.repository.findUserByEmail(data.email);
    if (existing) {
      throw new ConflictError('An account with this email already exists');
    }

    // パスワードハッシュ化
    const passwordHash = await bcryptjs.hash(data.password, BCRYPT_ROUNDS);

    // ユーザー作成
    const dbUser = await this.repository.createUser({
      email: data.email,
      passwordHash,
      name: data.name,
    });

    const user = this.toUser(dbUser);

    // Organization を作成し、ユーザーを owner として登録
    const slug = this.generateSlug(data.email);
    const org = await this.orgRepository.createOrganization({
      name: `${data.name}'s Organization`,
      slug,
    });
    await this.orgRepository.createMembership(org.id, dbUser.id, 'owner');

    const sessionId = nanoid();

    const tokens = await this.generateTokens({
      userId: user.id,
      organizationId: org.id,
      role: 'owner',
      sessionId,
    });

    // Refresh Token をRedisに保存
    await this.storeRefreshToken(user.id, sessionId, tokens.refreshToken);

    return { user, tokens };
  }

  async login(data: LoginRequest): Promise<{ user: User; tokens: AuthTokens }> {
    const dbUser = await this.repository.findUserByEmail(data.email);
    if (!dbUser) {
      // タイミング攻撃対策: ユーザーが存在しない場合もハッシュ比較を行う
      await bcryptjs.compare(data.password, '$2b$12$invalidhashforcomparison');
      throw new UnauthorizedError('Invalid email or password');
    }

    if (!dbUser.passwordHash) {
      throw new UnauthorizedError('This account uses social login. Please sign in with your OAuth provider.');
    }

    const isValidPassword = await bcryptjs.compare(data.password, dbUser.passwordHash);
    if (!isValidPassword) {
      throw new UnauthorizedError('Invalid email or password');
    }

    // 最終ログイン日時を更新
    await this.repository.updateLastLogin(dbUser.id);

    const user = this.toUser(dbUser);

    // DBから Organization を取得
    const org = await this.orgRepository.findOrganizationByUserId(dbUser.id);
    if (!org) {
      throw new UnauthorizedError('No organization found. Please contact support.');
    }

    const sessionId = nanoid();

    const tokens = await this.generateTokens({
      userId: user.id,
      organizationId: org.id,
      role: 'owner',
      sessionId,
    });

    // Refresh Token をRedisに保存
    await this.storeRefreshToken(user.id, sessionId, tokens.refreshToken);

    return { user, tokens };
  }

  async refresh(refreshToken: string): Promise<AuthTokens> {
    const jwtSecret = process.env['JWT_SECRET'];
    if (!jwtSecret) {
      throw new Error('JWT_SECRET environment variable is required');
    }

    let payload: JwtPayload;
    try {
      const secret = new TextEncoder().encode(jwtSecret);
      const { payload: jwtPayload } = await jwtVerify(refreshToken, secret);
      payload = jwtPayload as unknown as JwtPayload;
    } catch {
      throw new UnauthorizedError('Invalid or expired refresh token');
    }

    // Redisでリフレッシュトークンの有効性を確認
    const redisKey = `refresh:${payload.userId}:${payload.sessionId}`;
    const storedToken = await getRedis().get(redisKey);

    if (!storedToken || storedToken !== refreshToken) {
      throw new UnauthorizedError('Refresh token has been revoked');
    }

    // 新しいトークンペアを発行
    const newSessionId = nanoid();
    const newTokens = await this.generateTokens({
      userId: payload.userId,
      organizationId: payload.organizationId,
      role: payload.role,
      sessionId: newSessionId,
    });

    // 古いリフレッシュトークンを削除し、新しいものを保存（トークンローテーション）
    await getRedis().del(redisKey);
    await this.storeRefreshToken(payload.userId, newSessionId, newTokens.refreshToken);

    return newTokens;
  }

  async logout(userId: string, sessionId: string): Promise<void> {
    const redisKey = `refresh:${userId}:${sessionId}`;
    await getRedis().del(redisKey);
  }

  async generateTokens(payload: JwtPayload): Promise<AuthTokens> {
    const jwtSecret = process.env['JWT_SECRET'];
    if (!jwtSecret) {
      throw new Error('JWT_SECRET environment variable is required');
    }

    const secret = new TextEncoder().encode(jwtSecret);
    const now = Math.floor(Date.now() / 1000);

    const accessToken = await new SignJWT({
      userId: payload.userId,
      organizationId: payload.organizationId,
      role: payload.role,
      sessionId: payload.sessionId,
    })
      .setProtectedHeader({ alg: 'HS256' })
      .setIssuedAt(now)
      .setExpirationTime(now + ACCESS_TOKEN_EXPIRES_IN)
      .setSubject(payload.userId)
      .sign(secret);

    const refreshToken = await new SignJWT({
      userId: payload.userId,
      organizationId: payload.organizationId,
      role: payload.role,
      sessionId: payload.sessionId,
    })
      .setProtectedHeader({ alg: 'HS256' })
      .setIssuedAt(now)
      .setExpirationTime(now + REFRESH_TOKEN_EXPIRES_IN)
      .setSubject(payload.userId)
      .sign(secret);

    return {
      accessToken,
      refreshToken,
      expiresIn: ACCESS_TOKEN_EXPIRES_IN,
    };
  }

  async verifyAccessToken(token: string): Promise<JwtPayload> {
    const jwtSecret = process.env['JWT_SECRET'];
    if (!jwtSecret) {
      throw new Error('JWT_SECRET environment variable is required');
    }

    try {
      const secret = new TextEncoder().encode(jwtSecret);
      const { payload } = await jwtVerify(token, secret);
      return payload as unknown as JwtPayload;
    } catch {
      throw new UnauthorizedError('Invalid or expired access token');
    }
  }

  async getCurrentUser(userId: string): Promise<User | null> {
    const dbUser = await this.repository.findUserById(userId);
    if (!dbUser) return null;
    return this.toUser(dbUser);
  }

  async updateProfile(userId: string, data: { name?: string }): Promise<User> {
    const dbUser = await this.repository.updateUser(userId, data);
    return this.toUser(dbUser);
  }

  private generateSlug(email: string): string {
    const prefix = email.split('@')[0] ?? 'org';
    const cleaned = prefix
      .toLowerCase()
      .replace(/[^a-z0-9]/g, '-')
      .replace(/-+/g, '-')
      .slice(0, 60);
    const suffix = Math.random().toString(36).slice(2, 6);
    return `${cleaned}-${suffix}`;
  }

  private async storeRefreshToken(
    userId: string,
    sessionId: string,
    refreshToken: string,
  ): Promise<void> {
    const redisKey = `refresh:${userId}:${sessionId}`;
    await getRedis().setex(redisKey, REFRESH_TOKEN_EXPIRES_IN, refreshToken);
  }

  private toUser(dbUser: {
    id: string;
    email: string;
    name: string;
    avatarUrl: string | null;
    createdAt: Date;
    updatedAt: Date;
  }): User {
    return {
      id: dbUser.id,
      email: dbUser.email,
      name: dbUser.name,
      ...(dbUser.avatarUrl != null ? { avatarUrl: dbUser.avatarUrl } : {}),
      createdAt: dbUser.createdAt.toISOString(),
      updatedAt: dbUser.updatedAt.toISOString(),
    };
  }
}
