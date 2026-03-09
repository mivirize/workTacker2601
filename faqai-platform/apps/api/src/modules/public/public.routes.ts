import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import { publicRateLimiter } from '../../middleware/rate-limit.js';
import { PublicRepository } from './public.repository.js';
import { getScreenshotUrl } from '../../lib/s3-client.js';
import { ChatService } from '../../lib/chat-service.js';
import { logger } from '../../lib/logger.js';
import type { ApiResponse } from '@faqai/types';
import type { AiConfig } from '@faqai/db';

const publicRoutes = new Hono();
const publicRepo = new PublicRepository();

// Rate limiting for all public endpoints
publicRoutes.use('*', publicRateLimiter);

// ---------------------------------------------------------------------------
// GET /api/v1/public/sites/:slug - サイト情報取得（slug）
// ---------------------------------------------------------------------------

publicRoutes.get('/sites/by-domain/:domain', async (c) => {
  const { domain } = c.req.param();

  const site = await publicRepo.findSiteByDomain(domain);
  if (!site) {
    const response: ApiResponse = {
      success: false,
      error: { code: 'NOT_FOUND', message: 'Site not found for this domain' },
    };
    return c.json(response, 404);
  }

  const response: ApiResponse = {
    success: true,
    data: {
      siteId: site.id,
      siteName: site.name,
      slug: site.slug,
      domain: site.domain,
    },
  };
  return c.json(response, 200);
});

// ---------------------------------------------------------------------------
// GET /api/v1/public/sites/:slug - サイト情報取得
// ---------------------------------------------------------------------------

publicRoutes.get('/sites/:slug', async (c) => {
  const { slug } = c.req.param();

  const site = await publicRepo.findSiteBySlug(slug);
  if (!site) {
    const response: ApiResponse = {
      success: false,
      error: { code: 'NOT_FOUND', message: 'Site not found' },
    };
    return c.json(response, 404);
  }

  const response: ApiResponse = {
    success: true,
    data: {
      siteId: site.id,
      siteName: site.name,
      domain: site.domain,
      logoUrl: site.logoUrl,
      themeColor: site.themeColor,
    },
  };
  return c.json(response, 200);
});

// ---------------------------------------------------------------------------
// GET /api/v1/public/sites/:siteId/faqs - 公開FAQ一覧
// ---------------------------------------------------------------------------

const faqQuerySchema = z.object({
  q: z.string().optional(),
  category: z.string().optional(),
  limit: z.coerce.number().int().min(1).max(100).optional(),
  offset: z.coerce.number().int().min(0).optional(),
});

publicRoutes.get(
  '/sites/:siteId/faqs',
  zValidator('query', faqQuerySchema),
  async (c) => {
    const { siteId } = c.req.param();
    const query = c.req.valid('query');

    const result = await publicRepo.findPublishedFaqs(siteId, {
      ...(query.q !== undefined ? { q: query.q } : {}),
      ...(query.category !== undefined ? { categorySlug: query.category } : {}),
      ...(query.limit !== undefined ? { limit: query.limit } : {}),
      ...(query.offset !== undefined ? { offset: query.offset } : {}),
    });

    const response: ApiResponse = {
      success: true,
      data: {
        items: result.items,
        total: result.total,
        categories: result.categories,
        limit: query.limit ?? 100,
        offset: query.offset ?? 0,
      },
    };
    return c.json(response, 200);
  },
);

// ---------------------------------------------------------------------------
// GET /api/v1/public/sites/:siteId/chatbot - サイトのアクティブなチャットボット取得
// ---------------------------------------------------------------------------

publicRoutes.get('/sites/:siteId/chatbot', async (c) => {
  const { siteId } = c.req.param();

  const chatbot = await publicRepo.findActiveChatbotBySite(siteId);
  if (!chatbot) {
    const response: ApiResponse = {
      success: false,
      error: { code: 'NOT_FOUND', message: 'No active chatbot found' },
    };
    return c.json(response, 404);
  }

  const response: ApiResponse = {
    success: true,
    data: {
      chatbotId: chatbot.id,
      name: chatbot.name,
      type: chatbot.type,
      widgetConfig: chatbot.widgetConfig,
    },
  };
  return c.json(response, 200);
});

