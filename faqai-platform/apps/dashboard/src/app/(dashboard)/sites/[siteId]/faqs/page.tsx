'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams } from 'next/navigation';
import {
  MessageSquare,
  Edit2,
  Trash2,
  CheckCircle,
  Bot,
  ChevronLeft,
  ChevronRight,
  Filter,
  Search,
  X,
  Tag,
} from 'lucide-react';
import { toast } from 'sonner';
import { PageHeader } from '@/components/layout/page-header';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Spinner } from '@/components/ui/spinner';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog } from '@/components/ui/dialog';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import { useFaqStore } from '@/stores/faq-store';
import { useSiteContextStore } from '@/stores/site-context-store';
import { ApiError, type FaqRecord, tagApi, type TagRecord } from '@/lib/api-client';

// ---------------------------------------------------------------------------
// Status badge
// ---------------------------------------------------------------------------

function StatusBadge({ status }: { status: FaqRecord['status'] }) {
  const config = {
    draft: { label: '下書き', variant: 'outline' as const },
    published: { label: '公開中', variant: 'success' as const },
    archived: { label: 'アーカイブ', variant: 'secondary' as const },
  }[status];

  return <Badge variant={config.variant}>{config.label}</Badge>;
}

// ---------------------------------------------------------------------------
// Tag badge
// ---------------------------------------------------------------------------

function TagBadge({ tag }: { tag: TagRecord }) {
  return (
    <span
      className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-xs font-medium"
      style={{
        backgroundColor: `${tag.color ?? '#6366f1'}20`,
        color: tag.color ?? '#6366f1',
      }}
    >
      <Tag className="h-2.5 w-2.5" />
      {tag.name}
    </span>
  );
}

// ---------------------------------------------------------------------------
// Edit dialog with tag management
// ---------------------------------------------------------------------------

interface EditDialogProps {
  faq: FaqRecord | null;
  tags: TagRecord[];
  faqTags: TagRecord[];
  onClose: () => void;
  onTagsUpdated: () => void;
}

function EditFaqDialog({ faq, tags, faqTags, onClose, onTagsUpdated }: EditDialogProps) {
  const updateFaq = useFaqStore((s) => s.updateFaq);
  const [question, setQuestion] = useState(faq?.question ?? '');
  const [answer, setAnswer] = useState(faq?.answer ?? '');
  const [selectedTagIds, setSelectedTagIds] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (faq) {
      setQuestion(faq.question);
      setAnswer(faq.answer);
      setSelectedTagIds(faqTags.map((t) => t.id));
    }
  }, [faq, faqTags]);

  const toggleTag = (tagId: string) => {
    setSelectedTagIds((prev) =>
      prev.includes(tagId) ? prev.filter((id) => id !== tagId) : [...prev, tagId],
    );
  };

  const handleSave = async () => {
    if (!faq) return;
    if (!question.trim() || !answer.trim()) {
      toast.error('質問と回答は必須です');
      return;
    }
    setSaving(true);
    try {
      await updateFaq(faq.id, { question: question.trim(), answer: answer.trim() });
      await tagApi.setForFaq(faq.id, selectedTagIds);
      toast.success('FAQを更新しました');
      onTagsUpdated();
      onClose();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : '更新に失敗しました');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog
      open={faq !== null}
      onClose={onClose}
      title="FAQを編集"
      className="max-w-2xl"
    >
      <div className="space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor="edit-question">質問</Label>
          <Input
            id="edit-question"
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            placeholder="質問を入力"
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="edit-answer">回答</Label>
          <Textarea
            id="edit-answer"
            value={answer}
            onChange={(e) => setAnswer(e.target.value)}
            rows={6}
            placeholder="回答を入力"
          />
        </div>
        {tags.length > 0 && (
          <div className="space-y-1.5">
            <Label>タグ</Label>
            <div className="flex flex-wrap gap-1.5">
              {tags.map((tag) => (
                <button
                  key={tag.id}
                  type="button"
                  onClick={() => toggleTag(tag.id)}
                  className={`inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-medium border transition-colors ${
                    selectedTagIds.includes(tag.id)
                      ? 'border-current'
                      : 'border-transparent opacity-50 hover:opacity-75'
                  }`}
                  style={{
                    backgroundColor: `${tag.color ?? '#6366f1'}20`,
                    color: tag.color ?? '#6366f1',
                  }}
                >
                  <Tag className="h-2.5 w-2.5" />
                  {tag.name}
                </button>
              ))}
            </div>
          </div>
        )}
        <div className="flex justify-end gap-2 pt-2">
          <Button variant="outline" onClick={onClose} disabled={saving}>
            キャンセル
          </Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving && <Spinner size="sm" className="mr-2" />}
            保存する
          </Button>
        </div>
      </div>
    </Dialog>
  );
}

