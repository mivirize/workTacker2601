import {
  getDb,
  chatbots,
  chatSessions,
  chatMessages,
  scenarios,
  scenarioNodes,
  scenarioEdges,
  eq,
  and,
  desc,
  asc,
} from '@faqai/db';
import type {
  WidgetConfig,
  AiConfig,
  TriggerConfig,
  ChatSessionMetadata,
  ChatMessageMetadata,
  NodeContent,
  EdgeCondition,
} from '@faqai/db';

// ---------------------------------------------------------------------------
// Input types
// ---------------------------------------------------------------------------

/** Allow each nested key to be `T | undefined` for exactOptionalPropertyTypes compat */
type Relaxed<T> = { [K in keyof T]?: T[K] | undefined };

export type CreateChatbotInput = {
  organizationId: string;
  siteId: string;
  name: string;
  type?: 'scenario' | 'ai' | 'hybrid' | undefined;
  isActive?: boolean | undefined;
  widgetConfig?: Relaxed<WidgetConfig> | undefined;
  aiConfig?: Relaxed<AiConfig> | undefined;
  triggerConfig?: Relaxed<TriggerConfig> | undefined;
  allowedDomains?: string[] | undefined;
};

export type UpdateChatbotInput = {
  name?: string | undefined;
  type?: 'scenario' | 'ai' | 'hybrid' | undefined;
  isActive?: boolean | undefined;
  widgetConfig?: Relaxed<WidgetConfig> | undefined;
  aiConfig?: Relaxed<AiConfig> | undefined;
  triggerConfig?: Relaxed<TriggerConfig> | undefined;
  allowedDomains?: string[] | undefined;
};

export type CreateSessionInput = {
  chatbotId: string;
  organizationId: string;
  visitorId?: string;
  pageUrl?: string;
  referrerUrl?: string;
  userAgent?: string;
  ipHash?: string;
  metadata?: ChatSessionMetadata;
};

export type CreateMessageInput = {
  sessionId: string;
  organizationId: string;
  role: 'user' | 'bot' | 'system';
  content: string;
  metadata?: ChatMessageMetadata;
  scenarioNodeId?: string;
  confidenceScore?: number;
  sourceFaqIds?: string[];
};

export type CreateScenarioInput = {
  chatbotId: string;
  organizationId: string;
  name: string;
  description?: string | undefined;
  triggerKeywords?: string[] | undefined;
  sortOrder?: number | undefined;
};

export type UpdateScenarioInput = {
  name?: string | undefined;
  description?: string | undefined;
  isActive?: boolean | undefined;
  triggerKeywords?: string[] | undefined;
  sortOrder?: number | undefined;
};

export type CreateNodeInput = {
  scenarioId: string;
  organizationId: string;
  nodeType: string;
  content?: Relaxed<NodeContent> | undefined;
  positionX?: number | undefined;
  positionY?: number | undefined;
  isStart?: boolean | undefined;
  isEnd?: boolean | undefined;
};

export type UpdateNodeInput = {
  nodeType?: string | undefined;
  content?: Relaxed<NodeContent> | undefined;
  positionX?: number | undefined;
  positionY?: number | undefined;
  isStart?: boolean | undefined;
  isEnd?: boolean | undefined;
};

export type CreateEdgeInput = {
  scenarioId: string;
  fromNodeId: string;
  toNodeId: string;
  condition?: EdgeCondition | undefined;
  label?: string | undefined;
  sortOrder?: number | undefined;
};

// ---------------------------------------------------------------------------
// Repository
// ---------------------------------------------------------------------------

export class ChatbotRepository {
  private get db() {
    return getDb();
  }

  // -------------------------------------------------------------------------
  // Chatbot CRUD
  // -------------------------------------------------------------------------

  async findAll(organizationId: string) {
    return this.db
      .select()
      .from(chatbots)
      .where(eq(chatbots.organizationId, organizationId))
      .orderBy(desc(chatbots.createdAt));
  }

