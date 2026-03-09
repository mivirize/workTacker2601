'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  Globe,
  ExternalLink,
  Eye,
  Play,
  FileQuestion,
  Edit3,
  Check,
  X,
  Info,
  StickyNote,
  Bot,
  Link2,
} from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Spinner } from '@/components/ui/spinner';
import { useSiteContextStore } from '@/stores/site-context-store';
import { useSitesStore } from '@/stores/sites-store';
import { ApiError } from '@/lib/api-client';

function formatDate(iso: string | null) {
  if (!iso) return 'なし';
  return new Date(iso).toLocaleString('ja-JP', {
    year: 'numeric',
    month: 'numeric',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function InlineTextField({
  label,
  icon: Icon,
  value,
  placeholder,
  multiline,
  onSave,
}: {
  label: string;
  icon: React.ElementType;
  value: string | null;
  placeholder: string;
  multiline?: boolean;
  onSave: (value: string | null) => Promise<void>;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value ?? '');
  const [saving, setSaving] = useState(false);

  const handleEdit = () => {
    setDraft(value ?? '');
    setEditing(true);
  };

  const handleCancel = () => {
    setEditing(false);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await onSave(draft.trim() || null);
      setEditing(false);
      toast.success(`${label}を更新しました`);
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : '更新に失敗しました');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
          <Icon className="h-4 w-4" />
          {label}
        </div>
        {!editing && (
          <Button variant="ghost" size="sm" onClick={handleEdit} className="h-7 px-2">
            <Edit3 className="h-3 w-3" />
          </Button>
        )}
      </div>

      {editing ? (
        <div className="space-y-2">
          {multiline ? (
            <textarea
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              placeholder={placeholder}
              rows={4}
              className="w-full rounded-md border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 resize-y"
              autoFocus
            />
          ) : (
            <input
              type="text"
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              placeholder={placeholder}
              className="w-full rounded-md border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
              autoFocus
            />
          )}
          <div className="flex items-center gap-1">
            <Button size="sm" onClick={handleSave} disabled={saving} className="h-7 px-3">
              {saving ? <Spinner size="sm" /> : <Check className="h-3 w-3 mr-1" />}
              保存
            </Button>
            <Button size="sm" variant="ghost" onClick={handleCancel} disabled={saving} className="h-7 px-3">
              <X className="h-3 w-3 mr-1" />
              キャンセル
            </Button>
          </div>
        </div>
      ) : (
        <p className={`text-sm ${value ? 'text-foreground' : 'text-muted-foreground/60 italic'}`}>
          {value || placeholder}
        </p>
      )}
    </div>
  );
}

const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const FAQ_PORTAL_BASE_URL = process.env.NEXT_PUBLIC_FAQ_PORTAL_URL || 'http://localhost:3002';

function SlugEditor({ siteId, currentSlug }: { siteId: string; currentSlug: string }) {
  const updateSlug = useSiteContextStore((s) => s.updateSlug);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(currentSlug);
  const [saving, setSaving] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);

  const handleEdit = () => {
    setDraft(currentSlug);
    setValidationError(null);
    setEditing(true);
  };

  const handleCancel = () => {
    setEditing(false);
    setValidationError(null);
  };

  const handleChange = (value: string) => {
    const normalized = value.toLowerCase().replace(/\s+/g, '-');
    setDraft(normalized);

    if (!normalized) {
      setValidationError('スラッグは必須です');
    } else if (!SLUG_PATTERN.test(normalized)) {
      setValidationError('小文字英数字とハイフンのみ使用できます（例: my-site）');
    } else {
      setValidationError(null);
    }
  };

  const handleSave = async () => {
    if (!draft || !SLUG_PATTERN.test(draft)) return;
    if (draft === currentSlug) {
      setEditing(false);
      return;
    }

    setSaving(true);
    try {
      await updateSlug(siteId, draft);
      setEditing(false);
      toast.success('スラッグを更新しました');
    } catch (err) {
      if (err instanceof ApiError && err.code === 'SLUG_CONFLICT') {
        setValidationError('このスラッグは既に使用されています');
      } else {
        toast.error(err instanceof ApiError ? err.message : 'スラッグの更新に失敗しました');
      }
    } finally {
      setSaving(false);
    }
  };

  const displaySlug = editing ? draft : currentSlug;

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <Link2 className="h-4 w-4" />
            FAQページURL
          </CardTitle>
          {!editing && (
            <Button variant="ghost" size="sm" onClick={handleEdit} className="h-7 px-2">
              <Edit3 className="h-3 w-3" />
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {editing ? (
          <div className="space-y-3">
            <div className="space-y-1">
              <label className="text-xs text-muted-foreground">スラッグ</label>
              <Input
                value={draft}
                onChange={(e) => handleChange(e.target.value)}
                placeholder="my-site-slug"
                autoFocus
              />
              {validationError && (
                <p className="text-xs text-destructive">{validationError}</p>
              )}
            </div>
            <div className="rounded-md bg-muted px-3 py-2">
              <span className="text-xs text-muted-foreground">プレビュー: </span>
              <span className="text-sm font-mono">
                {FAQ_PORTAL_BASE_URL}/{displaySlug || '...'}
              </span>
            </div>
            <div className="flex items-center gap-1">
              <Button
                size="sm"
                onClick={handleSave}
                disabled={saving || !!validationError || !draft}
                className="h-7 px-3"
              >
                {saving ? <Spinner size="sm" /> : <Check className="h-3 w-3 mr-1" />}
                保存
              </Button>
              <Button size="sm" variant="ghost" onClick={handleCancel} disabled={saving} className="h-7 px-3">
                <X className="h-3 w-3 mr-1" />
                キャンセル
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-2">
            <div className="rounded-md bg-muted px-3 py-2">
              <a
                href={`${FAQ_PORTAL_BASE_URL}/${currentSlug}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm font-mono text-blue-500 hover:underline inline-flex items-center gap-1"
              >
                {FAQ_PORTAL_BASE_URL}/{currentSlug}
                <ExternalLink className="h-3 w-3" />
              </a>
            </div>
            <p className="text-xs text-muted-foreground">
              スラッグ: <code className="bg-muted px-1 py-0.5 rounded">{currentSlug}</code>
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default function SiteOverviewPage() {
  const currentSite = useSiteContextStore((s) => s.currentSite);
  const updateSite = useSiteContextStore((s) => s.updateSite);
  const startCrawl = useSitesStore((s) => s.startCrawl);
  const [crawling, setCrawling] = useState(false);

  if (!currentSite) {
    return (
      <div className="flex items-center justify-center py-12">
        <Spinner size="lg" />
      </div>
    );
  }

  const handleCrawl = async () => {
    setCrawling(true);
    try {
      await startCrawl(currentSite.id);
      toast.success('クロールジョブを開始しました');
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : 'クロール開始に失敗しました');
    } finally {
      setCrawling(false);
    }
  };

  const handleFieldSave = (field: string) => async (value: string | null) => {
    await updateSite(currentSite.id, { [field]: value });
  };

  return (
    <div className="space-y-6">
      {/* Site info + quick actions */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="md:col-span-2">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">サイト情報</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <span className="text-xs text-muted-foreground">URL</span>
                <a
                  href={currentSite.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 text-sm text-blue-500 hover:underline"
                >
                  {currentSite.url}
                  <ExternalLink className="h-3 w-3" />
                </a>
              </div>
              <div>
                <span className="text-xs text-muted-foreground">ドメイン</span>
                <p className="text-sm">{currentSite.domain}</p>
              </div>
              <div>
                <span className="text-xs text-muted-foreground">最終クロール</span>
                <p className="text-sm">{formatDate(currentSite.lastCrawledAt)}</p>
              </div>
              <div>
                <span className="text-xs text-muted-foreground">ステータス</span>
                <div className="flex items-center gap-2">
                  {currentSite.isVerified ? (
                    <Badge variant="success">認証済み</Badge>
                  ) : (
                    <Badge variant="outline">未認証</Badge>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">クイックアクション</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <Button
              variant="outline"
              size="sm"
              className="w-full justify-start"
              onClick={handleCrawl}
              disabled={crawling}
            >
              {crawling ? <Spinner size="sm" /> : <Play className="h-4 w-4 mr-2" />}
              クロール開始
            </Button>
            <Link
              href={`/sites/${currentSite.id}/faqs`}
              className="flex items-center gap-2 w-full rounded-md border px-3 py-2 text-sm hover:bg-accent transition-colors"
            >
              <FileQuestion className="h-4 w-4" />
              FAQ管理
            </Link>
            <a
              href={`${process.env.NEXT_PUBLIC_FAQ_PORTAL_URL || 'http://localhost:3002'}/${currentSite.slug}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 w-full rounded-md border px-3 py-2 text-sm hover:bg-accent transition-colors"
            >
              <Eye className="h-4 w-4" />
              FAQページを表示
              <ExternalLink className="h-3 w-3 ml-auto text-muted-foreground" />
            </a>
            {currentSite.domain && (
              <a
                href={currentSite.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 w-full rounded-md border px-3 py-2 text-sm hover:bg-accent transition-colors"
              >
                <Globe className="h-4 w-4" />
                サイトを開く
              </a>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Slug management */}
      <SlugEditor siteId={currentSite.id} currentSlug={currentSite.slug} />

      {/* Context fields */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">サイトコンテキスト</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <InlineTextField
            label="説明"
            icon={Info}
            value={currentSite.description}
            placeholder="サイトの概要を入力..."
            multiline
            onSave={handleFieldSave('description')}
          />

          <InlineTextField
            label="ノート"
            icon={StickyNote}
            value={currentSite.notes}
            placeholder="メモや注意事項を入力..."
            multiline
            onSave={handleFieldSave('notes')}
          />

          <InlineTextField
            label="AI向け指示"
            icon={Bot}
            value={currentSite.aiContext}
            placeholder="FAQ生成時のAI向け指示やコンテキストを入力..."
            multiline
            onSave={handleFieldSave('aiContext')}
          />
        </CardContent>
      </Card>

      {/* Crawl config summary */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">クロール設定</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-4 text-sm">
            <div>
              <span className="text-xs text-muted-foreground">最大ページ数</span>
              <p className="font-medium">{currentSite.crawlConfig.max_pages}</p>
            </div>
            <div>
              <span className="text-xs text-muted-foreground">最大深度</span>
              <p className="font-medium">{currentSite.crawlConfig.max_depth}</p>
            </div>
            <div>
              <span className="text-xs text-muted-foreground">レート制限</span>
              <p className="font-medium">{currentSite.crawlConfig.rate_limit_ms}ms</p>
            </div>
            <div>
              <span className="text-xs text-muted-foreground">robots.txt</span>
              <p className="font-medium">
                {currentSite.crawlConfig.respect_robots_txt ? '遵守' : '無視'}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