// ---------------------------------------------------------------------------
// FAQ card
// ---------------------------------------------------------------------------

function FaqCard({
  faq,
  faqTags,
  onEdit,
}: {
  faq: FaqRecord;
  faqTags: TagRecord[];
  onEdit: (faq: FaqRecord) => void;
}) {
  const updateFaq = useFaqStore((s) => s.updateFaq);
  const removeFaq = useFaqStore((s) => s.removeFaq);
  const [publishing, setPublishing] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const handlePublish = async () => {
    setPublishing(true);
    try {
      const next = faq.status === 'published' ? 'draft' : 'published';
      await updateFaq(faq.id, { status: next });
      toast.success(next === 'published' ? 'FAQを公開しました' : '下書きに戻しました');
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : '更新に失敗しました');
    } finally {
      setPublishing(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm('このFAQを削除しますか？')) return;
    setDeleting(true);
    try {
      await removeFaq(faq.id);
      toast.success('FAQを削除しました');
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : '削除に失敗しました');
      setDeleting(false);
    }
  };

  return (
    <Card className="overflow-hidden">
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-start gap-2 min-w-0 flex-1">
            {faq.metadata.aiGenerated && (
              <Bot className="h-4 w-4 text-blue-500 shrink-0 mt-0.5" aria-label="AI生成" />
            )}
            <CardTitle className="text-sm font-medium leading-snug">
              {faq.question}
            </CardTitle>
          </div>
          <div className="flex items-center gap-1 shrink-0">
            <StatusBadge status={faq.status} />
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <CardDescription className="text-sm leading-relaxed line-clamp-3">
          {faq.answer}
        </CardDescription>
        {faqTags.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-2">
            {faqTags.map((tag) => (
              <TagBadge key={tag.id} tag={tag} />
            ))}
          </div>
        )}
        <div className="flex items-center justify-between mt-3 pt-3 border-t">
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            {faq.metadata.generationModel && (
              <span className="bg-blue-50 text-blue-600 px-1.5 py-0.5 rounded text-xs">
                {faq.metadata.generationModel}
              </span>
            )}
          </div>
          <div className="flex items-center gap-1">
            <Button
              size="sm"
              variant="ghost"
              onClick={() => onEdit(faq)}
              title="編集"
            >
              <Edit2 className="h-3.5 w-3.5" />
            </Button>
            <Button
              size="sm"
              variant={faq.status === 'published' ? 'secondary' : 'outline'}
              onClick={handlePublish}
              disabled={publishing}
              title={faq.status === 'published' ? '下書きに戻す' : '公開する'}
            >
              {publishing ? (
                <Spinner size="sm" />
              ) : (
                <CheckCircle className="h-3.5 w-3.5" />
              )}
              <span className="ml-1 text-xs">
                {faq.status === 'published' ? '下書きへ' : '公開'}
              </span>
            </Button>
            <Button
              size="icon"
              variant="ghost"
              onClick={handleDelete}
              disabled={deleting}
              className="text-destructive hover:text-destructive h-8 w-8"
              title="削除"
            >
              {deleting ? <Spinner size="sm" /> : <Trash2 className="h-3.5 w-3.5" />}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// ---------------------------------------------------------------------------
// Main page
// ---------------------------------------------------------------------------

const STATUS_OPTIONS = [
  { value: '', label: 'すべて' },
  { value: 'draft', label: '下書き' },
  { value: 'published', label: '公開中' },
  { value: 'archived', label: 'アーカイブ' },
];

