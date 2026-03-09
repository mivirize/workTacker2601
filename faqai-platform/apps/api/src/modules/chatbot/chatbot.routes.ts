import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import { authMiddleware } from '../../middleware/auth.js';
import { ChatbotRepository } from './chatbot.repository.js';
import { ChatService } from '../../lib/chat-service.js';
import { generateFaqScenario } from '../../lib/faq-scenario-generator.js';
import { getDb, chatbots, eq } from '@faqai/db';
import type { ApiResponse } from '@faqai/types';
import type {
  CreateScenarioInput,
  UpdateScenarioInput,
  CreateNodeInput,
  UpdateNodeInput,
  CreateEdgeInput,
} from './chatbot.repository.js';

const chatbotRoutes = new Hono();
const chatbotRepo = new ChatbotRepository();
const chatService = new ChatService();

// ---------------------------------------------------------------------------
// バリデーションスキーマ
// ---------------------------------------------------------------------------

const createChatbotSchema = z.object({
  siteId: z.string().uuid(),
  name: z.string().min(1, 'Name is required').max(255),
  type: z.enum(['scenario', 'ai', 'hybrid']).optional(),
  isActive: z.boolean().optional(),
  widgetConfig: z
    .object({
      position: z.enum(['bottom-right', 'bottom-left']).optional(),
      primary_color: z.string().max(20).optional(),
      greeting_message: z.string().max(500).optional(),
      placeholder_text: z.string().max(200).optional(),
      avatar_url: z.string().url().nullable().optional(),
      icon_type: z.string().max(50).optional(),
      show_branding: z.boolean().optional(),
      auto_open_delay_ms: z.number().int().min(0).nullable().optional(),
      mobile_full_screen: z.boolean().optional(),
    })
    .optional(),
  aiConfig: z
    .object({
      provider: z.string().max(50).optional(),
      model: z.string().max(100).optional(),
      temperature: z.number().min(0).max(2).optional(),
      max_tokens: z.number().int().min(1).max(16384).optional(),
      system_prompt: z.string().max(10000).nullable().optional(),
      confidence_threshold: z.number().min(0).max(1).optional(),
      fallback_message: z.string().max(1000).optional(),
      max_context_messages: z.number().int().min(1).max(50).optional(),
    })
    .optional(),
  triggerConfig: z
    .object({
      pages: z.array(z.string()).optional(),
      scroll_percent: z.number().int().min(0).max(100).nullable().optional(),
      delay_seconds: z.number().int().min(0).nullable().optional(),
      exit_intent: z.boolean().optional(),
    })
    .optional(),
  allowedDomains: z.array(z.string().max(255)).optional(),
});

const updateChatbotSchema = z.object({
  name: z.string().min(1).max(255).optional(),
  type: z.enum(['scenario', 'ai', 'hybrid']).optional(),
  isActive: z.boolean().optional(),
  widgetConfig: z
    .object({
      position: z.enum(['bottom-right', 'bottom-left']).optional(),
      primary_color: z.string().max(20).optional(),
      greeting_message: z.string().max(500).optional(),
      placeholder_text: z.string().max(200).optional(),
      avatar_url: z.string().url().nullable().optional(),
      icon_type: z.string().max(50).optional(),
      show_branding: z.boolean().optional(),
      auto_open_delay_ms: z.number().int().min(0).nullable().optional(),
      mobile_full_screen: z.boolean().optional(),
    })
    .optional(),
  aiConfig: z
    .object({
      provider: z.string().max(50).optional(),
      model: z.string().max(100).optional(),
      temperature: z.number().min(0).max(2).optional(),
      max_tokens: z.number().int().min(1).max(16384).optional(),
      system_prompt: z.string().max(10000).nullable().optional(),
      confidence_threshold: z.number().min(0).max(1).optional(),
      fallback_message: z.string().max(1000).optional(),
      max_context_messages: z.number().int().min(1).max(50).optional(),
    })
    .optional(),
  triggerConfig: z
    .object({
      pages: z.array(z.string()).optional(),
      scroll_percent: z.number().int().min(0).max(100).nullable().optional(),
      delay_seconds: z.number().int().min(0).nullable().optional(),
      exit_intent: z.boolean().optional(),
    })
    .optional(),
  allowedDomains: z.array(z.string().max(255)).optional(),
});

