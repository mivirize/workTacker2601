import {
  getDb,
  chatbots,
  chatSessions,
  chatMessages,
  faqItems,
  scenarios,
  scenarioNodes,
  scenarioEdges,
  eq,
  and,
  or,
  desc,
  asc,
  ilike,
} from '@faqai/db';
import type { AiConfig, NodeContent } from '@faqai/db';
import { callLlm } from './faq-generator.js';
import { logger } from './logger.js';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type ChatbotRecord = typeof chatbots.$inferSelect;
type ChatMessageRecord = typeof chatMessages.$inferSelect;

type ProcessMessageParams = {
  chatbotId: string;
  sessionId: string;
  userMessage: string;
  chatbot: ChatbotRecord;
  messageHistory: ChatMessageRecord[];
};

type ProcessMessageResult = {
  message: string;
  sourceFaqIds: string[];
  confidenceScore: number;
  choices?: string[];
  isEnd?: boolean;
  currentNodeId?: string | null;
};

type ScenarioStepResult = {
  message: string;
  choices: string[];
  isEnd: boolean;
  currentNodeId: string | null;
};

type RelevantFaq = {
  id: string;
  question: string;
  answer: string;
};

// ---------------------------------------------------------------------------
// ChatService
// ---------------------------------------------------------------------------

export class ChatService {
  private get db() {
    return getDb();
  }

  /**
   * Process a user message and generate an AI response using FAQ-based RAG.
   */
  async processMessage(params: ProcessMessageParams): Promise<ProcessMessageResult> {
    const { chatbot, userMessage, messageHistory } = params;
    const aiConfig = chatbot.aiConfig as AiConfig;

    // 1. Search relevant FAQs from DB
    const relevantFaqs = await this.searchRelevantFaqs(chatbot.siteId, userMessage);

    // 2. Build system prompt with FAQ context
    const systemPrompt = this.buildSystemPrompt(aiConfig, relevantFaqs);

    // 3. Build conversation messages for LLM
    const llmMessages = this.buildLlmMessages(systemPrompt, messageHistory, userMessage, aiConfig);

    // 4. Call LLM
    try {
      const response = await callLlm({
        messages: llmMessages,
        temperature: aiConfig.temperature,
        max_tokens: aiConfig.max_tokens,
        response_format: { type: 'text' },
      });

      // Parse response - callLlm returns raw text, but with response_format: text
      // it may still be JSON-wrapped depending on provider. Try to extract plain text.
      const botMessage = this.extractTextResponse(response);
      const sourceFaqIds = relevantFaqs.map((faq) => faq.id);
      const confidenceScore = relevantFaqs.length > 0 ? 0.85 : 0.3;

      return {
        message: botMessage,
        sourceFaqIds,
        confidenceScore,
      };
    } catch (err) {
      logger.error({ err: String(err), chatbotId: params.chatbotId }, 'LLM call failed in chat');

      // Return fallback message on LLM failure
      return {
        message: aiConfig.fallback_message,
        sourceFaqIds: [],
        confidenceScore: 0,
      };
    }
  }

  /**
   * Find or create a chat session for the given visitor/sessionId.
   */
  async findOrCreateSession(chatbotId: string, sessionId: string, organizationId: string) {
    // Try to find existing session by visitorId
    const [existing] = await this.db
      .select()
      .from(chatSessions)
      .where(
        and(
          eq(chatSessions.chatbotId, chatbotId),
          eq(chatSessions.visitorId, sessionId),
        ),
      )
      .limit(1);

    if (existing) {
      return existing;
    }

    // Create new session
    const [session] = await this.db
      .insert(chatSessions)
      .values({
        chatbotId,
        organizationId,
        visitorId: sessionId,
        metadata: {},
      })
      .returning();

    return session!;
  }

  /**
   * Save a chat message to the database.
   */
  async saveMessage(params: {
    sessionId: string;
    organizationId: string;
    role: 'user' | 'bot' | 'system';
    content: string;
    confidenceScore?: number;
    sourceFaqIds?: string[];
  }) {
    const [message] = await this.db
      .insert(chatMessages)
      .values({
        sessionId: params.sessionId,
        organizationId: params.organizationId,
        role: params.role,
        content: params.content,
        confidenceScore: params.confidenceScore ?? null,
        sourceFaqIds: params.sourceFaqIds ?? null,
        metadata: {},
      })
      .returning();

    return message!;
  }

  /**
   * Get recent message history for a session.
   */
  async getMessageHistory(sessionId: string, limit: number): Promise<ChatMessageRecord[]> {
    const messages = await this.db
      .select()
      .from(chatMessages)
      .where(eq(chatMessages.sessionId, sessionId))
      .orderBy(desc(chatMessages.createdAt))
      .limit(limit);

    // Return in chronological order
    return messages.reverse();
  }