export default function SiteFaqsPage() {
  const params = useParams();
  const siteId = params.siteId as string;
  const currentSite = useSiteContextStore((s) => s.currentSite);

  const { items, total, isLoading, error, currentPage, pageSize, fetchFaqs, setFilters } =
    useFaqStore();

  const [statusFilter, setStatusFilter] = useState('');
  const [editingFaq, setEditingFaq] = useState<FaqRecord | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [allTags, setAllTags] = useState<TagRecord[]>([]);
  const [faqTagsMap, setFaqTagsMap] = useState<Record<string, TagRecord[]>>({});

  // タグ一覧を取得
  useEffect(() => {
    tagApi.list().then((data) => setAllTags(data.tags)).catch(() => {});
  }, []);

  // FAQリストのロード（siteId固定）
  const loadFaqs = useCallback((status: string, page?: number) => {
    const filterObj: { siteId?: string; status?: string } = { siteId };
    if (status) filterObj.status = status;
    setFilters(filterObj);
    const params: { siteId?: string; status?: string; page?: number } = { siteId };
    if (status) params.status = status;
    if (page !== undefined) params.page = page;
    fetchFaqs(params);
  }, [siteId, fetchFaqs, setFilters]);

  useEffect(() => {
    loadFaqs(statusFilter);
  }, [siteId, statusFilter, loadFaqs]);

  // FAQ取得後にタグ情報もロード
  useEffect(() => {
    const loadTags = async () => {
      const newMap: Record<string, TagRecord[]> = {};
      for (const faq of items) {
        try {
          const data = await tagApi.getForFaq(faq.id);
          newMap[faq.id] = data.tags;
        } catch {
          newMap[faq.id] = [];
        }
      }
      setFaqTagsMap(newMap);
    };
    if (items.length > 0 && allTags.length > 0) {
      loadTags();
    }
  }, [items, allTags]);

  const handleStatusChange = (status: string) => {
    setStatusFilter(status);
  };

  const handleTagsUpdated = () => {
    loadFaqs(statusFilter);
  };

  const filteredItems = searchQuery.trim()
    ? items.filter(
        (faq) =>
          faq.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
          faq.answer.toLowerCase().includes(searchQuery.toLowerCase()),
      )
    : items;

  const totalPages = Math.ceil(total / pageSize);

  const editingFaqTags = editingFaq ? (faqTagsMap[editingFaq.id] ?? []) : [];

  return (
    <div className="space-y-6">
      <PageHeader
        title="FAQ管理"
        description={`${total}件のFAQ${currentSite ? ` - ${currentSite.name}` : ''}`}
      />

      {/* フィルターバー */}
      <div className="flex items-center gap-2 flex-wrap">
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <input
            type="text"
            placeholder="FAQ検索..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            aria-label="FAQ検索"
            className="h-8 w-48 rounded-md border bg-background pl-8 pr-7 text-sm outline-none ring-offset-background focus:ring-2 focus:ring-ring"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              aria-label="検索をクリア"
              className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
        <Filter className="h-4 w-4 text-muted-foreground" />
        <div className="flex rounded-md border overflow-hidden">
          {STATUS_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              onClick={() => handleStatusChange(opt.value)}
              className={`px-3 py-1.5 text-sm transition-colors ${
                statusFilter === opt.value
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-background hover:bg-accent text-foreground'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {isLoading && (
        <div className="flex justify-center py-12">
          <Spinner size="lg" />
        </div>
      )}

      {error && (
        <div className="rounded-md border border-destructive/20 bg-destructive/5 p-4 text-sm text-destructive">
          {error}
          <Button variant="ghost" size="sm" onClick={() => loadFaqs(statusFilter)} className="ml-2">
            再試行
          </Button>
        </div>
      )}

      {!isLoading && !error && items.length === 0 && (
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed py-16 text-center">
          <MessageSquare className="h-12 w-12 text-muted-foreground/40 mb-4" />
          <p className="text-sm font-medium">FAQがまだありません</p>
          <p className="text-xs text-muted-foreground mt-1">
            クロールを実行するとFAQが自動生成されます
          </p>
        </div>
      )}

      {!isLoading && items.length > 0 && filteredItems.length === 0 && searchQuery && (
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed py-16 text-center">
          <Search className="h-12 w-12 text-muted-foreground/40 mb-4" />
          <p className="text-sm font-medium">検索結果がありません</p>
          <p className="text-xs text-muted-foreground mt-1">
            「{searchQuery}」に一致するFAQが見つかりませんでした
          </p>
          <button
            onClick={() => setSearchQuery('')}
            className="mt-3 text-xs text-primary hover:underline"
          >
            検索をクリア
          </button>
        </div>
      )}

      {!isLoading && filteredItems.length > 0 && (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {filteredItems.map((faq) => (
            <FaqCard
              key={faq.id}
              faq={faq}
              faqTags={faqTagsMap[faq.id] ?? []}
              onEdit={setEditingFaq}
            />
          ))}
        </div>
      )}

      {/* ページネーション */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 pt-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => loadFaqs(statusFilter, currentPage - 1)}
            disabled={currentPage <= 1 || isLoading}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="text-sm text-muted-foreground">
            {currentPage} / {totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => loadFaqs(statusFilter, currentPage + 1)}
            disabled={currentPage >= totalPages || isLoading}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      )}

      <EditFaqDialog
        faq={editingFaq}
        tags={allTags}
        faqTags={editingFaqTags}
        onClose={() => setEditingFaq(null)}
        onTagsUpdated={handleTagsUpdated}
      />
    </div>
  );
}