// ---------------------------------------------------------------------------
// GET /api/v1/public/screenshots/:id - スクリーンショット画像リダイレクト
// ---------------------------------------------------------------------------

publicRoutes.get('/screenshots/:id', async (c) => {
  const { id } = c.req.param();

  const screenshot = await publicRepo.findScreenshotById(id);
  if (!screenshot) {
    const response: ApiResponse = {
      success: false,
      error: { code: 'NOT_FOUND', message: 'Screenshot not found' },
    };
    return c.json(response, 404);
  }

  try {
    const presignedUrl = await getScreenshotUrl(screenshot.storagePath);
    return c.redirect(presignedUrl, 302);
  } catch (error) {
    logger.error({ err: error, screenshotId: id }, 'Failed to generate screenshot URL');
    const response: ApiResponse = {
      success: false,
      error: { code: 'INTERNAL_ERROR', message: 'Failed to generate screenshot URL' },
    };
    return c.json(response, 500);
  }
});

// ---------------------------------------------------------------------------
// POST /api/v1/public/chatbots/:chatbotId/chat - ウィジェットチャット
// ---------------------------------------------------------------------------

const chatMessageSchema = z.object({
  message: z.string().min(1).max(2000),
  sessionId: z.string().min(1).max(128),
});

const chatService = new ChatService();

publicRoutes.post(
  '/chatbots/:chatbotId/chat',
  zValidator('json', chatMessageSchema),
  async (c) => {
    const { chatbotId } = c.req.param();
    const { message, sessionId } = c.req.valid('json');

    // 1. Find active chatbot
    const chatbot = await chatService.findActiveChatbot(chatbotId);
    if (!chatbot) {
      const response: ApiResponse = {
        success: false,
        error: { code: 'NOT_FOUND', message: 'Chatbot not found or inactive' },
      };
      return c.json(response, 404);
    }

    try {
      // 2. Get or create chat session
      const session = await chatService.findOrCreateSession(
        chatbotId,
        sessionId,
        chatbot.organizationId,
      );

      // 3. Save user message
      await chatService.saveMessage({
        sessionId: session.id,
        organizationId: chatbot.organizationId,
        role: 'user',
        content: message,
      });

      // 4. Get recent message history for context
      const aiConfig = chatbot.aiConfig as AiConfig;
      const messageHistory = await chatService.getMessageHistory(
        session.id,
        aiConfig.max_context_messages,
      );

      // 5. Process message: scenario or AI
      let botMessage: string;
      let choices: string[] | undefined;
      let isEnd: boolean | undefined;

      if (chatbot.type === 'scenario' || chatbot.type === 'hybrid') {
        const step = await chatService.processScenarioStep(chatbotId, session.id, message);
        if (step) {
          botMessage = step.message;
          choices = step.choices.length > 0 ? step.choices : undefined;
          isEnd = step.isEnd;
        } else {
          // No scenario configured or no start node — fall back to AI
          const result = await chatService.processMessage({
            chatbotId, sessionId: session.id, userMessage: message, chatbot, messageHistory,
          });
          botMessage = result.message;
        }
      } else {
        const result = await chatService.processMessage({
          chatbotId, sessionId: session.id, userMessage: message, chatbot, messageHistory,
        });
        botMessage = result.message;
      }

      // 6. Save bot response
      await chatService.saveMessage({
        sessionId: session.id,
        organizationId: chatbot.organizationId,
        role: 'bot',
        content: botMessage,
      });

      // 7. Return response
      const response: ApiResponse = {
        success: true,
        data: { message: botMessage, choices, isEnd },
      };
      return c.json(response, 200);
    } catch (err) {
      logger.error(
        { err: String(err), chatbotId, sessionId },
        'Chat processing failed',
      );
      const response: ApiResponse = {
        success: false,
        error: { code: 'INTERNAL_ERROR', message: 'Failed to process chat message' },
      };
      return c.json(response, 500);
    }
  },
);

export { publicRoutes };