  /**
   * Find an active chatbot by ID.
   */
  async findActiveChatbot(chatbotId: string): Promise<ChatbotRecord | null> {
    const [chatbot] = await this.db
      .select()
      .from(chatbots)
      .where(
        and(
          eq(chatbots.id, chatbotId),
          eq(chatbots.isActive, true),
        ),
      )
      .limit(1);

    return chatbot ?? null;
  }

  /**
   * Update the current node tracked in session metadata.
   */
  async updateSessionNode(sessionId: string, currentNodeId: string | null) {
    await this.db
      .update(chatSessions)
      .set({ metadata: { currentNodeId } })
      .where(eq(chatSessions.id, sessionId));
  }

  /**
   * Get the current node ID from session metadata.
   */
  async getSessionNodeId(sessionId: string): Promise<string | null> {
    const [session] = await this.db
      .select({ metadata: chatSessions.metadata })
      .from(chatSessions)
      .where(eq(chatSessions.id, sessionId))
      .limit(1);

    const meta = session?.metadata as Record<string, unknown> | null;
    return (meta?.currentNodeId as string) ?? null;
  }

  /**
   * Process a scenario-type message by traversing the node/edge graph.
   * - No currentNodeId: find start node, return its message + edge labels as choices
   * - With currentNodeId + userChoice: find matching edge → next node
   */
  async processScenarioStep(
    chatbotId: string,
    sessionId: string,
    userChoice: string | null,
  ): Promise<ScenarioStepResult | null> {
    // Find first active scenario for this chatbot
    const [scenario] = await this.db
      .select()
      .from(scenarios)
      .where(and(eq(scenarios.chatbotId, chatbotId), eq(scenarios.isActive, true)))
      .orderBy(asc(scenarios.sortOrder))
      .limit(1);

    if (!scenario) return null;

    const currentNodeId = await this.getSessionNodeId(sessionId);

    let targetNode: typeof scenarioNodes.$inferSelect | undefined;

    if (!currentNodeId) {
      // First step: find start node
      const [startNode] = await this.db
        .select()
        .from(scenarioNodes)
        .where(and(eq(scenarioNodes.scenarioId, scenario.id), eq(scenarioNodes.isStart, true)))
        .limit(1);

      targetNode = startNode;
    } else {
      // User selected a choice: find matching edge from current node
      const edges = await this.db
        .select()
        .from(scenarioEdges)
        .where(eq(scenarioEdges.fromNodeId, currentNodeId))
        .orderBy(asc(scenarioEdges.sortOrder));

      // Match edge by label (case-insensitive) or index
      const matchedEdge =
        edges.find((e) => e.label?.toLowerCase() === userChoice?.toLowerCase()) ?? edges[0];

      if (!matchedEdge) return null;

      const [nextNode] = await this.db
        .select()
        .from(scenarioNodes)
        .where(eq(scenarioNodes.id, matchedEdge.toNodeId))
        .limit(1);

      targetNode = nextNode;
    }

    if (!targetNode) return null;

    const content = targetNode.content as NodeContent;
    const message = content.text ?? '…';

    // Get outgoing edges for next choices
    const nextEdges = targetNode.isEnd
      ? []
      : await this.db
          .select()
          .from(scenarioEdges)
          .where(eq(scenarioEdges.fromNodeId, targetNode.id))
          .orderBy(asc(scenarioEdges.sortOrder));

    const choices = nextEdges.map((e) => e.label ?? '選択').filter(Boolean);

    // Update session with current node
    await this.updateSessionNode(sessionId, targetNode.id);

    return {
      message,
      choices,
      isEnd: targetNode.isEnd,
      currentNodeId: targetNode.id,
    };
  }

  // ---------------------------------------------------------------------------
  // Private helpers
  // ---------------------------------------------------------------------------

  /**
   * Search for relevant FAQs using keyword-based ILIKE matching.
   */
  private async searchRelevantFaqs(siteId: string, userMessage: string): Promise<RelevantFaq[]> {
    // Extract meaningful keywords from the user message
    const keywords = this.extractKeywords(userMessage);

    if (keywords.length === 0) {
      return [];
    }

    // Build ILIKE conditions for each keyword against question and answer
    const keywordConditions = keywords.map((keyword) => {
      const pattern = `%${keyword}%`;
      return or(
        ilike(faqItems.question, pattern),
        ilike(faqItems.answer, pattern),
      );
    });

    try {
      const results = await this.db
        .select({
          id: faqItems.id,
          question: faqItems.question,
          answer: faqItems.answer,
        })
        .from(faqItems)
        .where(
          and(
            eq(faqItems.siteId, siteId),
            eq(faqItems.status, 'published'),
            or(...keywordConditions),
          ),
        )
        .limit(5);

      return results;
    } catch (err) {
      logger.warn({ err: String(err), siteId }, 'FAQ search failed');
      return [];
    }
  }