const createScenarioSchema = z.object({
  name: z.string().min(1, 'Name is required').max(255),
  description: z.string().optional(),
  triggerKeywords: z.array(z.string()).optional(),
  sortOrder: z.number().int().optional(),
});

const updateScenarioSchema = z.object({
  name: z.string().min(1).max(255).optional(),
  description: z.string().optional(),
  isActive: z.boolean().optional(),
  triggerKeywords: z.array(z.string()).optional(),
  sortOrder: z.number().int().optional(),
});

const createNodeSchema = z.object({
  nodeType: z.string().min(1).max(50),
  content: z
    .object({
      text: z.string().optional(),
      choices: z
        .array(
          z.object({
            label: z.string(),
            value: z.string(),
          }),
        )
        .optional(),
    })
    .passthrough()
    .optional(),
  positionX: z.number().optional(),
  positionY: z.number().optional(),
  isStart: z.boolean().optional(),
  isEnd: z.boolean().optional(),
});

const updateNodeSchema = z.object({
  nodeType: z.string().min(1).max(50).optional(),
  content: z
    .object({
      text: z.string().optional(),
      choices: z
        .array(
          z.object({
            label: z.string(),
            value: z.string(),
          }),
        )
        .optional(),
    })
    .passthrough()
    .optional(),
  positionX: z.number().optional(),
  positionY: z.number().optional(),
  isStart: z.boolean().optional(),
  isEnd: z.boolean().optional(),
});

const createEdgeSchema = z.object({
  fromNodeId: z.string().uuid(),
  toNodeId: z.string().uuid(),
  condition: z.record(z.unknown()).optional(),
  label: z.string().max(255).optional(),
  sortOrder: z.number().int().optional(),
});

// ---------------------------------------------------------------------------
// GET /api/v1/chatbot  - チャットボット一覧 (?siteId=xxx でフィルタ可)
// ---------------------------------------------------------------------------

chatbotRoutes.get('/', authMiddleware, async (c) => {
  const orgId = c.get('organizationId');
  const siteId = c.req.query('siteId');

  const chatbotsList = siteId
    ? await chatbotRepo.findBySiteId(siteId, orgId)
    : await chatbotRepo.findAll(orgId);

  const response: ApiResponse<{ chatbots: typeof chatbotsList }> = {
    success: true,
    data: { chatbots: chatbotsList },
  };
  return c.json(response, 200);
});

// ---------------------------------------------------------------------------
// POST /api/v1/chatbot  - チャットボット作成
// ---------------------------------------------------------------------------

chatbotRoutes.post(
  '/',
  authMiddleware,
  zValidator('json', createChatbotSchema),
  async (c) => {
    const orgId = c.get('organizationId');
    const body = c.req.valid('json');

    const chatbot = await chatbotRepo.create({
      organizationId: orgId,
      siteId: body.siteId,
      name: body.name,
      ...(body.type !== undefined ? { type: body.type } : {}),
      ...(body.isActive !== undefined ? { isActive: body.isActive } : {}),
      ...(body.widgetConfig !== undefined
        ? { widgetConfig: body.widgetConfig }
        : {}),
      ...(body.aiConfig !== undefined ? { aiConfig: body.aiConfig } : {}),
      ...(body.triggerConfig !== undefined
        ? { triggerConfig: body.triggerConfig }
        : {}),
      ...(body.allowedDomains !== undefined
        ? { allowedDomains: body.allowedDomains }
        : {}),
    });

    const response: ApiResponse<{ chatbot: typeof chatbot }> = {
      success: true,
      data: { chatbot },
    };
    return c.json(response, 201);
  },
);

// ---------------------------------------------------------------------------
// GET /api/v1/chatbot/:id  - チャットボット詳細
// ---------------------------------------------------------------------------

