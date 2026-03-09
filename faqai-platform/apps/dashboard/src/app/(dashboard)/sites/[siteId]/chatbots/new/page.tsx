'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, Bot } from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Spinner } from '@/components/ui/spinner';
import { ApiError, chatbotApi } from '@/lib/api-client';

// ---------------------------------------------------------------------------
// Chatbot type definitions
// ---------------------------------------------------------------------------

type ChatbotType = 'ai' | 'scenario' | 'hybrid';

const TYPE_OPTIONS: {
  value: ChatbotType;
  label: string;
  description: string;
  color: string;
}[] = [
  {
    value: 'ai',
    label: 'AI型',
    description: 'FAQからAIが自動回答。自然な会話で的確に対応します。',
    color: '#8b5cf6',
  },
  {
    value: 'scenario',
    label: 'シナリオ型',
    description: 'フロー形式で案内。決まったフローで確実に誘導できます。',
    color: '#3b82f6',
  },
  {
    value: 'hybrid',
    label: 'ハイブリッド型',
    description: 'シナリオ + AI組み合わせ。柔軟さと確実さを両立します。',
    color: '#f97316',
  },
];

const POSITION_OPTIONS = [
  { value: 'bottom-right', label: '右下' },
  { value: 'bottom-left', label: '左下' },
] as const;

// ---------------------------------------------------------------------------
// Form state type
// ---------------------------------------------------------------------------

type FormState = {
  name: string;
  type: ChatbotType;
  greetingMessage: string;
  position: 'bottom-right' | 'bottom-left';
  primaryColor: string;
};

const DEFAULT_FORM: FormState = {
  name: '',
  type: 'ai',
  greetingMessage: 'こんにちは！何かお手伝いできることはありますか？',
  position: 'bottom-right',
  primaryColor: '#6366f1',
};

// ---------------------------------------------------------------------------
// Page component
// ---------------------------------------------------------------------------

export default function NewChatbotPage() {
  const params = useParams();
  const router = useRouter();
  const siteId = params.siteId as string;

  const [form, setForm] = useState<FormState>(DEFAULT_FORM);
  const [saving, setSaving] = useState(false);

  const updateForm = (updates: Partial<FormState>) => {
    setForm((prev) => ({ ...prev, ...updates }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) {
      toast.error('チャットボット名は必須です');
      return;
    }

    setSaving(true);
    try {
      const result = await chatbotApi.create({
        siteId,
        name: form.name.trim(),
        type: form.type,
        widgetConfig: {
          greeting_message: form.greetingMessage,
          position: form.position,
          primary_color: form.primaryColor,
        },
      });
      toast.success('チャットボットを作成しました');
      router.push(`/sites/${siteId}/chatbots/${result.chatbot.id}`);
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : '作成に失敗しました');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="space-y-1">
        <Link
          href={`/sites/${siteId}/chatbots`}
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          チャットボット一覧へ戻る
        </Link>
        <div className="flex items-center gap-2">
          <Bot className="h-5 w-5 text-muted-foreground" />
          <h2 className="text-lg font-semibold">新規チャットボット作成</h2>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6 max-w-2xl">
        {/* Basic info */}
        <Card>
          <CardContent className="pt-6 space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="chatbot-name">チャットボット名 *</Label>
              <Input
                id="chatbot-name"
                value={form.name}
                onChange={(e) => updateForm({ name: e.target.value })}
                placeholder="例: サポートチャットボット"
                autoFocus
              />
            </div>
          </CardContent>
        </Card>

        {/* Type selection */}
        <div className="space-y-2">
          <Label>チャットボットタイプ</Label>
          <div className="grid gap-3 sm:grid-cols-3">
            {TYPE_OPTIONS.map((option) => {
              const isSelected = form.type === option.value;
              return (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => updateForm({ type: option.value })}
                  className={`text-left rounded-lg border-2 p-4 transition-all ${
                    isSelected
                      ? 'border-current shadow-sm'
                      : 'border-border hover:border-muted-foreground/40'
                  }`}
                  style={isSelected ? { borderColor: option.color } : undefined}
                >
                  <div
                    className="text-sm font-semibold mb-1"
                    style={{ color: isSelected ? option.color : undefined }}
                  >
                    {option.label}
                  </div>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    {option.description}
                  </p>
                </button>
              );
            })}
          </div>
        </div>

        {/* Widget config */}
        <Card>
          <CardContent className="pt-6 space-y-4">
            <h3 className="text-sm font-medium">ウィジェット設定</h3>

            <div className="space-y-1.5">
              <Label htmlFor="greeting">挨拶メッセージ</Label>
              <Input
                id="greeting"
                value={form.greetingMessage}
                onChange={(e) => updateForm({ greetingMessage: e.target.value })}
                placeholder="こんにちは！何かお手伝いできることはありますか？"
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label>表示位置</Label>
                <div className="flex rounded-md border overflow-hidden">
                  {POSITION_OPTIONS.map((opt) => (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => updateForm({ position: opt.value })}
                      className={`flex-1 px-3 py-2 text-sm transition-colors ${
                        form.position === opt.value
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-background hover:bg-accent'
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="color">テーマカラー</Label>
                <div className="flex items-center gap-2">
                  <input
                    id="color"
                    type="color"
                    value={form.primaryColor}
                    onChange={(e) => updateForm({ primaryColor: e.target.value })}
                    className="h-9 w-16 cursor-pointer rounded border bg-background p-1"
                  />
                  <Input
                    value={form.primaryColor}
                    onChange={(e) => updateForm({ primaryColor: e.target.value })}
                    placeholder="#6366f1"
                    className="flex-1 font-mono"
                  />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="flex items-center gap-3">
          <Button type="submit" disabled={saving}>
            {saving && <Spinner size="sm" className="mr-2" />}
            作成する
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => router.push(`/sites/${siteId}/chatbots`)}
            disabled={saving}
          >
            キャンセル
          </Button>
        </div>
      </form>
    </div>
  );
}