  /**
   * Extract meaningful keywords from a user message.
   * Filters out common Japanese/English stop words and short tokens.
   */
  private extractKeywords(message: string): string[] {
    const stopWords = new Set([
      // Japanese particles and common words
      'の', 'は', 'が', 'を', 'に', 'で', 'と', 'も', 'か', 'へ',
      'よ', 'ね', 'な', 'ん', 'だ', 'です', 'ます', 'した', 'する',
      'ある', 'いる', 'ない', 'こと', 'もの', 'これ', 'それ', 'あれ',
      'この', 'その', 'あの', 'どの', 'なに', 'どう', 'から', 'まで',
      'より', 'ため', 'ので', 'けど', 'でも', 'ところ', 'について',
      'おねがい', 'ください', 'お願い', 'して', 'ている',
      // English
      'the', 'a', 'an', 'is', 'are', 'was', 'were', 'be', 'been',
      'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would',
      'can', 'could', 'should', 'may', 'might', 'shall',
      'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by', 'from',
      'and', 'or', 'but', 'not', 'no', 'yes', 'if', 'then',
      'what', 'how', 'when', 'where', 'who', 'which', 'why',
      'i', 'you', 'he', 'she', 'it', 'we', 'they', 'me', 'my',
    ]);

    // Split by whitespace and punctuation, keep meaningful tokens
    const tokens = message
      .toLowerCase()
      .replace(/[。、！？!?,.:;()（）「」『』【】\[\]{}<>""''・…―]/g, ' ')
      .split(/\s+/)
      .filter((token) => token.length >= 2 && !stopWords.has(token));

    // Deduplicate and take top keywords
    const unique = [...new Set(tokens)];
    return unique.slice(0, 5);
  }

  /**
   * Build the system prompt with FAQ context and chatbot configuration.
   */
  private buildSystemPrompt(aiConfig: AiConfig, relevantFaqs: RelevantFaq[]): string {
    const parts: string[] = [];

    // Custom system prompt from chatbot config
    if (aiConfig.system_prompt) {
      parts.push(aiConfig.system_prompt);
    } else {
      parts.push(
        'あなたはウェブサイトのカスタマーサポートAIアシスタントです。' +
        'ユーザーの質問に丁寧に、正確に回答してください。',
      );
    }

    // FAQ context
    if (relevantFaqs.length > 0) {
      parts.push('\n## 参考FAQ情報\n以下のFAQを参考にして回答してください。FAQに関連する情報がある場合は、それに基づいて回答してください。');
      for (const faq of relevantFaqs) {
        parts.push(`Q: ${faq.question}\nA: ${faq.answer}`);
      }
      parts.push('\n上記のFAQに基づいて回答してください。FAQに直接関係のない質問の場合は、一般的な知識で丁寧に回答してください。');
    } else {
      parts.push(
        `\n関連するFAQ情報が見つかりませんでした。` +
        `質問に回答できない場合は、次のメッセージを返してください: "${aiConfig.fallback_message}"`,
      );
    }

    // General instructions
    parts.push('\n## 回答ルール');
    parts.push('- 簡潔で分かりやすい日本語で回答してください');
    parts.push('- 不確かな情報は推測で答えず、分からない旨を伝えてください');
    parts.push('- マークダウン記法は使用せず、プレーンテキストで回答してください');

    return parts.join('\n');
  }

  /**
   * Build the full message array for the LLM call, including conversation history.
   */
  private buildLlmMessages(
    systemPrompt: string,
    messageHistory: ChatMessageRecord[],
    userMessage: string,
    aiConfig: AiConfig,
  ): Array<{ role: string; content: string }> {
    const messages: Array<{ role: string; content: string }> = [
      { role: 'system', content: systemPrompt },
    ];

    // Add recent conversation history (respect max_context_messages)
    const maxHistory = aiConfig.max_context_messages;
    const recentHistory = messageHistory.slice(-maxHistory);

    for (const msg of recentHistory) {
      const role = msg.role === 'user' ? 'user' : 'assistant';
      messages.push({ role, content: msg.content });
    }

    // Add current user message
    messages.push({ role: 'user', content: userMessage });

    return messages;
  }

  /**
   * Extract plain text from LLM response, handling potential JSON wrapping.
   */
  private extractTextResponse(response: string): string {
    // If response looks like JSON with a message field, extract it
    const trimmed = response.trim();
    if (trimmed.startsWith('{')) {
      try {
        const parsed = JSON.parse(trimmed) as { message?: string; response?: string; text?: string };
        if (parsed.message) return parsed.message;
        if (parsed.response) return parsed.response;
        if (parsed.text) return parsed.text;
      } catch {
        // Not valid JSON, return as-is
      }
    }
    return trimmed;
  }
}