chatbotRoutes.get('/:id', authMiddleware, async (c) => {
  const orgId = c.get('organizationId');
  const { id } = c.req.param();

  const chatbot = await chatbotRepo.findById(id, orgId);
  if (!chatbot) {
    const response: ApiResponse = {
      success: false,
      error: { code: 'NOT_FOUND', message: 'Chatbot not found' },
    };
    return c.json(response, 404);
  }

  const response: ApiResponse<{ chatbot: typeof chatbot }> = {
    success: true,
    data: { chatbot },
  };
  return c.json(response, 200);
});

// ---------------------------------------------------------------------------
// PUT /api/v1/chatbot/:id  - チャットボット更新
// ---------------------------------------------------------------------------

chatbotRoutes.put(
  '/:id',
  authMiddleware,
  zValidator('json', updateChatbotSchema),
  async (c) => {
    const orgId = c.get('organizationId');
    const { id } = c.req.param();
    const body = c.req.valid('json');

    const chatbot = await chatbotRepo.update(id, orgId, {
      ...(body.name !== undefined ? { name: body.name } : {}),
      ...(body.type !== undefined ? { type: body.type } : {}),
      ...(body.isActive !== undefined ? { isActive: body.isActive } : {}),
      ...(body.widgetConfig !== undefined
        ? { widgetConfig: body.widgetConfig }
        : {}),
      ...(body.aiConfig !== undefined ? { aiConfig: body.aiConfig } : {}),
      ...(body.triggerConfig !== undefined
        ? { triggerConfig: body.triggerConfig }
        : {}),
      ...(body.allowedDomains !== undefined
        ? { allowedDomains: body.allowedDomains }
        : {}),
    });
    if (!chatbot) {
      const response: ApiResponse = {
        success: false,
        error: { code: 'NOT_FOUND', message: 'Chatbot not found' },
      };
      return c.json(response, 404);
    }

    const response: ApiResponse<{ chatbot: typeof chatbot }> = {
      success: true,
      data: { chatbot },
    };
    return c.json(response, 200);
  },
);

// ---------------------------------------------------------------------------
// DELETE /api/v1/chatbot/:id  - チャットボット削除
// ---------------------------------------------------------------------------

chatbotRoutes.delete('/:id', authMiddleware, async (c) => {
  const orgId = c.get('organizationId');
  const { id } = c.req.param();

  const deleted = await chatbotRepo.delete(id, orgId);
  if (!deleted) {
    const response: ApiResponse = {
      success: false,
      error: { code: 'NOT_FOUND', message: 'Chatbot not found' },
    };
    return c.json(response, 404);
  }

  const response: ApiResponse = {
    success: true,
    data: { message: 'Chatbot deleted successfully' },
  };
  return c.json(response, 200);
});

// ---------------------------------------------------------------------------
// GET /api/v1/chatbot/:id/sessions  - セッション一覧
// ---------------------------------------------------------------------------

chatbotRoutes.get('/:id/sessions', authMiddleware, async (c) => {
  const orgId = c.get('organizationId');
  const { id } = c.req.param();

  const chatbot = await chatbotRepo.findById(id, orgId);
  if (!chatbot) {
    const response: ApiResponse = {
      success: false,
      error: { code: 'NOT_FOUND', message: 'Chatbot not found' },
    };
    return c.json(response, 404);
  }

  const sessions = await chatbotRepo.findSessionsByChatbot(id, orgId);

  const response: ApiResponse<{ sessions: typeof sessions }> = {
    success: true,
    data: { sessions },
  };
  return c.json(response, 200);
});

// ---------------------------------------------------------------------------
// GET /api/v1/chatbot/sessions/:sessionId  - セッション詳細（メッセージ付き）
// ---------------------------------------------------------------------------

chatbotRoutes.get('/sessions/:sessionId', authMiddleware, async (c) => {
  const orgId = c.get('organizationId');
  const { sessionId } = c.req.param();

  const session = await chatbotRepo.findSession(sessionId);
  if (!session || session.organizationId !== orgId) {
    const response: ApiResponse = {
      success: false,
      error: { code: 'NOT_FOUND', message: 'Session not found' },
    };
    return c.json(response, 404);
  }

  const messages = await chatbotRepo.findMessagesBySession(sessionId);

  const response: ApiResponse<{
    session: typeof session;
    messages: typeof messages;
  }> = {
    success: true,
    data: { session, messages },
  };
  return c.json(response, 200);
});