  async findById(id: string, organizationId: string) {
    const [chatbot] = await this.db
      .select()
      .from(chatbots)
      .where(
        and(eq(chatbots.id, id), eq(chatbots.organizationId, organizationId)),
      );
    return chatbot ?? null;
  }

  async findBySiteId(siteId: string, organizationId: string) {
    return this.db
      .select()
      .from(chatbots)
      .where(
        and(
          eq(chatbots.siteId, siteId),
          eq(chatbots.organizationId, organizationId),
        ),
      )
      .orderBy(desc(chatbots.createdAt));
  }

  async create(input: CreateChatbotInput) {
    const [chatbot] = await this.db
      .insert(chatbots)
      .values({
        organizationId: input.organizationId,
        siteId: input.siteId,
        name: input.name,
        ...(input.type !== undefined ? { type: input.type } : {}),
        ...(input.isActive !== undefined ? { isActive: input.isActive } : {}),
        ...(input.widgetConfig !== undefined
          ? { widgetConfig: input.widgetConfig as WidgetConfig }
          : {}),
        ...(input.aiConfig !== undefined
          ? { aiConfig: input.aiConfig as AiConfig }
          : {}),
        ...(input.triggerConfig !== undefined
          ? { triggerConfig: input.triggerConfig as TriggerConfig }
          : {}),
        ...(input.allowedDomains !== undefined
          ? { allowedDomains: input.allowedDomains }
          : {}),
      })
      .returning();

    if (!chatbot) throw new Error('Failed to create chatbot');
    return chatbot;
  }

  async update(id: string, organizationId: string, input: UpdateChatbotInput) {
    const existing = await this.findById(id, organizationId);
    if (!existing) return null;

    const updateData: Partial<typeof chatbots.$inferInsert> = {
      updatedAt: new Date(),
    };

    if (input.name !== undefined) updateData.name = input.name;
    if (input.type !== undefined) updateData.type = input.type;
    if (input.isActive !== undefined) updateData.isActive = input.isActive;
    if (input.allowedDomains !== undefined) {
      updateData.allowedDomains = input.allowedDomains;
    }
    if (input.widgetConfig !== undefined) {
      updateData.widgetConfig = {
        ...existing.widgetConfig,
        ...input.widgetConfig,
      } as WidgetConfig;
    }
    if (input.aiConfig !== undefined) {
      updateData.aiConfig = {
        ...existing.aiConfig,
        ...input.aiConfig,
      } as AiConfig;
    }
    if (input.triggerConfig !== undefined) {
      updateData.triggerConfig = {
        ...existing.triggerConfig,
        ...input.triggerConfig,
      } as TriggerConfig;
    }

    const [updated] = await this.db
      .update(chatbots)
      .set(updateData)
      .where(
        and(eq(chatbots.id, id), eq(chatbots.organizationId, organizationId)),
      )
      .returning();
    return updated ?? null;
  }

  async delete(id: string, organizationId: string) {
    const [deleted] = await this.db
      .delete(chatbots)
      .where(
        and(eq(chatbots.id, id), eq(chatbots.organizationId, organizationId)),
      )
      .returning({ id: chatbots.id });
    return !!deleted;
  }

  // -------------------------------------------------------------------------
  // Public (no org check - for widget)
  // -------------------------------------------------------------------------

  async findActiveById(id: string) {
    const [chatbot] = await this.db
      .select()
      .from(chatbots)
      .where(and(eq(chatbots.id, id), eq(chatbots.isActive, true)));
    return chatbot ?? null;
  }

  // -------------------------------------------------------------------------
  // Chat sessions
  // -------------------------------------------------------------------------

  async createSession(input: CreateSessionInput) {
    const [session] = await this.db
      .insert(chatSessions)
      .values({
        chatbotId: input.chatbotId,
        organizationId: input.organizationId,
        visitorId: input.visitorId ?? null,
        pageUrl: input.pageUrl ?? null,
        referrerUrl: input.referrerUrl ?? null,
        userAgent: input.userAgent ?? null,
        ipHash: input.ipHash ?? null,
        metadata: input.metadata ?? {},
      })
      .returning();

    if (!session) throw new Error('Failed to create chat session');
    return session;
  }

