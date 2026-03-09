import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Hono } from 'hono';
import { AuthService } from '../auth.service.js';
import { ConflictError, UnauthorizedError } from '../../../lib/errors.js';
import type { AuthTokens, User } from '@faqai/types';

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

vi.mock('../auth.service.js');
vi.mock('../../../middleware/rate-limit.js', () => ({
  authRateLimiter: (_c: unknown, next: () => Promise<void>) => next(),
  apiRateLimiter: (_c: unknown, next: () => Promise<void>) => next(),
  publicRateLimiter: (_c: unknown, next: () => Promise<void>) => next(),
}));
vi.mock('../../../middleware/auth.js', () => ({
  authMiddleware: (
    c: { set: (key: string, value: unknown) => void },
    next: () => Promise<void>,
  ) => {
    c.set('user', {
      id: 'user-123',
      email: 'test@example.com',
      role: 'owner',
      sessionId: 'session-789',
    });
    c.set('organizationId', 'org-456');
    return next();
  },
}));

// ---------------------------------------------------------------------------
// Test helpers
// ---------------------------------------------------------------------------

const mockTokens: AuthTokens = {
  accessToken: 'mock.access.token',
  refreshToken: 'mock.refresh.token',
  expiresIn: 900,
};

const mockUser: User = {
  id: 'user-123',
  email: 'test@example.com',
  name: 'Test User',
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
};

async function createTestApp() {
  // テスト用アプリケーション（エラーハンドラー付き）
  const { authRoutes } = await import('../auth.routes.js');

  const app = new Hono();

  // エラーハンドラー
  // NOTE: vi.resetModules() causes dynamic imports to get fresh module instances,
  // so instanceof checks against statically imported error classes fail.
  // Use duck-typing to detect AppError instead.
  app.onError((err, c) => {
    const appErr = err as { statusCode?: number; code?: string; message?: string };
    if (typeof appErr.statusCode === 'number' && typeof appErr.code === 'string') {
      return c.json(
        { success: false, error: { code: appErr.code, message: appErr.message } },
        appErr.statusCode as Parameters<typeof c.json>[1],
      );
    }
    return c.json(
      { success: false, error: { code: 'INTERNAL_SERVER_ERROR', message: 'Internal server error' } },
      500,
    );
  });

  app.route('/', authRoutes);
  return app;
}