// ---------------------------------------------------------------------------
// GET /api/v1/chatbot/scenarios/:sid  - シナリオ詳細（ノード・エッジ付き）
// PUT /api/v1/chatbot/scenarios/:sid  - シナリオ更新
// DELETE /api/v1/chatbot/scenarios/:sid  - シナリオ削除
// NOTE: /scenarios/:sid は /:id の前に登録することで競合を防ぐ
// ---------------------------------------------------------------------------

chatbotRoutes.get('/scenarios/:sid', authMiddleware, async (c) => {
  const orgId = c.get('organizationId');
  const { sid } = c.req.param();

  const scenario = await chatbotRepo.findScenarioById(sid, orgId);
  if (!scenario) {
    const response: ApiResponse = {
      success: false,
      error: { code: 'NOT_FOUND', message: 'Scenario not found' },
    };
    return c.json(response, 404);
  }

  const [nodes, edges] = await Promise.all([
    chatbotRepo.findNodesByScenario(sid),
    chatbotRepo.findEdgesByScenario(sid),
  ]);

  const response: ApiResponse<{
    scenario: typeof scenario;
    nodes: typeof nodes;
    edges: typeof edges;
  }> = {
    success: true,
    data: { scenario, nodes, edges },
  };
  return c.json(response, 200);
});

chatbotRoutes.put(
  '/scenarios/:sid',
  authMiddleware,
  zValidator('json', updateScenarioSchema),
  async (c) => {
    const orgId = c.get('organizationId');
    const { sid } = c.req.param();
    const body = c.req.valid('json');

    const input: UpdateScenarioInput = {};
    if (body.name !== undefined) input.name = body.name;
    if (body.description !== undefined) input.description = body.description;
    if (body.isActive !== undefined) input.isActive = body.isActive;
    if (body.triggerKeywords !== undefined)
      input.triggerKeywords = body.triggerKeywords;
    if (body.sortOrder !== undefined) input.sortOrder = body.sortOrder;

    const scenario = await chatbotRepo.updateScenario(sid, orgId, input);
    if (!scenario) {
      const response: ApiResponse = {
        success: false,
        error: { code: 'NOT_FOUND', message: 'Scenario not found' },
      };
      return c.json(response, 404);
    }

    const response: ApiResponse<{ scenario: typeof scenario }> = {
      success: true,
      data: { scenario },
    };
    return c.json(response, 200);
  },
);

chatbotRoutes.delete('/scenarios/:sid', authMiddleware, async (c) => {
  const orgId = c.get('organizationId');
  const { sid } = c.req.param();

  const deleted = await chatbotRepo.deleteScenario(sid, orgId);
  if (!deleted) {
    const response: ApiResponse = {
      success: false,
      error: { code: 'NOT_FOUND', message: 'Scenario not found' },
    };
    return c.json(response, 404);
  }

  const response: ApiResponse = {
    success: true,
    data: { message: 'Scenario deleted successfully' },
  };
  return c.json(response, 200);
});

// ---------------------------------------------------------------------------
// POST /api/v1/chatbot/scenarios/:sid/nodes  - ノード作成
// PUT  /api/v1/chatbot/scenarios/:sid/nodes/:nid  - ノード更新
// DELETE /api/v1/chatbot/scenarios/:sid/nodes/:nid  - ノード削除
// ---------------------------------------------------------------------------

chatbotRoutes.post(
  '/scenarios/:sid/nodes',
  authMiddleware,
  zValidator('json', createNodeSchema),
  async (c) => {
    const orgId = c.get('organizationId');
    const { sid } = c.req.param();
    const body = c.req.valid('json');

    const scenario = await chatbotRepo.findScenarioById(sid, orgId);
    if (!scenario) {
      const response: ApiResponse = {
        success: false,
        error: { code: 'NOT_FOUND', message: 'Scenario not found' },
      };
      return c.json(response, 404);
    }

    const input: CreateNodeInput = {
      scenarioId: sid,
      organizationId: orgId,
      nodeType: body.nodeType,
      ...(body.content !== undefined ? { content: body.content } : {}),
      ...(body.positionX !== undefined ? { positionX: body.positionX } : {}),
      ...(body.positionY !== undefined ? { positionY: body.positionY } : {}),
      ...(body.isStart !== undefined ? { isStart: body.isStart } : {}),
      ...(body.isEnd !== undefined ? { isEnd: body.isEnd } : {}),
    };

    const node = await chatbotRepo.createNode(input);

    const response: ApiResponse<{ node: typeof node }> = {
      success: true,
      data: { node },
    };
    return c.json(response, 201);
  },
);

