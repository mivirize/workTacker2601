import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { Search, ChevronDown, HelpCircle, MessageCircle, Sparkles, Image as ImageIcon } from 'lucide-react';
import ChatbotWidget from './ChatbotWidget';

interface PageProps {
  params: Promise<{ siteSlug: string }>;
  searchParams: Promise<{ q?: string; category?: string }>;
}

// 管理画面の変更を即座に反映（キャッシュなし）
export const dynamic = 'force-dynamic';

const API_URL = process.env['INTERNAL_API_URL'] ?? 'http://localhost:3001';

type SiteData = {
  siteId: string;
  siteName: string;
  logoUrl?: string;
  themeColor?: string;
};

type Category = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  icon: string | null;
  sortOrder: number;
};

type FaqScreenshot = {
  id: string;
  thumbnailPath: string | null;
  storagePath: string;
};

type FaqItem = {
  id: string;
  question: string;
  answer: string;
  categoryId: string;
  categoryName: string | null;
  categorySlug: string | null;
  categoryIcon: string | null;
  sortOrder: number;
  viewCount: number;
  helpfulCount: number;
  createdAt: string;
  screenshots: FaqScreenshot[];
};

type FaqData = {
  items: FaqItem[];
  total: number;
  categories: Category[];
};

async function getSiteData(slug: string): Promise<SiteData | null> {
  try {
    const res = await fetch(`${API_URL}/api/v1/public/sites/${slug}`, {
      cache: 'no-store',
    });
    if (!res.ok) return null;
    const json = await res.json();
    if (!json.success) return null;
    return json.data as SiteData;
  } catch {
    return null;
  }
}

type ChatbotData = {
  chatbotId: string;
  name: string;
  type: 'scenario' | 'ai' | 'hybrid';
  widgetConfig: {
    position?: 'bottom-right' | 'bottom-left';
    primary_color?: string;
    greeting_message?: string;
    placeholder_text?: string;
  };
};

async function getChatbotData(siteId: string): Promise<ChatbotData | null> {
  try {
    const res = await fetch(`${API_URL}/api/v1/public/sites/${siteId}/chatbot`, {
      cache: 'no-store',
    });
    if (!res.ok) return null;
    const json = await res.json();
    if (!json.success) return null;
    return json.data as ChatbotData;
  } catch {
    return null;
  }
}

async function getFaqData(
  siteId: string,
  query?: string,
  category?: string,
): Promise<FaqData> {
  const params = new URLSearchParams();
  if (query) params.set('q', query);
  if (category) params.set('category', category);
  params.set('limit', '100');

  try {
    const res = await fetch(
      `${API_URL}/api/v1/public/sites/${siteId}/faqs?${params.toString()}`,
      { next: { revalidate: 60 } },
    );
    if (!res.ok) return { items: [], total: 0, categories: [] };
    const json = await res.json();
    if (!json.success) return { items: [], total: 0, categories: [] };
    return json.data as FaqData;
  } catch {
    return { items: [], total: 0, categories: [] };
  }
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { siteSlug } = await params;
  const site = await getSiteData(siteSlug);

  if (!site) {
    return { title: 'FAQ' };
  }

  return {
    title: `${site.siteName} - よくある質問`,
    description: `${site.siteName}のよくある質問（FAQ）ページです。お困りの際はこちらをご確認ください。`,
  };
}

type GroupedCategory = {
  name: string;
  icon: string | null;
  items: FaqItem[];
};

function groupByCategory(items: FaqItem[], categories: Category[]): GroupedCategory[] {
  const catMap = new Map<string, GroupedCategory>();

  for (const cat of categories) {
    catMap.set(cat.id, { name: cat.name, icon: cat.icon, items: [] });
  }

  for (const item of items) {
    const group = catMap.get(item.categoryId);
    if (group) {
      group.items.push(item);
    } else {
      const fallback = catMap.get('__other') ?? { name: 'その他', icon: null, items: [] };
      fallback.items.push(item);
      catMap.set('__other', fallback);
    }
  }

  return Array.from(catMap.values()).filter(g => g.items.length > 0);
}

