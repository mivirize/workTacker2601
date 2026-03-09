import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import { AuthService } from './auth.service.js';
import { authMiddleware } from '../../middleware/auth.js';
import { authRateLimiter } from '../../middleware/rate-limit.js';
import type { ApiResponse, AuthTokens, User } from '@faqai/types';

const authRoutes = new Hono();
const authService = new AuthService();

// ---------------------------------------------------------------------------
// バリデーションスキーマ
// ---------------------------------------------------------------------------

const registerSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .max(128, 'Password must not exceed 128 characters'),
  name: z
    .string()
    .min(1, 'Name is required')
    .max(255, 'Name must not exceed 255 characters'),
});

const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

const refreshSchema = z.object({
  refreshToken: z.string().min(1, 'Refresh token is required'),
});

// ---------------------------------------------------------------------------
// POST /register
// ---------------------------------------------------------------------------

authRoutes.post(
  '/register',
  authRateLimiter,
  zValidator('json', registerSchema),
  async (c) => {
    const body = c.req.valid('json');
    const { user, tokens } = await authService.register(body);

    const response: ApiResponse<{ user: User; tokens: AuthTokens }> = {
      success: true,
      data: { user, tokens },
    };

    return c.json(response, 201);
  },
);

// ---------------------------------------------------------------------------
// POST /login
// ---------------------------------------------------------------------------

authRoutes.post(
  '/login',
  authRateLimiter,
  zValidator('json', loginSchema),
  async (c) => {
    const body = c.req.valid('json');
    const { user, tokens } = await authService.login(body);

    const response: ApiResponse<{ user: User; tokens: AuthTokens }> = {
      success: true,
      data: { user, tokens },
    };

    return c.json(response, 200);
  },
);

// ---------------------------------------------------------------------------
// POST /refresh
// ---------------------------------------------------------------------------

authRoutes.post(
  '/refresh',
  zValidator('json', refreshSchema),
  async (c) => {
    const { refreshToken } = c.req.valid('json');
    const tokens = await authService.refresh(refreshToken);

    const response: ApiResponse<AuthTokens> = {
      success: true,
      data: tokens,
    };

    return c.json(response, 200);
  },
);

// ---------------------------------------------------------------------------
// POST /logout
// ---------------------------------------------------------------------------

authRoutes.post('/logout', authMiddleware, async (c) => {
  const user = c.get('user');

  await authService.logout(user.id, user.sessionId);

  const response: ApiResponse = {
    success: true,
    data: { message: 'Logged out successfully' },
  };

  return c.json(response, 200);
});

// ---------------------------------------------------------------------------
// PATCH /me
// ---------------------------------------------------------------------------

const updateProfileSchema = z.object({
  name: z
    .string()
    .min(1, 'Name is required')
    .max(255, 'Name must not exceed 255 characters')
    .optional(),
});

authRoutes.patch(
  '/me',
  authMiddleware,
  zValidator('json', updateProfileSchema),
  async (c) => {
    const contextUser = c.get('user');
    const body = c.req.valid('json');

    // exactOptionalPropertyTypes: undefined値を除外してProfileデータを構築
    const profileData: { name?: string } = {};
    if (body.name !== undefined) profileData.name = body.name;

    const updatedUser = await authService.updateProfile(contextUser.id, profileData);

    const response: ApiResponse<{ user: User }> = {
      success: true,
      data: { user: updatedUser },
    };

    return c.json(response, 200);
  },
);

// ---------------------------------------------------------------------------
// GET /me
// ---------------------------------------------------------------------------

authRoutes.get('/me', authMiddleware, async (c) => {
  const contextUser = c.get('user');

  const user = await authService.getCurrentUser(contextUser.id);
  if (!user) {
    return c.json(
      {
        success: false,
        error: { code: 'NOT_FOUND', message: 'User not found' },
      } satisfies ApiResponse,
      404,
    );
  }

  const response: ApiResponse<{ user: User; organizationId: string }> = {
    success: true,
    data: {
      user,
      organizationId: c.get('organizationId'),
    },
  };

  return c.json(response, 200);
});

export { authRoutes };
