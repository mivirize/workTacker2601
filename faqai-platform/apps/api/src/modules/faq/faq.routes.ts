import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import { authMiddleware } from '../../middleware/auth.js';
import { FaqRepository } from './faq.repository.js';
import { SiteRepository } from '../sites/site.repository.js';
import type { ApiResponse } from '@faqai/types';

const faqRoutes = new Hono();
const faqRepo = new FaqRepository();

// ---------------------------------------------------------------------------
// バリデーションスキーマ
// ---------------------------------------------------------------------------

const updateFaqSchema = z.object({
  question: z.string().min(1).max(1000).optional(),
  answer: z.string().min(1).optional(),
  status: z.enum(['draft', 'published', 'archived']).optional(),
  categoryId: z.string().uuid().optional(),
});

const createFaqSchema = z.object({
  siteId: z.string().uuid(),
  categoryId: z.string().uuid().optional(),
  question: z.string().min(1).max(1000),
  answer: z.string().min(1),
  status: z.enum(['draft', 'published', 'archived']).optional(),
});

const listQuerySchema = z.object({
  siteId: z.string().uuid().optional(),
  status: z.enum(['draft', 'published', 'archived']).optional(),
  limit: z.coerce.number().int().min(1).max(100).optional(),
  offset: z.coerce.number().int().min(0).optional(),
});

// ---------------------------------------------------------------------------
// POST /api/v1/faqs  - FAQ作成
// ---------------------------------------------------------------------------

faqRoutes.post(
  '/',
  authMiddleware,
  zValidator('json', createFaqSchema),
  async (c) => {
    const orgId = c.get('organizationId');
    const body = c.req.valid('json');

    const siteRepo = new SiteRepository();
    const categoryId =
      body.categoryId ?? (await siteRepo.getDefaultCategoryId(body.siteId, orgId));
    if (!categoryId) {
      const response: ApiResponse = {
        success: false,
        error: { code: 'NOT_FOUND', message: 'Default category not found' },
      };
      return c.json(response, 404);
    }

    const faq = await faqRepo.create({
      organizationId: orgId,
      siteId: body.siteId,
      categoryId,
      question: body.question,
      answer: body.answer,
      status: body.status ?? 'draft',
      aiGenerated: true,
      generationModel: 'claude-code',
    });

    const response: ApiResponse<{ faq: typeof faq }> = {
      success: true,
      data: { faq },
    };
    return c.json(response, 201);
  },
);

// ---------------------------------------------------------------------------
// GET /api/v1/faqs  - FAQ一覧
// ---------------------------------------------------------------------------

faqRoutes.get(
  '/',
  authMiddleware,
  zValidator('query', listQuerySchema),
  async (c) => {
    const orgId = c.get('organizationId');
    const query = c.req.valid('query');

    const { items, total } = await faqRepo.findAll(orgId, {
      ...(query.siteId !== undefined ? { siteId: query.siteId } : {}),
      ...(query.status !== undefined ? { status: query.status } : {}),
      ...(query.limit !== undefined ? { limit: query.limit } : {}),
      ...(query.offset !== undefined ? { offset: query.offset } : {}),
    });

    const response: ApiResponse = {
      success: true,
      data: {
        items,
        total,
        limit: query.limit ?? 50,
        offset: query.offset ?? 0,
      },
    };
    return c.json(response, 200);
  },
);

// ---------------------------------------------------------------------------
// GET /api/v1/faqs/:id  - FAQ詳細
// ---------------------------------------------------------------------------

faqRoutes.get('/:id', authMiddleware, async (c) => {
  const orgId = c.get('organizationId');
  const { id } = c.req.param();

  const faq = await faqRepo.findById(id, orgId);
  if (!faq) {
    const response: ApiResponse = {
      success: false,
      error: { code: 'NOT_FOUND', message: 'FAQ not found' },
    };
    return c.json(response, 404);
  }

  const response: ApiResponse<{ faq: typeof faq }> = {
    success: true,
    data: { faq },
  };
  return c.json(response, 200);
});

// ---------------------------------------------------------------------------
// PATCH /api/v1/faqs/:id  - FAQ更新
// ---------------------------------------------------------------------------

faqRoutes.patch(
  '/:id',
  authMiddleware,
  zValidator('json', updateFaqSchema),
  async (c) => {
    const orgId = c.get('organizationId');
    const { id } = c.req.param();
    const body = c.req.valid('json');

    const faq = await faqRepo.update(id, orgId, {
      ...(body.question !== undefined ? { question: body.question } : {}),
      ...(body.answer !== undefined ? { answer: body.answer } : {}),
      ...(body.status !== undefined ? { status: body.status } : {}),
      ...(body.categoryId !== undefined ? { categoryId: body.categoryId } : {}),
    });
    if (!faq) {
      const response: ApiResponse = {
        success: false,
        error: { code: 'NOT_FOUND', message: 'FAQ not found' },
      };
      return c.json(response, 404);
    }

    const response: ApiResponse<{ faq: typeof faq }> = {
      success: true,
      data: { faq },
    };
    return c.json(response, 200);
  },
);

// ---------------------------------------------------------------------------
// DELETE /api/v1/faqs/:id  - FAQ削除
// ---------------------------------------------------------------------------

faqRoutes.delete('/:id', authMiddleware, async (c) => {
  const orgId = c.get('organizationId');
  const { id } = c.req.param();

  const deleted = await faqRepo.delete(id, orgId);
  if (!deleted) {
    const response: ApiResponse = {
      success: false,
      error: { code: 'NOT_FOUND', message: 'FAQ not found' },
    };
    return c.json(response, 404);
  }

  const response: ApiResponse = {
    success: true,
    data: { message: 'FAQ deleted successfully' },
  };
  return c.json(response, 200);
});

export { faqRoutes };