export default async function FaqPortalPage({ params, searchParams }: PageProps) {
  const { siteSlug } = await params;
  const { q, category } = await searchParams;

  const site = await getSiteData(siteSlug);
  if (!site) notFound();

  const [faqData, chatbot] = await Promise.all([
    getFaqData(site.siteId, q, category),
    getChatbotData(site.siteId),
  ]);
  const grouped = groupByCategory(faqData.items, faqData.categories);
  const activeCategory = category ?? '';

  return (
    <main className="min-h-screen bg-slate-50">
      {/* Hero Section */}
      <header className="hero-gradient relative overflow-hidden border-b border-slate-200/60">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNlMmU4ZjAiIGZpbGwtb3BhY2l0eT0iMC4zIj48cGF0aCBkPSJNMzYgMzRoLTJ2LTRoMnY0em0wLTZoLTJ2LTRoMnY0em0wLTZoLTJ2LTRoMnY0em0wLTZoLTJWNmgydjR6bTAgMThoLTJ2LTRoMnY0em0wIDZoLTJ2LTRoMnY0eiIvPjwvZz48L2c+PC9zdmc+')] opacity-40" />
        <div className="container relative mx-auto max-w-5xl px-4 py-12 sm:py-16">
          <div className="flex items-start gap-4">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 shadow-lg shadow-blue-500/20">
              <HelpCircle className="h-7 w-7 text-white" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium tracking-wide text-blue-600">{site.siteName}</p>
              <h1 className="mt-1 text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
                よくある質問
              </h1>
              <p className="mt-3 max-w-2xl text-base text-slate-600 leading-relaxed">
                お探しの情報が見つからない場合は、キーワードで検索するか、カテゴリから絞り込んでください。
              </p>
            </div>
          </div>

          {/* Search Form */}
          <form method="GET" className="mt-8">
            {category && <input type="hidden" name="category" value={category} />}
            <div className="relative max-w-2xl">
              <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
              <input
                type="search"
                name="q"
                defaultValue={q}
                placeholder="キーワードで質問を検索..."
                className="search-input w-full rounded-2xl border border-slate-200 bg-white/80 py-3.5 pl-12 pr-28 text-base shadow-sm backdrop-blur-sm transition-all focus:border-blue-400 focus:bg-white focus:outline-none"
              />
              <button
                type="submit"
                className="absolute right-2 top-1/2 -translate-y-1/2 rounded-xl bg-gradient-to-r from-blue-500 to-blue-600 px-6 py-2.5 text-sm font-semibold text-white shadow-sm transition-all hover:from-blue-600 hover:to-blue-700 hover:shadow-md active:scale-[0.98]"
              >
                検索
              </button>
            </div>
          </form>
        </div>
      </header>

      <div className="container mx-auto max-w-5xl px-4 py-8 sm:py-10">
        {/* Category Cards */}
        {faqData.categories.length > 0 && (
          <nav className="mb-10 category-scroll overflow-x-auto">
            <div className="flex gap-3 pb-2">
              <a
                href={`/${siteSlug}${q ? `?q=${encodeURIComponent(q)}` : ''}`}
                className={`category-card inline-flex items-center gap-2.5 whitespace-nowrap rounded-xl border px-5 py-3 text-sm font-semibold ${
                  !activeCategory
                    ? 'active border-transparent text-white'
                    : 'border-slate-200 bg-white text-slate-700 shadow-sm hover:border-blue-200'
                }`}
              >
                <span className={`category-icon flex h-8 w-8 items-center justify-center rounded-lg text-base ${
                  !activeCategory ? 'bg-white/20' : 'bg-slate-100'
                }`}>
                  <Sparkles className="h-4 w-4" />
                </span>
                <span>すべて</span>
                <span className={`rounded-full px-2 py-0.5 text-xs font-bold ${
                  !activeCategory ? 'bg-white/20' : 'bg-slate-100 text-slate-500'
                }`}>
                  {faqData.total}
                </span>
              </a>
              {faqData.categories.map((cat) => (
                <a
                  key={cat.id}
                  href={`/${siteSlug}?category=${cat.slug}${q ? `&q=${encodeURIComponent(q)}` : ''}`}
                  className={`category-card inline-flex items-center gap-2.5 whitespace-nowrap rounded-xl border px-5 py-3 text-sm font-semibold ${
                    activeCategory === cat.slug
                      ? 'active border-transparent text-white'
                      : 'border-slate-200 bg-white text-slate-700 shadow-sm hover:border-blue-200'
                  }`}
                >
                  {cat.icon && (
                    <span className={`category-icon flex h-8 w-8 items-center justify-center rounded-lg text-base ${
                      activeCategory === cat.slug ? 'bg-white/20' : 'bg-slate-100'
                    }`}>
                      {cat.icon}
                    </span>
                  )}
                  <span>{cat.name}</span>
                </a>
              ))}
            </div>
          </nav>
        )}

        {/* Search Result Info */}
        {q && (
          <div className="mb-8 flex items-center gap-3 rounded-2xl bg-gradient-to-r from-blue-50 to-indigo-50 p-4 text-sm ring-1 ring-blue-100">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-blue-100">
              <Search className="h-4 w-4 text-blue-600" />
            </div>
            <span className="text-slate-700">
              「<strong className="text-blue-700">{q}</strong>」の検索結果: <strong>{faqData.total}</strong>件
            </span>
            <a
              href={`/${siteSlug}${category ? `?category=${category}` : ''}`}
              className="ml-auto rounded-lg bg-white px-3 py-1.5 text-xs font-medium text-slate-600 shadow-sm ring-1 ring-slate-200 transition-colors hover:bg-slate-50"
            >
              クリア
            </a>
          </div>
        )}

        {/* FAQ List */}
        {faqData.items.length === 0 ? (
          <div className="rounded-2xl border border-slate-200 bg-white p-16 text-center shadow-sm">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-slate-100">
              <MessageCircle className="h-8 w-8 text-slate-400" />
            </div>
            <h2 className="mt-6 text-xl font-bold text-slate-900">
              {q
                ? `「${q}」に一致するFAQが見つかりませんでした`
                : 'FAQが登録されていません'}
            </h2>
            <p className="mt-2 text-sm text-slate-500">
              {q
                ? '別のキーワードで検索するか、カテゴリを変更してみてください。'
                : 'まもなくFAQが追加される予定です。'}
            </p>
          </div>
        ) : activeCategory || q ? (
          /* Flat list when filtering */
          <div className="space-y-3">
            {faqData.items.map((item, i) => (
              <FaqAccordionItem key={item.id} item={item} index={i} />
            ))}
          </div>
        ) : (
          /* Grouped by category when showing all */
          <div className="space-y-12">
            {grouped.map((group, groupIdx) => (
              <section key={group.name} className="animate-fade-in-up" style={{ animationDelay: `${groupIdx * 80}ms` }}>
                <div className="mb-5 flex items-center gap-3">
                  {group.icon && (
                    <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-blue-50 to-indigo-50 text-lg ring-1 ring-blue-100">
                      {group.icon}
                    </span>
                  )}
                  <div>
                    <h2 className="text-lg font-bold text-slate-900">
                      {group.name}
                    </h2>
                  </div>
                  <span className="rounded-full bg-blue-50 px-2.5 py-1 text-xs font-semibold text-blue-600">
                    {group.items.length}件
                  </span>
                  <div className="flex-1">
                    <div className="section-divider ml-4 w-full max-w-[100px]" />
                  </div>
                </div>
                <div className="space-y-3">
                  {group.items.map((item, i) => (
                    <FaqAccordionItem key={item.id} item={item} showCategory={false} index={i} />
                  ))}
                </div>
              </section>
            ))}
          </div>
        )}

        {/* Stats */}
        {faqData.total > 0 && !q && (
          <div className="mt-12 flex items-center justify-center gap-6 text-sm text-slate-400">
            <span>{faqData.total}件のFAQ</span>
            <span className="h-1 w-1 rounded-full bg-slate-300" />
            <span>{faqData.categories.length}カテゴリ</span>
          </div>
        )}
      </div>

      {/* Footer */}
      <footer className="mt-8 border-t border-slate-200/60 bg-white/50 backdrop-blur-sm">
        <div className="container mx-auto max-w-5xl px-4 py-8 text-center">
          <p className="text-xs text-slate-400">
            Powered by{' '}
            <span className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text font-semibold text-transparent">
              FAQAI
            </span>
          </p>
        </div>
      </footer>

      {/* チャットボットウィジェット */}
      {chatbot && <ChatbotWidget chatbot={chatbot} />}
    </main>
  );
}