async function postJson(app: Hono, path: string, body: unknown) {
  return app.request(path, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

async function getJson(app: Hono, path: string) {
  return app.request(path, {
    method: 'GET',
    headers: { Authorization: 'Bearer mock.token' },
  });
}

// ---------------------------------------------------------------------------
// Route tests
// ---------------------------------------------------------------------------

describe('Auth Routes', () => {
  let mockAuthService: {
    register: ReturnType<typeof vi.fn>;
    login: ReturnType<typeof vi.fn>;
    refresh: ReturnType<typeof vi.fn>;
    logout: ReturnType<typeof vi.fn>;
    getCurrentUser: ReturnType<typeof vi.fn>;
  };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.resetModules();

    mockAuthService = {
      register: vi.fn(),
      login: vi.fn(),
      refresh: vi.fn(),
      logout: vi.fn(),
      getCurrentUser: vi.fn(),
    };

    vi.mocked(AuthService).mockImplementation(
      () => mockAuthService as unknown as AuthService,
    );
  });

  // -------------------------------------------------------------------------
  // POST /register
  // -------------------------------------------------------------------------

  describe('POST /register', () => {
    it('正常に登録できる（201レスポンス）', async () => {
      mockAuthService.register.mockResolvedValue({
        user: mockUser,
        tokens: mockTokens,
      });

      const app = await createTestApp();
      const res = await postJson(app, '/register', {
        email: 'new@example.com',
        password: 'securepassword123',
        name: 'New User',
      });

      expect(res.status).toBe(201);
      const body = await res.json() as { success: boolean; data?: { tokens: AuthTokens } };
      expect(body.success).toBe(true);
      expect(body.data?.tokens.accessToken).toBe('mock.access.token');
    });

    it('バリデーションエラー: 無効なメールアドレス', async () => {
      const app = await createTestApp();
      const res = await postJson(app, '/register', {
        email: 'not-an-email',
        password: 'password123',
        name: 'Test',
      });

      expect(res.status).toBe(400);
    });

    it('バリデーションエラー: パスワードが短すぎる', async () => {
      const app = await createTestApp();
      const res = await postJson(app, '/register', {
        email: 'test@example.com',
        password: 'short',
        name: 'Test',
      });

      expect(res.status).toBe(400);
    });

    it('重複メールアドレスの場合は409エラーを返す', async () => {
      mockAuthService.register.mockRejectedValue(
        new ConflictError('An account with this email already exists'),
      );

      const app = await createTestApp();
      const res = await postJson(app, '/register', {
        email: 'existing@example.com',
        password: 'password123',
        name: 'Test User',
      });

      expect(res.status).toBe(409);
      const body = await res.json() as { success: boolean; error?: { code: string } };
      expect(body.success).toBe(false);
      expect(body.error?.code).toBe('CONFLICT');
    });
  });

  // -------------------------------------------------------------------------
  // POST /login
  // -------------------------------------------------------------------------

  describe('POST /login', () => {
    it('正しい認証情報でログインできる（200レスポンス）', async () => {
      mockAuthService.login.mockResolvedValue({
        user: mockUser,
        tokens: mockTokens,
      });

      const app = await createTestApp();
      const res = await postJson(app, '/login', {
        email: 'test@example.com',
        password: 'correctpassword',
      });

      expect(res.status).toBe(200);
      const body = await res.json() as { success: boolean; data?: { user: User } };
      expect(body.success).toBe(true);
      expect(body.data?.user.email).toBe('test@example.com');
    });

    it('間違った認証情報の場合は401エラーを返す', async () => {
      mockAuthService.login.mockRejectedValue(
        new UnauthorizedError('Invalid email or password'),
      );

      const app = await createTestApp();
      const res = await postJson(app, '/login', {
        email: 'test@example.com',
        password: 'wrongpassword',
      });

      expect(res.status).toBe(401);
      const body = await res.json() as { success: boolean; error?: { code: string } };
      expect(body.success).toBe(false);
      expect(body.error?.code).toBe('UNAUTHORIZED');
    });

    it('バリデーションエラー: メールアドレスが無効', async () => {
      const app = await createTestApp();
      const res = await postJson(app, '/login', {
        email: 'invalid-email',
        password: 'password123',
      });

      expect(res.status).toBe(400);
    });
  });

  // -------------------------------------------------------------------------
  // POST /refresh
  // -------------------------------------------------------------------------

  describe('POST /refresh', () => {
    it('有効なリフレッシュトークンで新しいトークンを発行できる', async () => {
      mockAuthService.refresh.mockResolvedValue(mockTokens);

      const app = await createTestApp();
      const res = await postJson(app, '/refresh', {
        refreshToken: 'valid.refresh.token',
      });

      expect(res.status).toBe(200);
      const body = await res.json() as { success: boolean; data?: AuthTokens };
      expect(body.success).toBe(true);
      expect(body.data?.accessToken).toBe('mock.access.token');
    });

    it('無効なリフレッシュトークンの場合は401を返す', async () => {
      mockAuthService.refresh.mockRejectedValue(
        new UnauthorizedError('Invalid or expired refresh token'),
      );

      const app = await createTestApp();
      const res = await postJson(app, '/refresh', {
        refreshToken: 'invalid.refresh.token',
      });

      expect(res.status).toBe(401);
    });
  });

  // -------------------------------------------------------------------------
  // GET /me
  // -------------------------------------------------------------------------

  describe('GET /me', () => {
    it('認証済みユーザーの情報を取得できる', async () => {
      mockAuthService.getCurrentUser.mockResolvedValue(mockUser);

      const app = await createTestApp();
      const res = await getJson(app, '/me');

      expect(res.status).toBe(200);
      const body = await res.json() as {
        success: boolean;
        data?: { user: User; organizationId: string };
      };
      expect(body.success).toBe(true);
      expect(body.data?.user.id).toBe('user-123');
      expect(body.data?.organizationId).toBe('org-456');
    });

    it('ユーザーが存在しない場合は404を返す', async () => {
      mockAuthService.getCurrentUser.mockResolvedValue(null);

      const app = await createTestApp();
      const res = await getJson(app, '/me');

      expect(res.status).toBe(404);
    });
  });

  // -------------------------------------------------------------------------
  // POST /logout
  // -------------------------------------------------------------------------

  describe('POST /logout', () => {
    it('正常にログアウトできる', async () => {
      mockAuthService.logout.mockResolvedValue(undefined);

      const app = await createTestApp();
      const res = await postJson(app, '/logout', {});

      expect(res.status).toBe(200);
      const body = await res.json() as { success: boolean };
      expect(body.success).toBe(true);
    });
  });
});
