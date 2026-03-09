import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { logger as honoLogger } from 'hono/logger';
import { AppError } from './lib/errors.js';
import { logger } from './lib/logger.js';
import { authRoutes } from './modules/auth/auth.routes.js';
import { organizationRoutes } from './modules/organizations/organization.routes.js';
import { siteRoutes } from './modules/sites/sites.routes.js';
import { faqRoutes } from './modules/faq/faq.routes.js';
import { tagRoutes } from './modules/faq/tag.routes.js';
import { chatbotRoutes } from './modules/chatbot/chatbot.routes.js';
import { publicRoutes } from './modules/public/public.routes.js';
import type { ApiResponse } from '@faqai/types';

const app = new Hono();

// ---------------------------------------------------------------------------
// CORS
// ---------------------------------------------------------------------------

const allowedOrigins = (process.env['ALLOWED_ORIGINS'] ?? 'http://localhost:3000')
  .split(',')
  .map((o) => o.trim());

// Public API: open CORS (before authenticated CORS)
app.use(
  '/api/v1/public/*',
  cors({
    origin: '*',
    allowHeaders: ['Content-Type'],
    allowMethods: ['GET', 'POST', 'OPTIONS'],
    maxAge: 86400,
  }),
);

app.use(
  '*',
  cors({
    origin: allowedOrigins,
    allowHeaders: ['Authorization', 'Content-Type', 'X-Request-ID'],
    allowMethods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    exposeHeaders: ['X-Request-ID', 'X-RateLimit-Limit', 'X-RateLimit-Remaining'],
    maxAge: 86400,
    credentials: true,
  }),
);

// ---------------------------------------------------------------------------
// Request logging middleware
// ---------------------------------------------------------------------------

app.use('*', honoLogger((msg) => {
  logger.info(msg);
}));

// ---------------------------------------------------------------------------
// Health check
// ---------------------------------------------------------------------------

app.get('/health', (c) => {
  return c.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
  });
});

// ---------------------------------------------------------------------------
// API v1 routes
// ---------------------------------------------------------------------------

const v1 = new Hono();

v1.route('/auth', authRoutes);
v1.route('/organizations', organizationRoutes);
v1.route('/sites', siteRoutes);
v1.route('/faqs', faqRoutes);
v1.route('/tags', tagRoutes);
v1.route('/chatbot', chatbotRoutes);
v1.route('/public', publicRoutes);

app.route('/api/v1', v1);

// ---------------------------------------------------------------------------
// Global error handler
// ---------------------------------------------------------------------------

app.onError((err, c) => {
  if (err instanceof AppError) {
    const response: ApiResponse = {
      success: false,
      error: {
        code: err.code,
        message: err.message,
        ...(process.env['NODE_ENV'] === 'development' && err.details
          ? { details: err.details }
          : {}),
      },
    };
    return c.json(response, err.statusCode as Parameters<typeof c.json>[1]);
  }

  // Zod validation errors from @hono/zod-validator
  if (err.name === 'ZodError') {
    const response: ApiResponse = {
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Request validation failed',
        details: { issues: (err as unknown as { issues: unknown }).issues },
      },
    };
    return c.json(response, 422);
  }

  // Unexpected errors - don't leak internal details in production
  logger.error({ err, path: c.req.path, method: c.req.method }, 'Unhandled error');

  const response: ApiResponse = {
    success: false,
    error: {
      code: 'INTERNAL_SERVER_ERROR',
      message:
        process.env['NODE_ENV'] === 'development'
          ? (err instanceof Error ? err.message : String(err))
          : 'An unexpected error occurred',
    },
  };
  return c.json(response, 500);
});

// ---------------------------------------------------------------------------
// 404 handler
// ---------------------------------------------------------------------------

app.notFound((c) => {
  const response: ApiResponse = {
    success: false,
    error: {
      code: 'NOT_FOUND',
      message: `Route ${c.req.method} ${c.req.path} not found`,
    },
  };
  return c.json(response, 404);
});

export { app };
