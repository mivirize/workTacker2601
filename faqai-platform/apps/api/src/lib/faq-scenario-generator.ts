/**
 * faq-scenario-generator.ts
 *
 * 既存のFAQ（カテゴリ付き）から選択式シナリオを自動生成する。
 *
 * 生成されるフロー:
 *   START → カテゴリ選択
 *     → カテゴリノード（FAQ質問一覧）
 *       → 各FAQの回答ノード
 *         → END（解決）
 *         → カテゴリノードに戻る
 *       → STARTに戻る
 */

import {
  getDb,
  scenarios,
  scenarioNodes,
  scenarioEdges,
  faqItems,
  faqCategories,
  eq,
  and,
  asc,
} from '@faqai/db';
import type { NodeContent } from '@faqai/db';

// ---------------------------------------------------------------------------
// Public types
// ---------------------------------------------------------------------------

export type GenerateFaqScenarioOptions = {
  chatbotId: string;
  siteId: string;
  organizationId: string;
  scenarioName?: string;
  greetingMessage?: string;
  maxQuestionsPerCategory?: number;
};

export type GenerateFaqScenarioResult = {
  scenarioId: string;
  nodeCount: number;
  edgeCount: number;
  categoryCount: number;
  faqCount: number;
};

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

/** 質問テキストをボタンラベル用に短縮 */
function truncate(text: string, max = 30): string {
  return text.length <= max ? text : `${text.slice(0, max - 1)}…`;
}

function nodeContent(text: string): NodeContent {
  return { text };
}

// ---------------------------------------------------------------------------
// Main generator
// ---------------------------------------------------------------------------