function FaqAccordionItem({
  item,
  showCategory = true,
  index = 0,
}: {
  item: FaqItem;
  showCategory?: boolean;
  index?: number;
}) {
  return (
    <details
      className="faq-item group rounded-2xl border border-slate-200 bg-white shadow-sm"
      style={{ animationDelay: `${index * 30}ms` }}
    >
      <summary className="flex cursor-pointer items-start gap-4 p-5 sm:p-6">
        <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-blue-500 to-blue-600 text-xs font-bold text-white shadow-sm">
          Q
        </span>
        <span className="flex-1 text-[15px] font-semibold leading-relaxed text-slate-800">
          {item.question}
        </span>
        <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-slate-100 transition-colors group-hover:bg-slate-200">
          <ChevronDown className="chevron-icon h-4 w-4 text-slate-500" />
        </span>
      </summary>
      <div className="answer-content border-t border-slate-100 px-5 pb-5 pt-4 sm:px-6 sm:pb-6">
        <div className="flex gap-4">
          <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-emerald-400 to-emerald-500 text-xs font-bold text-white shadow-sm">
            A
          </span>
          <div className="flex-1 space-y-3">
            <AnswerText text={item.answer} />
            {item.screenshots.length > 0 && (
              <ScreenshotGallery screenshots={item.screenshots} />
            )}
            {showCategory && item.categoryName && (
              <div className="pt-1">
                <span className="inline-flex items-center gap-1.5 rounded-lg bg-slate-50 px-3 py-1.5 text-xs font-medium text-slate-500 ring-1 ring-slate-100">
                  {item.categoryIcon && <span>{item.categoryIcon}</span>}
                  {item.categoryName}
                </span>
              </div>
            )}
          </div>
        </div>
      </div>
    </details>
  );
}

