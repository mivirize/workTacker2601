import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import { authMiddleware } from '../../middleware/auth.js';
import { SiteRepository } from './site.repository.js';
import { CrawlWorker } from './crawl.worker.js';
import { logger } from '../../lib/logger.js';
import type { ApiResponse } from '@faqai/types';

const siteRoutes = new Hono();
const siteRepo = new SiteRepository();
const crawlWorker = new CrawlWorker();

// ---------------------------------------------------------------------------
// バリデーションスキーマ
// ---------------------------------------------------------------------------

const createSiteSchema = z.object({
  name: z.string().min(1, 'Name is required').max(255),
  url: z.string().url('Invalid URL format'),
  crawlConfig: z
    .object({
      max_pages: z.number().int().min(1).max(100).optional(),
      max_depth: z.number().int().min(1).max(5).optional(),
      respect_robots_txt: z.boolean().optional(),
      rate_limit_ms: z.number().int().min(500).max(10000).optional(),
    })
    .optional(),
});

const updateSiteSchema = z.object({
  name: z.string().min(1).max(255).optional(),
  description: z.string().max(2000).nullable().optional(),
  notes: z.string().max(10000).nullable().optional(),
  aiContext: z.string().max(10000).nullable().optional(),
  logoUrl: z.string().url().max(1024).nullable().optional(),
  themeColor: z.string().regex(/^#[0-9a-fA-F]{6}$/).nullable().optional(),
  crawlConfig: z
    .object({
      max_pages: z.number().int().min(1).max(100).optional(),
      max_depth: z.number().int().min(1).max(5).optional(),
      respect_robots_txt: z.boolean().optional(),
      rate_limit_ms: z.number().int().min(500).max(10000).optional(),
    })
    .optional(),
  scheduleCron: z.string().nullable().optional(),
});

// ---------------------------------------------------------------------------
// GET /api/v1/sites  - サイト一覧
// ---------------------------------------------------------------------------

siteRoutes.get('/', authMiddleware, async (c) => {
  const orgId = c.get('organizationId');
  const sitesList = await siteRepo.findAll(orgId);

  const response: ApiResponse<{ sites: typeof sitesList }> = {
    success: true,
    data: { sites: sitesList },
  };
  return c.json(response, 200);
});

// ---------------------------------------------------------------------------
// POST /api/v1/sites  - サイト作成
// ---------------------------------------------------------------------------

siteRoutes.post(
  '/',
  authMiddleware,
  zValidator('json', createSiteSchema),
  async (c) => {
    const orgId = c.get('organizationId');
    const body = c.req.valid('json');

    let domain: string;
    try {
      domain = new URL(body.url).hostname;
    } catch {
      const response: ApiResponse = {
        success: false,
        error: { code: 'INVALID_URL', message: 'Invalid URL format' },
      };
      return c.json(response, 400);
    }

    const site = await siteRepo.create({
      organizationId: orgId,
      name: body.name,
      url: body.url,
      domain,
      ...(body.crawlConfig !== undefined ? { crawlConfig: body.crawlConfig } : {}),
    });

    const response: ApiResponse<{ site: typeof site }> = {
      success: true,
      data: { site },
    };
    return c.json(response, 201);
  },
);

// ---------------------------------------------------------------------------
// GET /api/v1/sites/:id  - サイト詳細
// ---------------------------------------------------------------------------

siteRoutes.get('/:id', authMiddleware, async (c) => {
  const orgId = c.get('organizationId');
  const { id } = c.req.param();

  const site = await siteRepo.findById(id, orgId);
  if (!site) {
    const response: ApiResponse = {
      success: false,
      error: { code: 'NOT_FOUND', message: 'Site not found' },
    };
    return c.json(response, 404);
  }

  const response: ApiResponse<{ site: typeof site }> = {
    success: true,
    data: { site },
  };
  return c.json(response, 200);
});

// ---------------------------------------------------------------------------
// PATCH /api/v1/sites/:id  - サイト更新
// ---------------------------------------------------------------------------

siteRoutes.patch(
  '/:id',
  authMiddleware,
  zValidator('json', updateSiteSchema),
  async (c) => {
    const orgId = c.get('organizationId');
    const { id } = c.req.param();
    const body = c.req.valid('json');

    const site = await siteRepo.update(id, orgId, {
      ...(body.name !== undefined ? { name: body.name } : {}),
      ...(body.description !== undefined ? { description: body.description } : {}),
      ...(body.notes !== undefined ? { notes: body.notes } : {}),
      ...(body.aiContext !== undefined ? { aiContext: body.aiContext } : {}),
      ...(body.logoUrl !== undefined ? { logoUrl: body.logoUrl } : {}),
      ...(body.themeColor !== undefined ? { themeColor: body.themeColor } : {}),
      ...(body.crawlConfig !== undefined ? { crawlConfig: body.crawlConfig } : {}),
      ...(body.scheduleCron !== undefined ? { scheduleCron: body.scheduleCron } : {}),
    });
    if (!site) {
      const response: ApiResponse = {
        success: false,
        error: { code: 'NOT_FOUND', message: 'Site not found' },
      };
      return c.json(response, 404);
    }

    const response: ApiResponse<{ site: typeof site }> = {
      success: true,
      data: { site },
    };
    return c.json(response, 200);
  },
);

// ---------------------------------------------------------------------------
// PATCH /api/v1/sites/:id/slug  - スラッグ更新
// ---------------------------------------------------------------------------

const updateSlugSchema = z.object({
  slug: z
    .string()
    .min(1, 'Slug is required')
    .max(255)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Slug must be lowercase alphanumeric with hyphens only'),
});

siteRoutes.patch(
  '/:id/slug',
  authMiddleware,
  zValidator('json', updateSlugSchema),
  async (c) => {
    const orgId = c.get('organizationId');
    const { id } = c.req.param();
    const { slug } = c.req.valid('json');

    try {
      const site = await siteRepo.updateSlug(id, orgId, slug);
      if (!site) {
        const response: ApiResponse = {
          success: false,
          error: { code: 'NOT_FOUND', message: 'Site not found' },
        };
        return c.json(response, 404);
      }

      const response: ApiResponse<{ site: typeof site }> = {
        success: true,
        data: { site },
      };
      return c.json(response, 200);
    } catch (err) {
      if (err instanceof Error && err.message === 'SLUG_CONFLICT') {
        const response: ApiResponse = {
          success: false,
          error: { code: 'SLUG_CONFLICT', message: 'このスラッグは既に使用されています' },
        };
        return c.json(response, 409);
      }
      throw err;
    }
  },
);

// ---------------------------------------------------------------------------
// DELETE /api/v1/sites/:id  - サイト削除
// ---------------------------------------------------------------------------

siteRoutes.delete('/:id', authMiddleware, async (c) => {
  const orgId = c.get('organizationId');
  const { id } = c.req.param();

  const deleted = await siteRepo.delete(id, orgId);
  if (!deleted) {
    const response: ApiResponse = {
      success: false,
      error: { code: 'NOT_FOUND', message: 'Site not found' },
    };
    return c.json(response, 404);
  }

  const response: ApiResponse = {
    success: true,
    data: { message: 'Site deleted successfully' },
  };
  return c.json(response, 200);
});

// ---------------------------------------------------------------------------
// GET /api/v1/sites/:id/crawl-jobs  - クロールジョブ一覧
// ---------------------------------------------------------------------------

siteRoutes.get('/:id/crawl-jobs', authMiddleware, async (c) => {
  const orgId = c.get('organizationId');
  const { id } = c.req.param();

  const site = await siteRepo.findById(id, orgId);
  if (!site) {
    const response: ApiResponse = {
      success: false,
      error: { code: 'NOT_FOUND', message: 'Site not found' },
    };
    return c.json(response, 404);
  }

  const jobs = await siteRepo.getCrawlJobs(id, orgId);

  const response: ApiResponse<{ jobs: typeof jobs }> = {
    success: true,
    data: { jobs },
  };
  return c.json(response, 200);
});

// ---------------------------------------------------------------------------
// POST /api/v1/sites/:id/crawl  - クロール開始
// ---------------------------------------------------------------------------

siteRoutes.post('/:id/crawl', authMiddleware, async (c) => {
  const orgId = c.get('organizationId');
  const { id } = c.req.param();

  const site = await siteRepo.findById(id, orgId);
  if (!site) {
    const response: ApiResponse = {
      success: false,
      error: { code: 'NOT_FOUND', message: 'Site not found' },
    };
    return c.json(response, 404);
  }

  // ジョブをDBに作成
  const crawlJob = await siteRepo.createCrawlJob(id, orgId, site.crawlConfig);
  if (!crawlJob) {
    return c.json(
      { success: false, error: { code: 'SERVER_ERROR', message: 'Failed to create crawl job' } } satisfies ApiResponse,
      500,
    );
  }

  // バックグラウンドで非同期実行
  const jobId = crawlJob.id;
  setImmediate(() => {
    crawlWorker.processCrawlJob(jobId, id, orgId).catch((err: unknown) => {
      logger.error({ err }, 'Crawl job failed unexpectedly');
    });
  });

  const response: ApiResponse<{ job: typeof crawlJob; message: string }> = {
    success: true,
    data: { job: crawlJob, message: 'Crawl job started' },
  };
  return c.json(response, 202);
});

export { siteRoutes };