chatbotRoutes.put(
  '/scenarios/:sid/nodes/:nid',
  authMiddleware,
  zValidator('json', updateNodeSchema),
  async (c) => {
    const orgId = c.get('organizationId');
    const { sid, nid } = c.req.param();
    const body = c.req.valid('json');

    const scenario = await chatbotRepo.findScenarioById(sid, orgId);
    if (!scenario) {
      const response: ApiResponse = {
        success: false,
        error: { code: 'NOT_FOUND', message: 'Scenario not found' },
      };
      return c.json(response, 404);
    }

    const input: UpdateNodeInput = {};
    if (body.nodeType !== undefined) input.nodeType = body.nodeType;
    if (body.content !== undefined) input.content = body.content;
    if (body.positionX !== undefined) input.positionX = body.positionX;
    if (body.positionY !== undefined) input.positionY = body.positionY;
    if (body.isStart !== undefined) input.isStart = body.isStart;
    if (body.isEnd !== undefined) input.isEnd = body.isEnd;

    const node = await chatbotRepo.updateNode(nid, input);
    if (!node) {
      const response: ApiResponse = {
        success: false,
        error: { code: 'NOT_FOUND', message: 'Node not found' },
      };
      return c.json(response, 404);
    }

    const response: ApiResponse<{ node: typeof node }> = {
      success: true,
      data: { node },
    };
    return c.json(response, 200);
  },
);

chatbotRoutes.delete(
  '/scenarios/:sid/nodes/:nid',
  authMiddleware,
  async (c) => {
    const orgId = c.get('organizationId');
    const { sid, nid } = c.req.param();

    const scenario = await chatbotRepo.findScenarioById(sid, orgId);
    if (!scenario) {
      const response: ApiResponse = {
        success: false,
        error: { code: 'NOT_FOUND', message: 'Scenario not found' },
      };
      return c.json(response, 404);
    }

    const deleted = await chatbotRepo.deleteNode(nid);
    if (!deleted) {
      const response: ApiResponse = {
        success: false,
        error: { code: 'NOT_FOUND', message: 'Node not found' },
      };
      return c.json(response, 404);
    }

    const response: ApiResponse = {
      success: true,
      data: { message: 'Node deleted successfully' },
    };
    return c.json(response, 200);
  },
);

// ---------------------------------------------------------------------------
// POST /api/v1/chatbot/scenarios/:sid/edges  - エッジ作成
// DELETE /api/v1/chatbot/scenarios/:sid/edges/:eid  - エッジ削除
// ---------------------------------------------------------------------------

chatbotRoutes.post(
  '/scenarios/:sid/edges',
  authMiddleware,
  zValidator('json', createEdgeSchema),
  async (c) => {
    const orgId = c.get('organizationId');
    const { sid } = c.req.param();
    const body = c.req.valid('json');

    const scenario = await chatbotRepo.findScenarioById(sid, orgId);
    if (!scenario) {
      const response: ApiResponse = {
        success: false,
        error: { code: 'NOT_FOUND', message: 'Scenario not found' },
      };
      return c.json(response, 404);
    }

    const input: CreateEdgeInput = {
      scenarioId: sid,
      fromNodeId: body.fromNodeId,
      toNodeId: body.toNodeId,
      ...(body.condition !== undefined ? { condition: body.condition } : {}),
      ...(body.label !== undefined ? { label: body.label } : {}),
      ...(body.sortOrder !== undefined ? { sortOrder: body.sortOrder } : {}),
    };

    const edge = await chatbotRepo.createEdge(input);

    const response: ApiResponse<{ edge: typeof edge }> = {
      success: true,
      data: { edge },
    };
    return c.json(response, 201);
  },
);

