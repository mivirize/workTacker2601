'use client';

import { useEffect, useRef } from 'react';
import {
  CheckCircle2,
  XCircle,
  Loader2,
  Clock,
  FileText,
  MessageSquare,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Spinner } from '@/components/ui/spinner';
import { useSitesStore } from '@/stores/sites-store';
import type { CrawlJobRecord } from '@/lib/api-client';

function formatDate(iso: string) {
  return new Date(iso).toLocaleString('ja-JP', {
    month: 'numeric',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function JobStatusBadge({ status }: { status: CrawlJobRecord['status'] }) {
  const config = {
    pending: { label: '待機中', variant: 'outline' as const, Icon: Clock },
    running: { label: '実行中', variant: 'warning' as const, Icon: Loader2 },
    completed: { label: '完了', variant: 'success' as const, Icon: CheckCircle2 },
    failed: { label: '失敗', variant: 'destructive' as const, Icon: XCircle },
  }[status];

  return (
    <Badge variant={config.variant} className="flex items-center gap-1">
      <config.Icon className={`h-3 w-3 ${status === 'running' ? 'animate-spin' : ''}`} />
      {config.label}
    </Badge>
  );
}

interface CrawlJobsPanelProps {
  siteId: string;
}

export function CrawlJobsPanel({ siteId }: CrawlJobsPanelProps) {
  const jobs = useSitesStore((s) => s.crawlJobs[siteId]) ?? [];
  const loading = useSitesStore((s) => s.crawlJobsLoading[siteId]) ?? false;
  const fetchCrawlJobs = useSitesStore((s) => s.fetchCrawlJobs);
  const fetchCrawlJobsRef = useRef(fetchCrawlJobs);
  fetchCrawlJobsRef.current = fetchCrawlJobs;

  useEffect(() => {
    fetchCrawlJobsRef.current(siteId);
  }, [siteId]);

  if (loading) {
    return (
      <div className="flex justify-center py-6">
        <Spinner size="md" />
      </div>
    );
  }

  if (jobs.length === 0) {
    return (
      <p className="text-sm text-muted-foreground text-center py-4">
        クロールジョブがまだありません
      </p>
    );
  }

  return (
    <div className="space-y-2">
      {jobs.map((job) => (
        <div
          key={job.id}
          className="flex items-start justify-between rounded-md border p-3 text-sm"
        >
          <div className="space-y-1">
            <JobStatusBadge status={job.status} />
            <div className="flex items-center gap-3 text-xs text-muted-foreground mt-1">
              {job.crawledPages != null && (
                <span className="flex items-center gap-1">
                  <FileText className="h-3 w-3" />
                  {job.crawledPages}
                  {job.totalPages != null ? `/${job.totalPages}` : ''} ページ
                </span>
              )}
              {job.faqGenerated != null && job.faqGenerated > 0 && (
                <span className="flex items-center gap-1">
                  <MessageSquare className="h-3 w-3" />
                  FAQ {job.faqGenerated}件生成
                </span>
              )}
            </div>
          </div>
          <div className="text-xs text-muted-foreground text-right shrink-0">
            <p>{formatDate(job.createdAt)}</p>
            {job.completedAt && (
              <p className="text-green-600">完了: {formatDate(job.completedAt)}</p>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
