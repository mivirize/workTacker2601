/**
 * FAQ Fact-Check Workflow
 *
 * Compares generated FAQs stored in the system against actual FAQs on the live site.
 * Outputs a diff report highlighting:
 *   - Generated FAQs that match actual site FAQs
 *   - Generated FAQs that have NO match (hallucinated / fabricated)
 *   - Actual site FAQs missing from generated set (coverage gaps)
 *   - Duplicate generated FAQs
 *
 * Usage:
 *   npx tsx scripts/faq-factcheck.ts <siteId> <faqPageUrl>
 *
 * Example:
 *   npx tsx scripts/faq-factcheck.ts bc0f3c96-... https://gdirect.jp/store/faq
 */

// ---------------------------------------------------------------------------
// Config
// ---------------------------------------------------------------------------

const API_BASE = process.env.API_BASE_URL || 'http://localhost:3001';
const LOGIN_EMAIL = process.env.LOGIN_EMAIL || 'e2e@faqai.test';
const LOGIN_PASSWORD = process.env.LOGIN_PASSWORD || 'E2ETest123';
const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

async function login(): Promise<string> {
  const res = await fetch(`${API_BASE}/api/v1/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: LOGIN_EMAIL, password: LOGIN_PASSWORD }),
  });
  const json = await res.json();
  if (!json.success) throw new Error(`Login failed: ${json.error?.message}`);
  return json.data.tokens.accessToken;
}

interface FaqItem {
  id: string;
  question: string;
  answer: string;
  status: string;
}

async function fetchGeneratedFaqs(
  token: string,
  siteId: string,
): Promise<FaqItem[]> {
  const allItems: FaqItem[] = [];
  let offset = 0;
  const limit = 100;

  while (true) {
    const res = await fetch(
      `${API_BASE}/api/v1/faqs?siteId=${siteId}&limit=${limit}&offset=${offset}`,
      { headers: { Authorization: `Bearer ${token}` } },
    );
    const json = await res.json();
    if (!json.success) throw new Error(`Fetch FAQs failed: ${json.error?.message}`);

    const items: FaqItem[] = json.data.items;
    allItems.push(...items);
    if (items.length < limit) break;
    offset += limit;
  }

  return allItems;
}

async function fetchActualFaqsViaClaude(faqPageUrl: string): Promise<string[]> {
  if (!ANTHROPIC_API_KEY) {
    console.error(
      'ANTHROPIC_API_KEY is not set. Skipping live site FAQ extraction.',
    );
    console.error(
      'Set it via: export ANTHROPIC_API_KEY=sk-ant-...',
    );
    return [];
  }

  const { default: Anthropic } = await import('@anthropic-ai/sdk');
  const anthropic = new Anthropic({ apiKey: ANTHROPIC_API_KEY });

  const response = await anthropic.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 4096,
    messages: [
      {
        role: 'user',
        content: `You are an FAQ extraction assistant.
Visit the following FAQ page URL and extract ALL FAQ questions from it.
If the page has categories with sub-pages, list ALL questions from ALL categories.

URL: ${faqPageUrl}

Instructions:
1. Return ONLY the Japanese question text, one per line
2. Do NOT translate or add explanations
3. Do NOT number the questions
4. Include questions from ALL categories/sub-pages if applicable
5. Return the questions exactly as they appear on the site

If you cannot access the URL, return "ERROR: Cannot access URL"`,
      },
    ],
  });

  const text =
    response.content[0].type === 'text' ? response.content[0].text : '';
  if (text.startsWith('ERROR:')) {
    console.error(text);
    return [];
  }

  return text
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line.length > 0 && !line.startsWith('#'));
}

function normalize(q: string): string {
  return q
    .replace(/[？?！!。、・\s]+/g, '')
    .replace(/（.*?）/g, '')
    .replace(/\(.*?\)/g, '')
    .toLowerCase();
}

function findSimilar(
  needle: string,
  haystack: string[],
  threshold = 0.5,
): { match: string; score: number } | null {
  const normNeedle = normalize(needle);
  let bestMatch = '';
  let bestScore = 0;

  for (const h of haystack) {
    const normH = normalize(h);

    // Exact match
    if (normNeedle === normH) return { match: h, score: 1.0 };

    // Containment check
    if (normNeedle.includes(normH) || normH.includes(normNeedle)) {
      const score =
        Math.min(normNeedle.length, normH.length) /
        Math.max(normNeedle.length, normH.length);
      if (score > bestScore) {
        bestScore = score;
        bestMatch = h;
      }
    }

    // Bigram similarity
    const bigramScore = bigramSimilarity(normNeedle, normH);
    if (bigramScore > bestScore) {
      bestScore = bigramScore;
      bestMatch = h;
    }
  }

  return bestScore >= threshold ? { match: bestMatch, score: bestScore } : null;
}

function bigramSimilarity(a: string, b: string): number {
  if (a.length < 2 || b.length < 2) return 0;
  const bigramsA = new Set<string>();
  const bigramsB = new Set<string>();
  for (let i = 0; i < a.length - 1; i++) bigramsA.add(a.slice(i, i + 2));
  for (let i = 0; i < b.length - 1; i++) bigramsB.add(b.slice(i, i + 2));

  let intersection = 0;
  for (const bg of bigramsA) {
    if (bigramsB.has(bg)) intersection++;
  }
  return (2 * intersection) / (bigramsA.size + bigramsB.size);
}

// ---------------------------------------------------------------------------
// Report
// ---------------------------------------------------------------------------

interface FactCheckReport {
  siteId: string;
  faqPageUrl: string;
  timestamp: string;
  generatedCount: number;
  actualCount: number;
  duplicateCount: number;
  matched: Array<{ generated: string; actual: string; score: number }>;
  hallucinated: string[];
  missing: string[];
  duplicates: string[];
  matchRate: number;
  coverageRate: number;
  hallucinationRate: number;
}

function detectDuplicates(faqs: FaqItem[]): {
  unique: FaqItem[];
  dupes: string[];
} {
  const seen = new Map<string, FaqItem>();
  const dupes: string[] = [];

  for (const faq of faqs) {
    const key = normalize(faq.question);
    if (seen.has(key)) {
      dupes.push(faq.question);
    } else {
      seen.set(key, faq);
    }
  }

  return { unique: Array.from(seen.values()), dupes };
}

function generateReport(
  siteId: string,
  faqPageUrl: string,
  generated: FaqItem[],
  actualQuestions: string[],
): FactCheckReport {
  const { unique, dupes } = detectDuplicates(generated);
  const generatedQuestions = unique.map((f) => f.question);

  const matched: FactCheckReport['matched'] = [];
  const hallucinated: string[] = [];
  const matchedActuals = new Set<string>();

  for (const gq of generatedQuestions) {
    const result = findSimilar(gq, actualQuestions);
    if (result) {
      matched.push({ generated: gq, actual: result.match, score: result.score });
      matchedActuals.add(result.match);
    } else {
      hallucinated.push(gq);
    }
  }

  const missing = actualQuestions.filter((aq) => !matchedActuals.has(aq));

  const matchRate =
    generatedQuestions.length > 0
      ? matched.length / generatedQuestions.length
      : 0;
  const coverageRate =
    actualQuestions.length > 0
      ? matched.length / actualQuestions.length
      : 0;
  const hallucinationRate =
    generatedQuestions.length > 0
      ? hallucinated.length / generatedQuestions.length
      : 0;

  return {
    siteId,
    faqPageUrl,
    timestamp: new Date().toISOString(),
    generatedCount: generated.length,
    actualCount: actualQuestions.length,
    duplicateCount: dupes.length,
    matched,
    hallucinated,
    missing,
    duplicates: dupes,
    matchRate,
    coverageRate,
    hallucinationRate,
  };
}

function printReport(report: FactCheckReport): void {
  const pct = (n: number) => `${(n * 100).toFixed(1)}%`;

  console.log('\n' + '='.repeat(70));
  console.log(`  FAQ Fact-Check Report`);
  console.log('='.repeat(70));
  console.log(`  Site ID:        ${report.siteId}`);
  console.log(`  FAQ Page:       ${report.faqPageUrl}`);
  console.log(`  Timestamp:      ${report.timestamp}`);
  console.log('-'.repeat(70));
  console.log(`  Generated FAQs: ${report.generatedCount} (${report.generatedCount - report.duplicateCount} unique, ${report.duplicateCount} duplicates)`);
  console.log(`  Actual FAQs:    ${report.actualCount}`);
  console.log('-'.repeat(70));
  console.log(`  Match Rate:          ${pct(report.matchRate)} (${report.matched.length}/${report.generatedCount - report.duplicateCount})`);
  console.log(`  Coverage Rate:       ${pct(report.coverageRate)} (${report.matched.length}/${report.actualCount})`);
  console.log(`  Hallucination Rate:  ${pct(report.hallucinationRate)} (${report.hallucinated.length}/${report.generatedCount - report.duplicateCount})`);

  if (report.duplicates.length > 0) {
    console.log('\n--- Duplicates ---');
    report.duplicates.forEach((d) => console.log(`  [DUP] ${d}`));
  }

  if (report.hallucinated.length > 0) {
    console.log('\n--- Hallucinated (generated but NOT on actual site) ---');
    report.hallucinated.forEach((h) =>
      console.log(`  [HALLUCINATED] ${h}`),
    );
  }

  if (report.missing.length > 0) {
    console.log('\n--- Missing (on actual site but NOT generated) ---');
    report.missing.forEach((m) => console.log(`  [MISSING] ${m}`));
  }

  if (report.matched.length > 0) {
    console.log('\n--- Matched ---');
    report.matched.forEach((m) =>
      console.log(
        `  [OK ${(m.score * 100).toFixed(0)}%] ${m.generated}\n        -> ${m.actual}`,
      ),
    );
  }

  console.log('\n' + '='.repeat(70));

  // Summary verdict
  if (report.hallucinationRate > 0.3) {
    console.log('  VERDICT: HIGH HALLUCINATION RISK - Manual review required');
  } else if (report.hallucinationRate > 0.1) {
    console.log('  VERDICT: MODERATE - Some generated FAQs need verification');
  } else {
    console.log('  VERDICT: GOOD - Generated FAQs largely match actual site');
  }

  if (report.coverageRate < 0.5) {
    console.log('  WARNING: Low coverage - many actual FAQs are missing from generated set');
  }

  if (report.duplicateCount > report.generatedCount * 0.2) {
    console.log('  WARNING: High duplicate rate - FAQ generation may have issues');
  }

  console.log('='.repeat(70) + '\n');
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function loadActualFromFile(filePath: string): Promise<string[]> {
  const fs = await import('fs');
  const content = fs.readFileSync(filePath, 'utf-8');
  return content
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line.length > 0 && !line.startsWith('#'));
}

function parseArgs(args: string[]) {
  const parsed: { siteId?: string; faqPageUrl?: string; actualFile?: string } = {};
  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--actual-file' && args[i + 1]) {
      parsed.actualFile = args[++i];
    } else if (!parsed.siteId) {
      parsed.siteId = args[i];
    } else if (!parsed.faqPageUrl) {
      parsed.faqPageUrl = args[i];
    }
  }
  return parsed;
}

async function main() {
  const { siteId, faqPageUrl, actualFile } = parseArgs(process.argv.slice(2));

  if (!siteId) {
    console.error('Usage:');
    console.error('  npx tsx scripts/faq-factcheck.ts <siteId> <faqPageUrl>');
    console.error('  npx tsx scripts/faq-factcheck.ts <siteId> <faqPageUrl> --actual-file <path>');
    console.error('');
    console.error('Options:');
    console.error('  --actual-file  Path to text file with actual FAQ questions (one per line)');
    console.error('');
    console.error('Environment:');
    console.error('  ANTHROPIC_API_KEY  Required for automatic FAQ extraction from live site');
    console.error('  API_BASE_URL       API server URL (default: http://localhost:3001)');
    console.error('  LOGIN_EMAIL        Login email (default: e2e@faqai.test)');
    console.error('  LOGIN_PASSWORD     Login password (default: E2ETest123)');
    process.exit(1);
  }

  console.log('Logging in...');
  const token = await login();

  console.log('Fetching generated FAQs...');
  const generated = await fetchGeneratedFaqs(token, siteId);
  console.log(`  Found ${generated.length} generated FAQs`);

  let actualQuestions: string[] = [];

  if (actualFile) {
    console.log(`Loading actual FAQs from file: ${actualFile}`);
    actualQuestions = await loadActualFromFile(actualFile);
    console.log(`  Found ${actualQuestions.length} actual FAQs`);
  } else if (faqPageUrl) {
    console.log('Fetching actual FAQs from live site via Claude...');
    actualQuestions = await fetchActualFaqsViaClaude(faqPageUrl);
    console.log(`  Found ${actualQuestions.length} actual FAQs`);
  }

  if (actualQuestions.length === 0) {
    console.log('\nNo actual FAQs found. Provide them via --actual-file or set ANTHROPIC_API_KEY.');
  }

  const report = generateReport(siteId, faqPageUrl || 'N/A', generated, actualQuestions);
  printReport(report);

  // Output JSON report
  const reportPath = `scripts/factcheck-${siteId.slice(0, 8)}-${Date.now()}.json`;
  const fs = await import('fs');
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
  console.log(`Report saved to: ${reportPath}`);
}

main().catch((err) => {
  console.error('Fatal error:', err);
  process.exit(1);
});