chatbotRoutes.delete(
  '/scenarios/:sid/edges/:eid',
  authMiddleware,
  async (c) => {
    const orgId = c.get('organizationId');
    const { sid, eid } = c.req.param();

    const scenario = await chatbotRepo.findScenarioById(sid, orgId);
    if (!scenario) {
      const response: ApiResponse = {
        success: false,
        error: { code: 'NOT_FOUND', message: 'Scenario not found' },
      };
      return c.json(response, 404);
    }

    const deleted = await chatbotRepo.deleteEdge(eid);
    if (!deleted) {
      const response: ApiResponse = {
        success: false,
        error: { code: 'NOT_FOUND', message: 'Edge not found' },
      };
      return c.json(response, 404);
    }

    const response: ApiResponse = {
      success: true,
      data: { message: 'Edge deleted successfully' },
    };
    return c.json(response, 200);
  },
);

// ---------------------------------------------------------------------------
// GET /api/v1/chatbot/:id/scenarios  - シナリオ一覧
// POST /api/v1/chatbot/:id/scenarios  - シナリオ作成
// NOTE: /:id/scenarios は /:id より前に定義しても競合しないが念のため確認済み
// ---------------------------------------------------------------------------

chatbotRoutes.get('/:id/scenarios', authMiddleware, async (c) => {
  const orgId = c.get('organizationId');
  const { id } = c.req.param();

  const chatbot = await chatbotRepo.findById(id, orgId);
  if (!chatbot) {
    const response: ApiResponse = {
      success: false,
      error: { code: 'NOT_FOUND', message: 'Chatbot not found' },
    };
    return c.json(response, 404);
  }

  const scenariosList = await chatbotRepo.findScenariosByChatbot(id, orgId);

  const response: ApiResponse<{ scenarios: typeof scenariosList }> = {
    success: true,
    data: { scenarios: scenariosList },
  };
  return c.json(response, 200);
});

chatbotRoutes.post(
  '/:id/scenarios',
  authMiddleware,
  zValidator('json', createScenarioSchema),
  async (c) => {
    const orgId = c.get('organizationId');
    const { id } = c.req.param();
    const body = c.req.valid('json');

    const chatbot = await chatbotRepo.findById(id, orgId);
    if (!chatbot) {
      const response: ApiResponse = {
        success: false,
        error: { code: 'NOT_FOUND', message: 'Chatbot not found' },
      };
      return c.json(response, 404);
    }

    const input: CreateScenarioInput = {
      chatbotId: id,
      organizationId: orgId,
      name: body.name,
      ...(body.description !== undefined
        ? { description: body.description }
        : {}),
      ...(body.triggerKeywords !== undefined
        ? { triggerKeywords: body.triggerKeywords }
        : {}),
      ...(body.sortOrder !== undefined ? { sortOrder: body.sortOrder } : {}),
    };

    const scenario = await chatbotRepo.createScenario(input);

    const response: ApiResponse<{ scenario: typeof scenario }> = {
      success: true,
      data: { scenario },
    };
    return c.json(response, 201);
  },
);

// ---------------------------------------------------------------------------
// POST /:id/preview-chat - プレビュー用チャット（認証済み・isActive不問）
// ---------------------------------------------------------------------------

const previewChatSchema = z.object({
  message: z.string().min(1).max(2000),
  sessionId: z.string().min(1).max(128),
});