function ScreenshotGallery({ screenshots }: { screenshots: FaqScreenshot[] }) {
  return (
    <div className="pt-2">
      <div className="flex items-center gap-1.5 mb-2">
        <ImageIcon className="h-3.5 w-3.5 text-slate-400" />
        <span className="text-xs font-medium text-slate-400">
          {screenshots.length > 1 ? `${screenshots.length}` : ''}
        </span>
      </div>
      <div className="flex gap-3 overflow-x-auto pb-2 screenshot-scroll">
        {screenshots.map((screenshot) => (
          <a
            key={screenshot.id}
            href={`${API_URL}/api/v1/public/screenshots/${screenshot.id}`}
            target="_blank"
            rel="noopener noreferrer"
            className="group/thumb shrink-0"
          >
            <div className="relative h-24 w-40 overflow-hidden rounded-lg border border-slate-200 bg-slate-50 shadow-sm transition-all group-hover/thumb:border-blue-300 group-hover/thumb:shadow-md sm:h-28 sm:w-48">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={`${API_URL}/api/v1/public/screenshots/${screenshot.id}`}
                alt=""
                loading="lazy"
                className="h-full w-full object-cover object-top transition-transform group-hover/thumb:scale-105"
              />
            </div>
          </a>
        ))}
      </div>
    </div>
  );
}

function AnswerText({ text }: { text: string }) {
  // 既に改行がある場合はそのまま段落分割
  if (text.includes('\n')) {
    const paragraphs = text.split(/\n+/).filter(Boolean);
    return (
      <div className="space-y-3">
        {paragraphs.map((p, i) => (
          <p key={i} className="text-[15px] leading-[1.9] text-slate-600 tracking-wide">
            {p}
          </p>
        ))}
      </div>
    );
  }

  // 改行がない長文の場合、句点で段落を分割
  const sentences = text.split(/(?<=。)/).filter(s => s.trim().length > 0);

  if (sentences.length <= 2) {
    return (
      <p className="text-[15px] leading-[1.9] text-slate-600 tracking-wide">
        {text}
      </p>
    );
  }

  // 2〜3文ずつグループ化して段落にする
  const paragraphs: string[] = [];
  let current = '';
  let count = 0;
  for (const sentence of sentences) {
    current += sentence;
    count++;
    if (count >= 2) {
      paragraphs.push(current.trim());
      current = '';
      count = 0;
    }
  }
  if (current.trim()) {
    paragraphs.push(current.trim());
  }

  return (
    <div className="space-y-3">
      {paragraphs.map((p, i) => (
        <p key={i} className="text-[15px] leading-[1.9] text-slate-600 tracking-wide">
          {p}
        </p>
      ))}
    </div>
  );
}