  async findSession(sessionId: string) {
    const [session] = await this.db
      .select()
      .from(chatSessions)
      .where(eq(chatSessions.id, sessionId));
    return session ?? null;
  }

  async findSessionsByChatbot(
    chatbotId: string,
    organizationId: string,
    limit = 50,
  ) {
    return this.db
      .select()
      .from(chatSessions)
      .where(
        and(
          eq(chatSessions.chatbotId, chatbotId),
          eq(chatSessions.organizationId, organizationId),
        ),
      )
      .orderBy(desc(chatSessions.startedAt))
      .limit(limit);
  }

  // -------------------------------------------------------------------------
  // Chat messages
  // -------------------------------------------------------------------------

  async createMessage(input: CreateMessageInput) {
    const [message] = await this.db
      .insert(chatMessages)
      .values({
        sessionId: input.sessionId,
        organizationId: input.organizationId,
        role: input.role,
        content: input.content,
        metadata: input.metadata ?? {},
        scenarioNodeId: input.scenarioNodeId ?? null,
        confidenceScore: input.confidenceScore ?? null,
        sourceFaqIds: input.sourceFaqIds ?? null,
      })
      .returning();

    if (!message) throw new Error('Failed to create chat message');
    return message;
  }

  async findMessagesBySession(sessionId: string, limit = 100) {
    return this.db
      .select()
      .from(chatMessages)
      .where(eq(chatMessages.sessionId, sessionId))
      .orderBy(desc(chatMessages.createdAt))
      .limit(limit);
  }

  // -------------------------------------------------------------------------
  // Scenarios
  // -------------------------------------------------------------------------

  async findScenariosByChatbot(chatbotId: string, organizationId: string) {
    return this.db
      .select()
      .from(scenarios)
      .where(
        and(
          eq(scenarios.chatbotId, chatbotId),
          eq(scenarios.organizationId, organizationId),
        ),
      )
      .orderBy(asc(scenarios.sortOrder), asc(scenarios.createdAt));
  }

  async createScenario(input: CreateScenarioInput) {
    const [scenario] = await this.db
      .insert(scenarios)
      .values({
        chatbotId: input.chatbotId,
        organizationId: input.organizationId,
        name: input.name,
        ...(input.description !== undefined
          ? { description: input.description }
          : {}),
        ...(input.triggerKeywords !== undefined
          ? { triggerKeywords: input.triggerKeywords }
          : {}),
        ...(input.sortOrder !== undefined
          ? { sortOrder: input.sortOrder }
          : {}),
      })
      .returning();

    if (!scenario) throw new Error('Failed to create scenario');
    return scenario;
  }

  async findScenarioById(scenarioId: string, organizationId: string) {
    const [scenario] = await this.db
      .select()
      .from(scenarios)
      .where(
        and(
          eq(scenarios.id, scenarioId),
          eq(scenarios.organizationId, organizationId),
        ),
      );
    return scenario ?? null;
  }

  async updateScenario(
    scenarioId: string,
    organizationId: string,
    input: UpdateScenarioInput,
  ) {
    const existing = await this.findScenarioById(scenarioId, organizationId);
    if (!existing) return null;

    const updateData: Partial<typeof scenarios.$inferInsert> = {
      updatedAt: new Date(),
    };

    if (input.name !== undefined) updateData.name = input.name;
    if (input.description !== undefined)
      updateData.description = input.description;
    if (input.isActive !== undefined) updateData.isActive = input.isActive;
    if (input.triggerKeywords !== undefined)
      updateData.triggerKeywords = input.triggerKeywords;
    if (input.sortOrder !== undefined) updateData.sortOrder = input.sortOrder;

    const [updated] = await this.db
      .update(scenarios)
      .set(updateData)
      .where(
        and(
          eq(scenarios.id, scenarioId),
          eq(scenarios.organizationId, organizationId),
        ),
      )
      .returning();
    return updated ?? null;
  }

