'use client';

import { useEffect, useState, useCallback } from 'react';
import { Tag, Plus, Edit2, Trash2, X, Check } from 'lucide-react';
import { toast } from 'sonner';
import { PageHeader } from '@/components/layout/page-header';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Spinner } from '@/components/ui/spinner';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import { ApiError, tagApi, type TagRecord } from '@/lib/api-client';

// ---------------------------------------------------------------------------
// Color presets
// ---------------------------------------------------------------------------

const COLOR_PRESETS = [
  '#6366f1', // indigo
  '#8b5cf6', // violet
  '#ec4899', // pink
  '#ef4444', // red
  '#f97316', // orange
  '#eab308', // yellow
  '#22c55e', // green
  '#14b8a6', // teal
  '#06b6d4', // cyan
  '#3b82f6', // blue
  '#6b7280', // gray
  '#78716c', // stone
];

// ---------------------------------------------------------------------------
// Color picker
// ---------------------------------------------------------------------------

function ColorPicker({
  value,
  onChange,
}: {
  value: string;
  onChange: (color: string) => void;
}) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {COLOR_PRESETS.map((color) => (
        <button
          key={color}
          type="button"
          onClick={() => onChange(color)}
          className="h-6 w-6 rounded-full border-2 transition-transform hover:scale-110"
          style={{
            backgroundColor: color,
            borderColor: value === color ? 'currentColor' : 'transparent',
          }}
          aria-label={`色を${color}に設定`}
        >
          {value === color && (
            <Check className="h-3.5 w-3.5 text-white mx-auto" />
          )}
        </button>
      ))}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Tag card (display + inline edit)
// ---------------------------------------------------------------------------

function TagCard({
  tag,
  onUpdated,
  onDeleted,
}: {
  tag: TagRecord;
  onUpdated: () => void;
  onDeleted: () => void;
}) {
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(tag.name);
  const [color, setColor] = useState(tag.color ?? '#6366f1');
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const handleSave = async () => {
    if (!name.trim()) {
      toast.error('タグ名は必須です');
      return;
    }
    setSaving(true);
    try {
      await tagApi.update(tag.id, { name: name.trim(), color });
      toast.success('タグを更新しました');
      setEditing(false);
      onUpdated();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : '更新に失敗しました');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm(`タグ「${tag.name}」を削除しますか？関連するFAQからもタグが外れます。`)) return;
    setDeleting(true);
    try {
      await tagApi.remove(tag.id);
      toast.success('タグを削除しました');
      onDeleted();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : '削除に失敗しました');
      setDeleting(false);
    }
  };

  const handleCancel = () => {
    setName(tag.name);
    setColor(tag.color ?? '#6366f1');
    setEditing(false);
  };

  if (editing) {
    return (
      <Card className="border-primary/30">
        <CardContent className="pt-4 space-y-3">
          <div className="space-y-1.5">
            <Label htmlFor={`tag-name-${tag.id}`}>タグ名</Label>
            <Input
              id={`tag-name-${tag.id}`}
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="タグ名を入力"
              autoFocus
            />
          </div>
          <div className="space-y-1.5">
            <Label>カラー</Label>
            <ColorPicker value={color} onChange={setColor} />
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" size="sm" onClick={handleCancel} disabled={saving}>
              キャンセル
            </Button>
            <Button size="sm" onClick={handleSave} disabled={saving}>
              {saving && <Spinner size="sm" className="mr-1" />}
              保存
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="group">
      <CardContent className="pt-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <span
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-sm font-medium"
              style={{
                backgroundColor: `${tag.color ?? '#6366f1'}20`,
                color: tag.color ?? '#6366f1',
              }}
            >
              <Tag className="h-3.5 w-3.5" />
              {tag.name}
            </span>
          </div>
          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <Button
              size="icon"
              variant="ghost"
              onClick={() => setEditing(true)}
              className="h-7 w-7"
              title="編集"
            >
              <Edit2 className="h-3.5 w-3.5" />
            </Button>
            <Button
              size="icon"
              variant="ghost"
              onClick={handleDelete}
              disabled={deleting}
              className="h-7 w-7 text-destructive hover:text-destructive"
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
// Create tag form
// ---------------------------------------------------------------------------

function CreateTagForm({ onCreated }: { onCreated: () => void }) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState('');
  const [color, setColor] = useState('#6366f1');
  const [saving, setSaving] = useState(false);

  const handleCreate = async () => {
    if (!name.trim()) {
      toast.error('タグ名は必須です');
      return;
    }
    setSaving(true);
    try {
      await tagApi.create({ name: name.trim(), color });
      toast.success('タグを作成しました');
      setName('');
      setColor('#6366f1');
      setOpen(false);
      onCreated();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : '作成に失敗しました');
    } finally {
      setSaving(false);
    }
  };

  if (!open) {
    return (
      <Button variant="outline" onClick={() => setOpen(true)} className="w-full border-dashed">
        <Plus className="h-4 w-4 mr-2" />
        新しいタグを追加
      </Button>
    );
  }

  return (
    <Card className="border-primary/30">
      <CardContent className="pt-4 space-y-3">
        <div className="space-y-1.5">
          <Label htmlFor="new-tag-name">タグ名</Label>
          <Input
            id="new-tag-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="例: 料金, 使い方, トラブル"
            autoFocus
          />
        </div>
        <div className="space-y-1.5">
          <Label>カラー</Label>
          <ColorPicker value={color} onChange={setColor} />
        </div>
        <div className="flex justify-end gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setOpen(false);
              setName('');
              setColor('#6366f1');
            }}
            disabled={saving}
          >
            <X className="h-3.5 w-3.5 mr-1" />
            キャンセル
          </Button>
          <Button size="sm" onClick={handleCreate} disabled={saving}>
            {saving && <Spinner size="sm" className="mr-1" />}
            <Plus className="h-3.5 w-3.5 mr-1" />
            作成
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

// ---------------------------------------------------------------------------
// Main page
// ---------------------------------------------------------------------------

export default function TagsPage() {
  const [tags, setTags] = useState<TagRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadTags = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await tagApi.list();
      setTags(data.tags);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'タグの取得に失敗しました');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadTags();
  }, [loadTags]);

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title="タグ管理"
        description="FAQに付与するタグを管理します。タグを使ってFAQを分類・整理できます。"
      />

      <div className="max-w-2xl space-y-4">
        {loading && (
          <div className="flex justify-center py-12">
            <Spinner size="lg" />
          </div>
        )}

        {error && (
          <div className="rounded-md border border-destructive/20 bg-destructive/5 p-4 text-sm text-destructive">
            {error}
            <Button variant="ghost" size="sm" onClick={loadTags} className="ml-2">
              再試行
            </Button>
          </div>
        )}

        {!loading && !error && (
          <>
            {tags.length === 0 && (
              <Card>
                <CardHeader>
                  <div className="flex flex-col items-center text-center py-4">
                    <Tag className="h-12 w-12 text-muted-foreground/40 mb-4" />
                    <CardTitle className="text-base">タグがまだありません</CardTitle>
                    <CardDescription className="mt-1">
                      タグを作成してFAQを分類しましょう
                    </CardDescription>
                  </div>
                </CardHeader>
              </Card>
            )}

            {tags.map((tag) => (
              <TagCard
                key={tag.id}
                tag={tag}
                onUpdated={loadTags}
                onDeleted={loadTags}
              />
            ))}

            <CreateTagForm onCreated={loadTags} />
          </>
        )}
      </div>
    </div>
  );
}
