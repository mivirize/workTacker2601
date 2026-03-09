import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import { authMiddleware } from '../../middleware/auth.js';
import { TagRepository } from './tag.repository.js';
import type { ApiResponse } from '@faqai/types';

const tagRoutes = new Hono();
const tagRepo = new TagRepository();

// ---------------------------------------------------------------------------
// バリデーションスキーマ
// ---------------------------------------------------------------------------

const createTagSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100),
  color: z.string().regex(/^#[0-9a-fA-F]{6}$/, 'Invalid hex color').optional(),
});

const updateTagSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  color: z.string().regex(/^#[0-9a-fA-F]{6}$/, 'Invalid hex color').optional(),
});

const setFaqTagsSchema = z.object({
  tagIds: z.array(z.string().uuid()),
});

// ---------------------------------------------------------------------------
// GET /api/v1/tags  - タグ一覧
// ---------------------------------------------------------------------------

tagRoutes.get('/', authMiddleware, async (c) => {
  const orgId = c.get('organizationId');
  const tags = await tagRepo.findAll(orgId);

  const response: ApiResponse<{ tags: typeof tags }> = {
    success: true,
    data: { tags },
  };
  return c.json(response, 200);
});

// ---------------------------------------------------------------------------
// POST /api/v1/tags  - タグ作成
// ---------------------------------------------------------------------------

tagRoutes.post(
  '/',
  authMiddleware,
  zValidator('json', createTagSchema),
  async (c) => {
    const orgId = c.get('organizationId');
    const body = c.req.valid('json');

    const tag = await tagRepo.create({
      organizationId: orgId,
      name: body.name,
      ...(body.color !== undefined ? { color: body.color } : {}),
    });

    const response: ApiResponse<{ tag: typeof tag }> = {
      success: true,
      data: { tag },
    };
    return c.json(response, 201);
  },
);

// ---------------------------------------------------------------------------
// PATCH /api/v1/tags/:id  - タグ更新
// ---------------------------------------------------------------------------

tagRoutes.patch(
  '/:id',
  authMiddleware,
  zValidator('json', updateTagSchema),
  async (c) => {
    const orgId = c.get('organizationId');
    const { id } = c.req.param();
    const body = c.req.valid('json');

    const tag = await tagRepo.update(id, orgId, {
      ...(body.name !== undefined ? { name: body.name } : {}),
      ...(body.color !== undefined ? { color: body.color } : {}),
    });
    if (!tag) {
      const response: ApiResponse = {
        success: false,
        error: { code: 'NOT_FOUND', message: 'Tag not found' },
      };
      return c.json(response, 404);
    }

    const response: ApiResponse<{ tag: typeof tag }> = {
      success: true,
      data: { tag },
    };
    return c.json(response, 200);
  },
);

// ---------------------------------------------------------------------------
// DELETE /api/v1/tags/:id  - タグ削除
// ---------------------------------------------------------------------------

tagRoutes.delete('/:id', authMiddleware, async (c) => {
  const orgId = c.get('organizationId');
  const { id } = c.req.param();

  const deleted = await tagRepo.delete(id, orgId);
  if (!deleted) {
    const response: ApiResponse = {
      success: false,
      error: { code: 'NOT_FOUND', message: 'Tag not found' },
    };
    return c.json(response, 404);
  }

  const response: ApiResponse = {
    success: true,
    data: { message: 'Tag deleted successfully' },
  };
  return c.json(response, 200);
});

// ---------------------------------------------------------------------------
// GET /api/v1/faqs/:faqId/tags  - FAQ のタグ取得
// ---------------------------------------------------------------------------

tagRoutes.get('/faqs/:faqId/tags', authMiddleware, async (c) => {
  const { faqId } = c.req.param();
  const tags = await tagRepo.getTagsForFaq(faqId);

  const response: ApiResponse<{ tags: typeof tags }> = {
    success: true,
    data: { tags },
  };
  return c.json(response, 200);
});

// ---------------------------------------------------------------------------
// PUT /api/v1/faqs/:faqId/tags  - FAQ のタグを一括設定
// ---------------------------------------------------------------------------

tagRoutes.put(
  '/faqs/:faqId/tags',
  authMiddleware,
  zValidator('json', setFaqTagsSchema),
  async (c) => {
    const { faqId } = c.req.param();
    const { tagIds } = c.req.valid('json');

    await tagRepo.setTagsForFaq(faqId, tagIds);
    const tags = await tagRepo.getTagsForFaq(faqId);

    const response: ApiResponse<{ tags: typeof tags }> = {
      success: true,
      data: { tags },
    };
    return c.json(response, 200);
  },
);

export { tagRoutes };
