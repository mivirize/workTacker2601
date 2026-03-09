/**
 * run-generate-scenarios.mjs
 * 両サイトのFAQからシナリオを自動生成するスクリプト
 * 実行: node --env-file=.env run-generate-scenarios.mjs
 */
import { getDb, sites, chatbots, faqItems, eq, and } from '@faqai/db';
import { generateFaqScenario } from './dist/lib/faq-scenario-generator.js';

const db = getDb();

// 1. 全サイトとチャットボットを取得
const rows = await db
  .select({
    siteId: sites.id,
    siteName: sites.name,
    chatbotId: chatbots.id,
    chatbotName: chatbots.name,
    chatbotType: chatbots.type,
    orgId: chatbots.organizationId,
  })
  .from(sites)
  .innerJoin(chatbots, eq(chatbots.siteId, sites.id))
  .orderBy(sites.name, chatbots.name);

if (rows.length === 0) {
  console.log('⚠️  チャットボットが見つかりません。先にサイトとチャットボットを作成してください。');
  process.exit(0);
}

// 2. 公開済みFAQ数を確認
const publishedFaqs = await db
  .select({ siteId: faqItems.siteId })
  .from(faqItems)
  .where(eq(faqItems.status, 'published'));

const faqCountBySite = {};
for (const f of publishedFaqs) {
  faqCountBySite[f.siteId] = (faqCountBySite[f.siteId] ?? 0) + 1;
}

console.log('\n===== 対象サイト・チャットボット一覧 =====');
for (const row of rows) {
  const faqCount = faqCountBySite[row.siteId] ?? 0;
  console.log(`  サイト: ${row.siteName} | チャットボット: ${row.chatbotName} (${row.chatbotType}) | 公開FAQ: ${faqCount}件`);
}

// 3. 各チャットボットに対してシナリオ生成
console.log('\n===== シナリオ生成開始 =====');

let successCount = 0;
let skipCount = 0;

for (const row of rows) {
  const faqCount = faqCountBySite[row.siteId] ?? 0;

  if (faqCount === 0) {
    console.log(`\n⏭️  スキップ: [${row.siteName}] ${row.chatbotName}`);
    console.log(`   理由: 公開済みFAQが0件です`);
    skipCount++;
    continue;
  }

  console.log(`\n🔄 生成中: [${row.siteName}] ${row.chatbotName}`);
  console.log(`   公開FAQ: ${faqCount}件`);

  try {
    const result = await generateFaqScenario({
      chatbotId: row.chatbotId,
      siteId: row.siteId,
      organizationId: row.orgId,
      scenarioName: `FAQ総合案内 - ${row.siteName}`,
      greetingMessage: 'ご質問のカテゴリを選択してください。',
      maxQuestionsPerCategory: 10,
    });

    console.log(`   ✅ 完了!`);
    console.log(`   シナリオID: ${result.scenarioId}`);
    console.log(`   カテゴリ数: ${result.categoryCount} / FAQ数: ${result.faqCount}`);
    console.log(`   ノード数:   ${result.nodeCount} / エッジ数: ${result.edgeCount}`);
    successCount++;
  } catch (err) {
    console.log(`   ❌ エラー: ${err instanceof Error ? err.message : String(err)}`);
  }
}

console.log('\n===== 完了 =====');
console.log(`  成功: ${successCount}件 / スキップ: ${skipCount}件`);
process.exit(0);