chatbotRoutes.post(
  '/:id/preview-chat',
  authMiddleware,
  zValidator('json', previewChatSchema),
  async (c) => {
    const { id } = c.req.param();
    const { message, sessionId } = c.req.valid('json');
    const orgId = c.get('organizationId');

    // チャットボット取得（isActive不問・組織チェックあり）
    const [chatbot] = await getDb()
      .select()
      .from(chatbots)
      .where(eq(chatbots.id, id))
      .limit(1);

    if (!chatbot || chatbot.organizationId !== orgId) {
      const response: ApiResponse = {
        success: false,
        error: { code: 'NOT_FOUND', message: 'Chatbot not found' },
      };
      return c.json(response, 404);
    }

    try {
      const session = await chatService.findOrCreateSession(id, sessionId, orgId);

      // '__init__' はシナリオの初期ステップ取得用（ユーザーメッセージとして保存しない）
      const isInit = message === '__init__';

      if (!isInit) {
        await chatService.saveMessage({
          sessionId: session.id,
          organizationId: orgId,
          role: 'user',
          content: message,
        });
      }

      // シナリオ型・ハイブリッド型はシナリオエンジンを使用
      let botMessage: string;
      let choices: string[] | undefined;
      let isEnd: boolean | undefined;

      if (chatbot.type === 'scenario' || chatbot.type === 'hybrid') {
        // init の場合は現在ノードをリセットして最初のステップを返す
        if (isInit) {
          await chatService.updateSessionNode(session.id, null);
        }
        const step = await chatService.processScenarioStep(id, session.id, isInit ? null : message);
        if (step) {
          botMessage = step.message;
          choices = step.choices.length > 0 ? step.choices : undefined;
          isEnd = step.isEnd;
        } else {
          const aiConfig = chatbot.aiConfig as { max_context_messages: number };
          const messageHistory = await chatService.getMessageHistory(session.id, aiConfig.max_context_messages);
          const result = await chatService.processMessage({ chatbotId: id, sessionId: session.id, userMessage: message, chatbot, messageHistory });
          botMessage = result.message;
        }
      } else {
        const aiConfig = chatbot.aiConfig as { max_context_messages: number };
        const messageHistory = await chatService.getMessageHistory(session.id, aiConfig.max_context_messages);
        const result = await chatService.processMessage({ chatbotId: id, sessionId: session.id, userMessage: message, chatbot, messageHistory });
        botMessage = result.message;
      }

      await chatService.saveMessage({
        sessionId: session.id,
        organizationId: orgId,
        role: 'bot',
        content: botMessage,
      });

      const responseData: { message: string; choices?: string[]; isEnd?: boolean } = { message: botMessage };
      if (choices !== undefined) responseData.choices = choices;
      if (isEnd !== undefined) responseData.isEnd = isEnd;
      const response: ApiResponse<typeof responseData> = {
        success: true,
        data: responseData,
      };
      return c.json(response);
    } catch (err) {
      const response: ApiResponse = {
        success: false,
        error: { code: 'INTERNAL_ERROR', message: String(err) },
      };
      return c.json(response, 500);
    }
  },
);

// ---------------------------------------------------------------------------
// POST /:id/generate-faq-scenario - FAQからシナリオを自動生成
// ---------------------------------------------------------------------------

const generateFaqScenarioSchema = z.object({
  scenarioName: z.string().max(255).optional(),
  greetingMessage: z.string().max(500).optional(),
  maxQuestionsPerCategory: z.number().int().min(1).max(30).optional(),
});

chatbotRoutes.post(
  '/:id/generate-faq-scenario',
  authMiddleware,
  zValidator('json', generateFaqScenarioSchema),
  async (c) => {
    const { id } = c.req.param();
    const body = c.req.valid('json');
    const orgId = c.get('organizationId');

    // チャットボット取得・組織チェック
    const chatbot = await chatbotRepo.findById(id, orgId);
    if (!chatbot) {
      const response: ApiResponse = {
        success: false,
        error: { code: 'NOT_FOUND', message: 'Chatbot not found' },
      };
      return c.json(response, 404);
    }

    try {
      const genOpts: import('../../lib/faq-scenario-generator.js').GenerateFaqScenarioOptions = {
        chatbotId: id,
        siteId: chatbot.siteId,
        organizationId: orgId,
      };
      if (body.scenarioName) genOpts.scenarioName = body.scenarioName;
      if (body.greetingMessage) genOpts.greetingMessage = body.greetingMessage;
      if (body.maxQuestionsPerCategory !== undefined) genOpts.maxQuestionsPerCategory = body.maxQuestionsPerCategory;

      const result = await generateFaqScenario(genOpts);

      const response: ApiResponse<typeof result> = {
        success: true,
        data: result,
      };
      return c.json(response, 201);
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      const response: ApiResponse = {
        success: false,
        error: { code: 'GENERATION_FAILED', message },
      };
      return c.json(response, 422);
    }
  },
);

export { chatbotRoutes };