export async function generateFaqScenario(
  opts: GenerateFaqScenarioOptions,
): Promise<GenerateFaqScenarioResult> {
  const {
    chatbotId,
    siteId,
    organizationId,
    scenarioName,
    greetingMessage = 'ご質問のカテゴリを選択してください。',
    maxQuestionsPerCategory = 10,
  } = opts;

  const db = getDb();

  // -----------------------------------------------------------------------
  // 1. Fetch published FAQs with category name
  // -----------------------------------------------------------------------
  const rows = await db
    .select({
      faqId: faqItems.id,
      question: faqItems.question,
      answer: faqItems.answer,
      categoryId: faqItems.categoryId,
      categoryName: faqCategories.name,
      categorySortOrder: faqCategories.sortOrder,
      faqSortOrder: faqItems.sortOrder,
    })
    .from(faqItems)
    .leftJoin(faqCategories, eq(faqItems.categoryId, faqCategories.id))
    .where(
      and(
        eq(faqItems.siteId, siteId),
        eq(faqItems.status, 'published'),
      ),
    )
    .orderBy(asc(faqCategories.sortOrder), asc(faqItems.sortOrder));

  if (rows.length === 0) {
    throw new Error('公開済みのFAQが存在しません。先にFAQを公開してください。');
  }

  // -----------------------------------------------------------------------
  // 2. Group by category
  // -----------------------------------------------------------------------
  type FaqRow = { faqId: string; question: string; answer: string };
  const categoryMap = new Map<string, { name: string; faqs: FaqRow[] }>();

  for (const row of rows) {
    const catId = row.categoryId ?? 'uncategorized';
    const catName = row.categoryName ?? '一般';

    if (!categoryMap.has(catId)) {
      categoryMap.set(catId, { name: catName, faqs: [] });
    }

    const cat = categoryMap.get(catId)!;
    if (cat.faqs.length < maxQuestionsPerCategory) {
      cat.faqs.push({
        faqId: row.faqId,
        question: row.question,
        answer: row.answer,
      });
    }
  }

  const categories = [...categoryMap.entries()];

  // -----------------------------------------------------------------------
  // 3. Create Scenario record
  // -----------------------------------------------------------------------
  const name = scenarioName ?? `FAQ対応シナリオ（${new Date().toLocaleDateString('ja-JP')}）`;

  const [scenario] = await db
    .insert(scenarios)
    .values({
      chatbotId,
      organizationId,
      name,
      description: `${categories.length}カテゴリ・${rows.length}件のFAQから自動生成`,
      isActive: true,
      triggerKeywords: [],
      sortOrder: 0,
    })
    .returning();

  if (!scenario) throw new Error('シナリオの作成に失敗しました');

  const scenarioId = scenario.id;

  // -----------------------------------------------------------------------
  // 4. Batch-insert all nodes
  //
  // Layout (x, y) for readability:
  //   Start        x=0,   y=0
  //   Categories   x=300, y=i*250
  //   Answers      x=600, y=i*180
  //   End          x=900, y=0
  // -----------------------------------------------------------------------

  type NodeValue = {
    scenarioId: string;
    organizationId: string;
    nodeType: string;
    content: NodeContent;
    positionX: number;
    positionY: number;
    isStart: boolean;
    isEnd: boolean;
  };

  const nodeValues: NodeValue[] = [];

  // Start node
  const startIdx = 0;
  nodeValues.push({
    scenarioId,
    organizationId,
    nodeType: 'message',
    content: nodeContent(greetingMessage),
    positionX: 0,
    positionY: 0,
    isStart: true,
    isEnd: false,
  });

  // Category nodes
  const categoryStartIdx = 1;
  for (let ci = 0; ci < categories.length; ci++) {
    const [, cat] = categories[ci]!;
    nodeValues.push({
      scenarioId,
      organizationId,
      nodeType: 'message',
      content: nodeContent(`【${cat.name}】\nご質問を選択してください。`),
      positionX: 300,
      positionY: ci * 250,
      isStart: false,
      isEnd: false,
    });
  }

  // Answer nodes (flat list of all FAQs)
  const answerStartIdx = 1 + categories.length;
  let answerOffset = 0;
  const categoryAnswerOffsets: number[] = []; // answer index offset per category

  for (let ci = 0; ci < categories.length; ci++) {
    const [, cat] = categories[ci]!;
    categoryAnswerOffsets.push(answerOffset);

    for (let fi = 0; fi < cat.faqs.length; fi++) {
      const faq = cat.faqs[fi]!;
      nodeValues.push({
        scenarioId,
        organizationId,
        nodeType: 'answer',
        content: nodeContent(`**${faq.question}**\n\n${faq.answer}`),
        positionX: 600,
        positionY: (answerOffset + fi) * 180,
        isStart: false,
        isEnd: false,
      });
    }

    answerOffset += cat.faqs.length;
  }

  // End node
  const endIdx = nodeValues.length;
  nodeValues.push({
    scenarioId,
    organizationId,
    nodeType: 'message',
    content: nodeContent('解決できて良かったです！\nまたいつでもご相談ください。'),
    positionX: 900,
    positionY: 0,
    isStart: false,
    isEnd: true,
  });

  // Batch insert nodes
  const insertedNodes = await db
    .insert(scenarioNodes)
    .values(nodeValues)
    .returning({ id: scenarioNodes.id });

  const nodeIds = insertedNodes.map((n) => n.id);

  const startNodeId = nodeIds[startIdx]!;
  const endNodeId = nodeIds[endIdx]!;

  // -----------------------------------------------------------------------
  // 5. Batch-insert all edges
  // -----------------------------------------------------------------------
  type EdgeValue = {
    scenarioId: string;
    fromNodeId: string;
    toNodeId: string;
    label: string;
    sortOrder: number;
  };

  const edgeValues: EdgeValue[] = [];

  for (let ci = 0; ci < categories.length; ci++) {
    const [, cat] = categories[ci]!;
    const categoryNodeId = nodeIds[categoryStartIdx + ci]!;

    // START → category
    edgeValues.push({
      scenarioId,
      fromNodeId: startNodeId,
      toNodeId: categoryNodeId,
      label: cat.name,
      sortOrder: ci,
    });

    const offset = categoryAnswerOffsets[ci]!;

    for (let fi = 0; fi < cat.faqs.length; fi++) {
      const faq = cat.faqs[fi]!;
      const answerNodeId = nodeIds[answerStartIdx + offset + fi]!;

      // category → answer (question label)
      edgeValues.push({
        scenarioId,
        fromNodeId: categoryNodeId,
        toNodeId: answerNodeId,
        label: truncate(faq.question),
        sortOrder: fi,
      });

      // answer → END
      edgeValues.push({
        scenarioId,
        fromNodeId: answerNodeId,
        toNodeId: endNodeId,
        label: '✓ 解決しました',
        sortOrder: 0,
      });

      // answer → category（戻る）
      edgeValues.push({
        scenarioId,
        fromNodeId: answerNodeId,
        toNodeId: categoryNodeId,
        label: '↩ 他の質問を見る',
        sortOrder: 1,
      });
    }

    // category → START（カテゴリ選択に戻る）
    edgeValues.push({
      scenarioId,
      fromNodeId: categoryNodeId,
      toNodeId: startNodeId,
      label: '← カテゴリを選び直す',
      sortOrder: cat.faqs.length,
    });
  }

  // Batch insert edges
  const insertedEdges = await db
    .insert(scenarioEdges)
    .values(edgeValues)
    .returning({ id: scenarioEdges.id });

  return {
    scenarioId,
    nodeCount: nodeIds.length,
    edgeCount: insertedEdges.length,
    categoryCount: categories.length,
    faqCount: rows.length,
  };
}