  async deleteScenario(scenarioId: string, organizationId: string) {
    const [deleted] = await this.db
      .delete(scenarios)
      .where(
        and(
          eq(scenarios.id, scenarioId),
          eq(scenarios.organizationId, organizationId),
        ),
      )
      .returning({ id: scenarios.id });
    return !!deleted;
  }

  // -------------------------------------------------------------------------
  // Scenario Nodes
  // -------------------------------------------------------------------------

  async findNodesByScenario(scenarioId: string) {
    return this.db
      .select()
      .from(scenarioNodes)
      .where(eq(scenarioNodes.scenarioId, scenarioId))
      .orderBy(asc(scenarioNodes.createdAt));
  }

  async createNode(input: CreateNodeInput) {
    const [node] = await this.db
      .insert(scenarioNodes)
      .values({
        scenarioId: input.scenarioId,
        organizationId: input.organizationId,
        nodeType: input.nodeType,
        ...(input.content !== undefined
          ? { content: input.content as NodeContent }
          : {}),
        ...(input.positionX !== undefined
          ? { positionX: input.positionX }
          : {}),
        ...(input.positionY !== undefined
          ? { positionY: input.positionY }
          : {}),
        ...(input.isStart !== undefined ? { isStart: input.isStart } : {}),
        ...(input.isEnd !== undefined ? { isEnd: input.isEnd } : {}),
      })
      .returning();

    if (!node) throw new Error('Failed to create scenario node');
    return node;
  }

  async updateNode(nodeId: string, input: UpdateNodeInput) {
    const updateData: Partial<typeof scenarioNodes.$inferInsert> = {
      updatedAt: new Date(),
    };

    if (input.nodeType !== undefined) updateData.nodeType = input.nodeType;
    if (input.content !== undefined)
      updateData.content = input.content as NodeContent;
    if (input.positionX !== undefined) updateData.positionX = input.positionX;
    if (input.positionY !== undefined) updateData.positionY = input.positionY;
    if (input.isStart !== undefined) updateData.isStart = input.isStart;
    if (input.isEnd !== undefined) updateData.isEnd = input.isEnd;

    const [updated] = await this.db
      .update(scenarioNodes)
      .set(updateData)
      .where(eq(scenarioNodes.id, nodeId))
      .returning();
    return updated ?? null;
  }

  async deleteNode(nodeId: string) {
    const [deleted] = await this.db
      .delete(scenarioNodes)
      .where(eq(scenarioNodes.id, nodeId))
      .returning({ id: scenarioNodes.id });
    return !!deleted;
  }

  // -------------------------------------------------------------------------
  // Scenario Edges
  // -------------------------------------------------------------------------

  async findEdgesByScenario(scenarioId: string) {
    return this.db
      .select()
      .from(scenarioEdges)
      .where(eq(scenarioEdges.scenarioId, scenarioId))
      .orderBy(asc(scenarioEdges.sortOrder), asc(scenarioEdges.createdAt));
  }

  async createEdge(input: CreateEdgeInput) {
    const [edge] = await this.db
      .insert(scenarioEdges)
      .values({
        scenarioId: input.scenarioId,
        fromNodeId: input.fromNodeId,
        toNodeId: input.toNodeId,
        ...(input.condition !== undefined
          ? { condition: input.condition }
          : {}),
        ...(input.label !== undefined ? { label: input.label } : {}),
        ...(input.sortOrder !== undefined
          ? { sortOrder: input.sortOrder }
          : {}),
      })
      .returning();

    if (!edge) throw new Error('Failed to create scenario edge');
    return edge;
  }

  async deleteEdge(edgeId: string) {
    const [deleted] = await this.db
      .delete(scenarioEdges)
      .where(eq(scenarioEdges.id, edgeId))
      .returning({ id: scenarioEdges.id });
    return !!deleted;
  }
}
