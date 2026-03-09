'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import {
  Bot,
  Plus,
  Trash2,
  Power,
  PowerOff,
} from 'lucide-react';
import { toast } from 'sonner';
import { PageHeader } from '@/components/layout/page-header';
import { Button, buttonVariants } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Spinner } from '@/components/ui/spinner';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import {
  ApiError,
  chatbotApi,
  siteApi,
  type ChatbotRecord,
  type SiteRecord,
} from '@/lib/api-client';

const TYPE_LABELS: Record<ChatbotRecord['type'], string> = {
  ai: 'AI',
  scenario: 'シナリオ',
  hybrid: 'ハイブリッド',
};

const TYPE_COLORS: Record<ChatbotRecord['type'], string> = {
  ai: '#8b5cf6',
  scenario: '#3b82f6',
  hybrid: '#f97316',
};

function ChatbotCard({
  chatbot,
  siteName,
  onToggle,
  onDeleted,
}: {
  chatbot: ChatbotRecord;
  siteName: string;
  onToggle: () => void;
  onDeleted: () => void;
}) {
  const [toggling, setToggling] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const handleToggle = async () => {
    setToggling(true);
    try {
      await chatbotApi.update(chatbot.id, { isActive: !chatbot.isActive });
      toast.success(
        chatbot.isActive ? 'チャットボットを無効にしました' : 'チャットボットを有効にしました',
      );
      onToggle();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : '更新に失敗しました');
    } finally {
      setToggling(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm(`「${chatbot.name}」を削除しますか？\nこの操作は元に戻せません。`)) return;
    setDeleting(true);
    try {
      await chatbotApi.remove(chatbot.id);
      toast.success(`「${chatbot.name}」を削除しました`);
      onDeleted();
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
              <Bot className="h-4 w-4 text-muted-foreground shrink-0" />
              <Link
                href={`/sites/${chatbot.siteId}/chatbots/${chatbot.id}`}
                className="truncate hover:underline hover:text-primary transition-colors"
              >
                {chatbot.name}
              </Link>
            </CardTitle>
            <CardDescription className="mt-1 truncate">
              {siteName}
            </CardDescription>
          </div>
          <div className="flex items-center gap-1 shrink-0">
            <Button
              size="sm"
              variant="outline"
              onClick={handleToggle}
              disabled={toggling}
              title={chatbot.isActive ? '無効にする' : '有効にする'}
            >
              {toggling ? (
                <Spinner size="sm" />
              ) : chatbot.isActive ? (
                <Power className="h-4 w-4 text-green-600" />
              ) : (
                <PowerOff className="h-4 w-4 text-muted-foreground" />
              )}
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
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
          <span
            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-medium"
            style={{
              backgroundColor: `${TYPE_COLORS[chatbot.type]}20`,
              color: TYPE_COLORS[chatbot.type],
            }}
          >
            {TYPE_LABELS[chatbot.type]}
          </span>
          {chatbot.isActive ? (
            <Badge variant="success">有効</Badge>
          ) : (
            <Badge variant="outline">無効</Badge>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

export default function ChatbotsPage() {
  const [chatbots, setChatbots] = useState<ChatbotRecord[]>([]);
  const [sites, setSites] = useState<SiteRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [chatbotData, siteData] = await Promise.all([
        chatbotApi.list(),
        siteApi.list(),
      ]);
      setChatbots(chatbotData.chatbots);
      setSites(siteData.sites);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'データの取得に失敗しました');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const siteNameMap = new Map(sites.map((s) => [s.id, s.name]));

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title="チャットボット管理"
        description="チャットボットの作成・設定・ウィジェット管理"
        actions={
          <Link href="/sites" className={buttonVariants()}>
            <Plus className="h-4 w-4" />
            サイトを選択して作成
          </Link>
        }
      />

      {loading && (
        <div className="flex justify-center py-12">
          <Spinner size="lg" />
        </div>
      )}

      {error && (
        <div className="rounded-md border border-destructive/20 bg-destructive/5 p-4 text-sm text-destructive">
          {error}
          <Button variant="ghost" size="sm" onClick={loadData} className="ml-2">
            再試行
          </Button>
        </div>
      )}

      {!loading && !error && chatbots.length === 0 && (
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed py-16 text-center">
          <Bot className="h-12 w-12 text-muted-foreground/40 mb-4" />
          <p className="text-sm font-medium">チャットボットがまだありません</p>
          <p className="text-xs text-muted-foreground mt-1">
            「新規作成」からチャットボットを作成してください
          </p>
          <Link href="/sites" className={`mt-4 ${buttonVariants()}`}>
            <Plus className="h-4 w-4" />
            サイトを選択して作成
          </Link>
        </div>
      )}

      {!loading && chatbots.length > 0 && (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {chatbots.map((chatbot) => (
            <ChatbotCard
              key={chatbot.id}
              chatbot={chatbot}
              siteName={siteNameMap.get(chatbot.siteId) ?? '不明なサイト'}
              onToggle={loadData}
              onDeleted={loadData}
            />
          ))}
        </div>
      )}
    </div>
  );
}
