'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  Globe,
  Plus,
  Play,
  Trash2,
  ChevronDown,
  ChevronRight,
  RefreshCw,
  Calendar,
} from 'lucide-react';
import { toast } from 'sonner';
import { PageHeader } from '@/components/layout/page-header';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Spinner } from '@/components/ui/spinner';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { AddSiteDialog } from '@/components/sites/add-site-dialog';
import { CrawlJobsPanel } from '@/components/sites/crawl-jobs-panel';
import { useSitesStore } from '@/stores/sites-store';
import { ApiError, type SiteRecord } from '@/lib/api-client';

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

function SiteCard({ site }: { site: SiteRecord }) {
  const [expanded, setExpanded] = useState(false);
  const [crawling, setCrawling] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const startCrawl = useSitesStore((s) => s.startCrawl);
  const removeSite = useSitesStore((s) => s.removeSite);
  const fetchCrawlJobs = useSitesStore((s) => s.fetchCrawlJobs);

  const handleCrawl = async () => {
    setCrawling(true);
    try {
      await startCrawl(site.id);
      toast.success('クロールジョブを開始しました');
      setExpanded(true);
      // ジョブ一覧を少し待ってから更新
      setTimeout(() => fetchCrawlJobs(site.id), 1000);
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : 'クロール開始に失敗しました');
    } finally {
      setCrawling(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm(`「${site.name}」を削除しますか？\nこの操作は元に戻せません。`)) return;
    setDeleting(true);
    try {
      await removeSite(site.id);
      toast.success(`「${site.name}」を削除しました`);
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : '削除に失敗しました');
      setDeleting(false);
    }
  };

  return (
    <Card className="overflow-hidden">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0 flex-1">
            <CardTitle className="text-base flex items-center gap-2">
              <Globe className="h-4 w-4 text-muted-foreground shrink-0" />
              <Link
                href={`/sites/${site.id}`}
                className="truncate hover:underline hover:text-primary transition-colors"
              >
                {site.name}
              </Link>
            </CardTitle>
            <CardDescription className="mt-1 truncate">
              <a
                href={site.url}
                target="_blank"
                rel="noopener noreferrer"
                className="hover:underline text-blue-500"
              >
                {site.url}
              </a>
            </CardDescription>
          </div>
          <div className="flex items-center gap-1 shrink-0">
            <Button
              size="sm"
              variant="outline"
              onClick={handleCrawl}
              disabled={crawling}
              title="クロール開始"
            >
              {crawling ? (
                <Spinner size="sm" />
              ) : (
                <Play className="h-4 w-4" />
              )}
              <span className="hidden sm:inline ml-1">クロール</span>
            </Button>
            <Button
              size="icon"
              variant="ghost"
              onClick={handleDelete}
              disabled={deleting}
              title="削除"
              className="text-destructive hover:text-destructive"
            >
              {deleting ? <Spinner size="sm" /> : <Trash2 className="h-4 w-4" />}
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="pt-0">
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground mb-3">
          <span className="flex items-center gap-1">
            <RefreshCw className="h-3 w-3" />
            最大{site.crawlConfig.max_pages}ページ / 深度{site.crawlConfig.max_depth}
          </span>
          <span className="flex items-center gap-1">
            <Calendar className="h-3 w-3" />
            最終クロール: {formatDate(site.lastCrawledAt)}
          </span>
          {site.isVerified && (
            <Badge variant="success" className="text-xs">認証済み</Badge>
          )}
        </div>

        {/* クロールジョブ展開 */}
        <button
          className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
          onClick={() => setExpanded((v) => !v)}
        >
          {expanded ? (
            <ChevronDown className="h-3 w-3" />
          ) : (
            <ChevronRight className="h-3 w-3" />
          )}
          クロール履歴を{expanded ? '閉じる' : '表示'}
        </button>

        {expanded && (
          <div className="mt-3 border-t pt-3">
            <CrawlJobsPanel siteId={site.id} />
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default function SitesPage() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const sites = useSitesStore((s) => s.sites);
  const isLoading = useSitesStore((s) => s.isLoading);
  const error = useSitesStore((s) => s.error);
  const fetchSites = useSitesStore((s) => s.fetchSites);

  useEffect(() => {
    fetchSites();
  }, [fetchSites]);

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title="サイト管理"
        description="クロール対象サイトの管理とFAQ自動生成"
        actions={
          <Button onClick={() => setDialogOpen(true)}>
            <Plus className="h-4 w-4" />
            サイトを追加
          </Button>
        }
      />

      {isLoading && (
        <div className="flex justify-center py-12">
          <Spinner size="lg" />
        </div>
      )}

      {error && (
        <div className="rounded-md border border-destructive/20 bg-destructive/5 p-4 text-sm text-destructive">
          {error}
          <Button variant="ghost" size="sm" onClick={fetchSites} className="ml-2">
            再試行
          </Button>
        </div>
      )}

      {!isLoading && !error && sites.length === 0 && (
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed py-16 text-center">
          <Globe className="h-12 w-12 text-muted-foreground/40 mb-4" />
          <p className="text-sm font-medium">サイトがまだありません</p>
          <p className="text-xs text-muted-foreground mt-1">
            「サイトを追加」からクロール対象のURLを登録してください
          </p>
          <Button className="mt-4" onClick={() => setDialogOpen(true)}>
            <Plus className="h-4 w-4" />
            最初のサイトを追加
          </Button>
        </div>
      )}

      {!isLoading && sites.length > 0 && (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {sites.map((site) => (
            <SiteCard key={site.id} site={site} />
          ))}
        </div>
      )}

      <AddSiteDialog open={dialogOpen} onClose={() => setDialogOpen(false)} />
    </div>
  );
}
