'use client';

import React, { useEffect, useState, useCallback, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft,
  Bot,
  Power,
  PowerOff,
  Plus,
  Trash2,
  Code2,
  Settings,
  GitBranch,
  MessageSquare,
  ChevronDown,
  ChevronRight,
  Check,
  X,
  Play,
  Send,
  RefreshCw,
} from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Spinner } from '@/components/ui/spinner';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import {
  ApiError,
  chatbotApi,
  type ChatbotRecord,
  type ScenarioRecord,
  type CreateScenarioInput,
} from '@/lib/api-client';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const TYPE_LABELS: Record<ChatbotRecord['type'], string> = {
  ai: 'AI型',
  scenario: 'シナリオ型',
  hybrid: 'ハイブリッド型',
};

const TYPE_COLORS: Record<ChatbotRecord['type'], string> = {
  ai: '#8b5cf6',
  scenario: '#3b82f6',
  hybrid: '#f97316',
};

type TabId = 'settings' | 'scenarios' | 'embed' | 'history' | 'preview';

const TABS: { id: TabId; label: string; icon: React.ElementType }[] = [
  { id: 'settings', label: '基本設定', icon: Settings },
  { id: 'scenarios', label: 'シナリオ', icon: GitBranch },
  { id: 'embed', label: '埋め込みコード', icon: Code2 },
  { id: 'history', label: '会話履歴', icon: MessageSquare },
  { id: 'preview', label: 'プレビュー', icon: Play },
];

// ---------------------------------------------------------------------------
// Settings tab
// ---------------------------------------------------------------------------

function SettingsTab({
  chatbot,
  onUpdated,
}: {
  chatbot: ChatbotRecord;
  onUpdated: (updated: ChatbotRecord) => void;
}) {
  const [name, setName] = useState(chatbot.name);
  const [greetingMessage, setGreetingMessage] = useState(
    chatbot.widgetConfig.greeting_message,
  );
  const [position, setPosition] = useState(chatbot.widgetConfig.position);
  const [primaryColor, setPrimaryColor] = useState(chatbot.widgetConfig.primary_color);
  const [systemPrompt, setSystemPrompt] = useState(
    chatbot.aiConfig.system_prompt ?? '',
  );
  const [fallbackMessage, setFallbackMessage] = useState(
    chatbot.aiConfig.fallback_message,
  );
  const [saving, setSaving] = useState(false);
  const [toggling, setToggling] = useState(false);

  const handleToggleActive = async () => {
    setToggling(true);
    try {
      const result = await chatbotApi.update(chatbot.id, {
        isActive: !chatbot.isActive,
      });
      onUpdated(result.chatbot);
      toast.success(
        result.chatbot.isActive
          ? 'チャットボットを有効にしました'
          : 'チャットボットを無効にしました',
      );
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : '更新に失敗しました');
    } finally {
      setToggling(false);
    }
  };

  const handleSave = async () => {
    if (!name.trim()) {
      toast.error('チャットボット名は必須です');
      return;
    }
    setSaving(true);
    try {
      const result = await chatbotApi.update(chatbot.id, {
        name: name.trim(),
        widgetConfig: {
          greeting_message: greetingMessage,
          position,
          primary_color: primaryColor,
        },
        aiConfig: {
          system_prompt: systemPrompt.trim() || null,
          fallback_message: fallbackMessage,
        },
      });
      onUpdated(result.chatbot);
      toast.success('設定を保存しました');
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : '保存に失敗しました');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6 max-w-2xl">
      {/* Status */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">ステータス</CardTitle>
            <Button
              variant="outline"
              size="sm"
              onClick={handleToggleActive}
              disabled={toggling}
            >
              {toggling ? (
                <Spinner size="sm" className="mr-2" />
              ) : chatbot.isActive ? (
                <Power className="h-4 w-4 mr-2 text-green-600" />
              ) : (
                <PowerOff className="h-4 w-4 mr-2 text-muted-foreground" />
              )}
              {chatbot.isActive ? '有効（無効にする）' : '無効（有効にする）'}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <span>タイプ:</span>
            <span
              className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium"
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

      {/* Basic info */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">基本情報</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="cb-name">チャットボット名</Label>
            <Input
              id="cb-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="チャットボット名"
            />
          </div>
        </CardContent>
      </Card>

      {/* Widget config */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">ウィジェット設定</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="greeting">挨拶メッセージ</Label>
            <Input
              id="greeting"
              value={greetingMessage}
              onChange={(e) => setGreetingMessage(e.target.value)}
              placeholder="こんにちは！"
            />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label>表示位置</Label>
              <div className="flex rounded-md border overflow-hidden">
                {(
                  [
                    { value: 'bottom-right', label: '右下' },
                    { value: 'bottom-left', label: '左下' },
                  ] as const
                ).map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setPosition(opt.value)}
                    className={`flex-1 px-3 py-2 text-sm transition-colors ${
                      position === opt.value
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
              <Label htmlFor="cb-color">テーマカラー</Label>
              <div className="flex items-center gap-2">
                <input
                  id="cb-color"
                  type="color"
                  value={primaryColor}
                  onChange={(e) => setPrimaryColor(e.target.value)}
                  className="h-9 w-16 cursor-pointer rounded border bg-background p-1"
                />
                <Input
                  value={primaryColor}
                  onChange={(e) => setPrimaryColor(e.target.value)}
                  placeholder="#6366f1"
                  className="flex-1 font-mono"
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* AI config */}
      {(chatbot.type === 'ai' || chatbot.type === 'hybrid') && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">AI設定</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="system-prompt">システムプロンプト</Label>
              <textarea
                id="system-prompt"
                value={systemPrompt}
                onChange={(e) => setSystemPrompt(e.target.value)}
                rows={5}
                placeholder="AIへの指示を入力... (省略可)"
                className="w-full rounded-md border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 resize-y"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="fallback">フォールバックメッセージ</Label>
              <Input
                id="fallback"
                value={fallbackMessage}
                onChange={(e) => setFallbackMessage(e.target.value)}
                placeholder="申し訳ありません、回答できませんでした"
              />
              <p className="text-xs text-muted-foreground">
                AIが回答できなかった場合に表示するメッセージ
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      <Button onClick={handleSave} disabled={saving}>
        {saving && <Spinner size="sm" className="mr-2" />}
        設定を保存
      </Button>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Scenario row
// ---------------------------------------------------------------------------

function ScenarioRow({
  scenario,
  onDeleted,
  onToggled,
}: {
  scenario: ScenarioRecord;
  onDeleted: () => void;
  onToggled: () => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const [toggling, setToggling] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const handleToggle = async () => {
    setToggling(true);
    try {
      await chatbotApi.updateScenario(scenario.id, { isActive: !scenario.isActive });
      toast.success(scenario.isActive ? 'シナリオを無効にしました' : 'シナリオを有効にしました');
      onToggled();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : '更新に失敗しました');
    } finally {
      setToggling(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm(`「${scenario.name}」を削除しますか？`)) return;
    setDeleting(true);
    try {
      await chatbotApi.deleteScenario(scenario.id);
      toast.success('シナリオを削除しました');
      onDeleted();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : '削除に失敗しました');
      setDeleting(false);
    }
  };

  return (
    <div className="rounded-lg border overflow-hidden">
      <div className="flex items-center gap-3 p-3 bg-muted/30">
        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          className="flex items-center gap-2 flex-1 min-w-0 text-left"
        >
          {expanded ? (
            <ChevronDown className="h-4 w-4 text-muted-foreground shrink-0" />
          ) : (
            <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
          )}
          <span className="text-sm font-medium truncate">{scenario.name}</span>
          {scenario.isActive ? (
            <Badge variant="success" className="shrink-0">有効</Badge>
          ) : (
            <Badge variant="outline" className="shrink-0">無効</Badge>
          )}
        </button>
        <div className="flex items-center gap-1 shrink-0">
          <Button
            size="sm"
            variant="ghost"
            onClick={handleToggle}
            disabled={toggling}
            title={scenario.isActive ? '無効にする' : '有効にする'}
          >
            {toggling ? (
              <Spinner size="sm" />
            ) : scenario.isActive ? (
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
            className="text-destructive hover:text-destructive h-8 w-8"
          >
            {deleting ? <Spinner size="sm" /> : <Trash2 className="h-4 w-4" />}
          </Button>
        </div>
      </div>

      {expanded && (
        <div className="p-4 space-y-3 border-t">
          {scenario.description && (
            <p className="text-sm text-muted-foreground">{scenario.description}</p>
          )}
          {scenario.triggerKeywords.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {scenario.triggerKeywords.map((kw) => (
                <span
                  key={kw}
                  className="px-2 py-0.5 bg-muted rounded text-xs text-muted-foreground"
                >
                  {kw}
                </span>
              ))}
            </div>
          )}
          <div className="space-y-2">
            <p className="text-xs font-medium text-muted-foreground">
              ノード数: {scenario.nodes?.length ?? 0} / エッジ数: {scenario.edges?.length ?? 0}
            </p>
            {(scenario.nodes?.length ?? 0) > 0 && (
              <div className="space-y-1">
                {scenario.nodes!.map((node) => (
                  <div
                    key={node.id}
                    className="flex items-center gap-2 p-2 rounded bg-muted/40 text-xs"
                  >
                    <span className="font-mono text-muted-foreground">{node.nodeType}</span>
                    {node.isStart && (
                      <Badge variant="outline" className="text-xs">開始</Badge>
                    )}
                    {node.isEnd && (
                      <Badge variant="secondary" className="text-xs">終了</Badge>
                    )}
                    <span className="truncate text-muted-foreground">
                      {typeof node.content === 'object' && node.content !== null && 'text' in node.content
                        ? String(node.content.text)
                        : JSON.stringify(node.content)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// New scenario inline form
// ---------------------------------------------------------------------------

function NewScenarioForm({
  chatbotId,
  onCreated,
  onCancel,
}: {
  chatbotId: string;
  onCreated: () => void;
  onCancel: () => void;
}) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [keywords, setKeywords] = useState('');
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error('シナリオ名は必須です');
      return;
    }
    const data: CreateScenarioInput = { name: name.trim() };
    if (description.trim()) data.description = description.trim();
    if (keywords.trim()) {
      data.triggerKeywords = keywords
        .split(',')
        .map((k) => k.trim())
        .filter(Boolean);
    }

    setSaving(true);
    try {
      await chatbotApi.createScenario(chatbotId, data);
      toast.success('シナリオを作成しました');
      onCreated();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : '作成に失敗しました');
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="rounded-lg border p-4 space-y-3 bg-muted/20">
      <h4 className="text-sm font-medium">新規シナリオ</h4>
      <div className="space-y-1.5">
        <Label htmlFor="sc-name">シナリオ名 *</Label>
        <Input
          id="sc-name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="例: 問い合わせ対応フロー"
          autoFocus
        />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="sc-desc">説明（省略可）</Label>
        <Input
          id="sc-desc"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="このシナリオの説明"
        />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="sc-kw">トリガーキーワード（カンマ区切り）</Label>
        <Input
          id="sc-kw"
          value={keywords}
          onChange={(e) => setKeywords(e.target.value)}
          placeholder="問い合わせ, サポート, 相談"
        />
      </div>
      <div className="flex items-center gap-2">
        <Button type="submit" size="sm" disabled={saving}>
          {saving ? <Spinner size="sm" className="mr-1" /> : <Check className="h-4 w-4 mr-1" />}
          作成
        </Button>
        <Button type="button" size="sm" variant="ghost" onClick={onCancel} disabled={saving}>
          <X className="h-4 w-4 mr-1" />
          キャンセル
        </Button>
      </div>
    </form>
  );
}

// ---------------------------------------------------------------------------
// FAQ → Scenario 自動生成フォーム
// ---------------------------------------------------------------------------

function GenerateFaqScenarioForm({
  chatbotId,
  onGenerated,
  onCancel,
}: {
  chatbotId: string;
  onGenerated: () => void;
  onCancel: () => void;
}) {
  const [scenarioName, setScenarioName] = useState('');
  const [greetingMessage, setGreetingMessage] = useState('ご質問のカテゴリを選択してください。');
  const [maxQuestionsPerCategory, setMaxQuestionsPerCategory] = useState(10);
  const [generating, setGenerating] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setGenerating(true);
    try {
      const genOpts: Parameters<typeof chatbotApi.generateFaqScenario>[1] = {};
      const trimmedName = scenarioName.trim();
      const trimmedGreeting = greetingMessage.trim();
      if (trimmedName) genOpts.scenarioName = trimmedName;
      if (trimmedGreeting) genOpts.greetingMessage = trimmedGreeting;
      genOpts.maxQuestionsPerCategory = maxQuestionsPerCategory;
      const result = await chatbotApi.generateFaqScenario(chatbotId, genOpts);
      toast.success(
        `シナリオを生成しました（${result.categoryCount}カテゴリ・${result.faqCount}件のFAQ → ${result.nodeCount}ノード・${result.edgeCount}エッジ）`,
      );
      onGenerated();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : '生成に失敗しました');
    } finally {
      setGenerating(false);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-lg border border-primary/30 bg-primary/5 p-4 space-y-4"
    >
      <div className="flex items-start gap-2">
        <div className="flex-1">
          <h4 className="text-sm font-semibold">FAQからシナリオを自動生成</h4>
          <p className="text-xs text-muted-foreground mt-0.5">
            このサイトの公開済みFAQをカテゴリ別に整理した選択式フローを自動生成します。
          </p>
        </div>
      </div>

      {/* 生成フロー説明 */}
      <div className="rounded-md bg-muted/50 p-3 text-xs space-y-1 text-muted-foreground">
        <p className="font-medium text-foreground">生成されるフロー</p>
        <p>① 挨拶メッセージ → カテゴリ選択ボタン</p>
        <p>② カテゴリを選ぶ → そのカテゴリのFAQ質問一覧ボタン</p>
        <p>③ 質問を選ぶ → 回答表示 →「解決しました」または「他の質問を見る」</p>
        <p>④「解決しました」→ 終了</p>
      </div>

      <div className="space-y-3">
        <div className="space-y-1.5">
          <Label htmlFor="gen-name">シナリオ名（空白で日付付き自動命名）</Label>
          <Input
            id="gen-name"
            value={scenarioName}
            onChange={(e) => setScenarioName(e.target.value)}
            placeholder="例: FAQ総合案内フロー"
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="gen-greeting">最初の挨拶メッセージ</Label>
          <Input
            id="gen-greeting"
            value={greetingMessage}
            onChange={(e) => setGreetingMessage(e.target.value)}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="gen-max">カテゴリあたりの最大質問数</Label>
          <Input
            id="gen-max"
            type="number"
            min={1}
            max={30}
            value={maxQuestionsPerCategory}
            onChange={(e) => setMaxQuestionsPerCategory(Number(e.target.value))}
            className="w-24"
          />
        </div>
      </div>

      <div className="flex gap-2">
        <Button type="submit" disabled={generating}>
          {generating ? <Spinner size="sm" /> : null}
          {generating ? '生成中...' : '自動生成する'}
        </Button>
        <Button type="button" variant="ghost" onClick={onCancel} disabled={generating}>
          キャンセル
        </Button>
      </div>
    </form>
  );
}

// ---------------------------------------------------------------------------
// Scenarios tab
// ---------------------------------------------------------------------------

function ScenariosTab({ chatbot }: { chatbot: ChatbotRecord }) {
  const [scenarios, setScenarios] = useState<ScenarioRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showNewForm, setShowNewForm] = useState(false);
  const [showGenerateForm, setShowGenerateForm] = useState(false);

  const loadScenarios = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await chatbotApi.listScenarios(chatbot.id);
      setScenarios(data.scenarios);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'シナリオの取得に失敗しました');
    } finally {
      setLoading(false);
    }
  }, [chatbot.id]);

  useEffect(() => {
    loadScenarios();
  }, [loadScenarios]);

  const handleCreated = () => {
    setShowNewForm(false);
    loadScenarios();
  };

  const handleGenerated = () => {
    setShowGenerateForm(false);
    loadScenarios();
  };

  return (
    <div className="space-y-4 max-w-2xl">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium text-muted-foreground">
          シナリオ一覧 ({scenarios.length})
        </h3>
        {!showNewForm && !showGenerateForm && (
          <div className="flex gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => setShowGenerateForm(true)}
            >
              <Play className="h-4 w-4" />
              FAQから自動生成
            </Button>
            <Button size="sm" onClick={() => setShowNewForm(true)}>
              <Plus className="h-4 w-4" />
              新規シナリオ
            </Button>
          </div>
        )}
      </div>

      {showGenerateForm && (
        <GenerateFaqScenarioForm
          chatbotId={chatbot.id}
          onGenerated={handleGenerated}
          onCancel={() => setShowGenerateForm(false)}
        />
      )}

      {showNewForm && (
        <NewScenarioForm
          chatbotId={chatbot.id}
          onCreated={handleCreated}
          onCancel={() => setShowNewForm(false)}
        />
      )}

      {loading && (
        <div className="flex justify-center py-8">
          <Spinner size="lg" />
        </div>
      )}

      {error && (
        <div className="rounded-md border border-destructive/20 bg-destructive/5 p-4 text-sm text-destructive">
          {error}
          <Button variant="ghost" size="sm" onClick={loadScenarios} className="ml-2">
            再試行
          </Button>
        </div>
      )}

      {!loading && !error && scenarios.length === 0 && !showNewForm && (
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed py-12 text-center">
          <GitBranch className="h-10 w-10 text-muted-foreground/40 mb-3" />
          <p className="text-sm font-medium">シナリオがまだありません</p>
          <p className="text-xs text-muted-foreground mt-1">
            「新規シナリオ」から対話フローを作成してください
          </p>
        </div>
      )}

      {!loading && scenarios.length > 0 && (
        <div className="space-y-2">
          {scenarios.map((scenario) => (
            <ScenarioRow
              key={scenario.id}
              scenario={scenario}
              onDeleted={loadScenarios}
              onToggled={loadScenarios}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Embed tab
// ---------------------------------------------------------------------------

function EmbedTab({ chatbot }: { chatbot: ChatbotRecord }) {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? '';
  const scriptSrc = `${apiUrl}/widget/${chatbot.id}/bundle.js`;
  const embedCode = `<!-- FAQai チャットボット -->
<script
  src="${scriptSrc}"
  data-chatbot-id="${chatbot.id}"
  defer
></script>`;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(embedCode);
      toast.success('コードをコピーしました');
    } catch {
      toast.error('コピーに失敗しました');
    }
  };

  return (
    <div className="space-y-4 max-w-2xl">
      <p className="text-sm text-muted-foreground">
        以下のコードをウェブサイトの {'<'}body{'>'} タグ内（閉じタグの直前）に貼り付けてください。
      </p>
      <div className="relative">
        <pre className="rounded-lg border bg-muted p-4 text-sm font-mono overflow-x-auto whitespace-pre-wrap break-all">
          {embedCode}
        </pre>
        <Button
          size="sm"
          variant="outline"
          className="absolute top-2 right-2"
          onClick={handleCopy}
        >
          コピー
        </Button>
      </div>
      <div className="rounded-lg border p-4 space-y-2">
        <h4 className="text-sm font-medium">チャットボットID</h4>
        <code className="text-sm bg-muted px-2 py-1 rounded font-mono">{chatbot.id}</code>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// History tab (placeholder)
// ---------------------------------------------------------------------------

function HistoryTab() {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <MessageSquare className="h-10 w-10 text-muted-foreground/40 mb-3" />
      <p className="text-sm font-medium">会話履歴</p>
      <p className="text-xs text-muted-foreground mt-1">
        チャットボットの会話履歴はここに表示されます（近日公開予定）
      </p>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Preview tab
// ---------------------------------------------------------------------------

type ChatMessage = {
  role: 'user' | 'bot';
  content: string;
  choices?: string[];
  isEnd?: boolean;
};

function PreviewTab({ chatbot }: { chatbot: ChatbotRecord }) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [sessionId] = useState(() => crypto.randomUUID());
  const [currentChoices, setCurrentChoices] = useState<string[] | null>(null);
  const [isEnded, setIsEnded] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  const greeting = chatbot.widgetConfig.greeting_message;
  const primaryColor = chatbot.widgetConfig.primary_color;

  // シナリオ型は選択肢UIを使用、AI型はテキスト入力を使用
  const isScenarioMode = chatbot.type === 'scenario' || chatbot.type === 'hybrid';

  // Show greeting as first bot message
  const allMessages: ChatMessage[] = greeting
    ? [{ role: 'bot', content: greeting }, ...messages]
    : messages;

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [allMessages.length]);

  // シナリオ型: マウント時に最初のステップを自動取得して選択肢を表示
  useEffect(() => {
    if (!isScenarioMode) return;
    setSending(true);
    chatbotApi
      .previewChat(chatbot.id, '__init__', sessionId)
      .then((data) => {
        const botMsg: ChatMessage = { role: 'bot', content: data.message };
        if (data.choices) botMsg.choices = data.choices;
        if (data.isEnd !== undefined) botMsg.isEnd = data.isEnd;
        setMessages([botMsg]);
        setCurrentChoices(data.choices ?? null);
        if (data.isEnd) setIsEnded(true);
      })
      .catch(() => {
        // ignore init errors silently
      })
      .finally(() => setSending(false));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionId]);

  const sendMessage = async (text: string) => {
    if (!text || sending) return;
    setCurrentChoices(null);
    setMessages((prev) => [...prev, { role: 'user', content: text }]);
    setSending(true);
    try {
      const data = await chatbotApi.previewChat(chatbot.id, text, sessionId);
      const botMsg: ChatMessage = { role: 'bot', content: data.message };
      if (data.choices) botMsg.choices = data.choices;
      if (data.isEnd !== undefined) botMsg.isEnd = data.isEnd;
      setMessages((prev) => [...prev, botMsg]);
      setCurrentChoices(data.choices ?? null);
      if (data.isEnd) setIsEnded(true);
    } catch (err) {
      const msg = err instanceof ApiError
        ? `⚠️ ${err.message}`
        : '⚠️ 通信エラーが発生しました。APIサーバーが起動しているか確認してください。';
      setMessages((prev) => [...prev, { role: 'bot', content: msg }]);
    } finally {
      setSending(false);
    }
  };

  const handleSend = () => {
    const text = input.trim();
    if (!text) return;
    setInput('');
    sendMessage(text);
  };

  const handleChoice = (choice: string) => {
    sendMessage(choice);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleReset = () => {
    setMessages([]);
    setInput('');
    setCurrentChoices(null);
    setIsEnded(false);
  };

  return (
    <div className="max-w-sm">
      <div className="flex items-center justify-between mb-3">
        <p className="text-sm text-muted-foreground">
          チャットボットの動作をここで確認できます
        </p>
        <Button variant="ghost" size="sm" onClick={handleReset}>
          <RefreshCw className="h-4 w-4 mr-1" />
          リセット
        </Button>
      </div>

      {!chatbot.isActive && (
        <div className="mb-3 rounded-md border border-yellow-300 bg-yellow-50 px-3 py-2 text-sm text-yellow-800">
          ⚠️ チャットボットが<strong>無効</strong>になっています。「基本設定」タブで有効にしてください。
        </div>
      )}

      {/* スマホ風チャットウィンドウ */}
      <div className="rounded-2xl border shadow-md overflow-hidden flex flex-col bg-white" style={{ height: 560 }}>
        {/* Header */}
        <div
          className="flex items-center gap-3 px-4 py-3 text-white shrink-0"
          style={{ backgroundColor: primaryColor }}
        >
          <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center shrink-0">
            <Bot className="h-4 w-4" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold leading-none truncate">{chatbot.name}</p>
            <p className="text-xs opacity-70 mt-0.5">
              {sending ? '入力中...' : 'オンライン'}
            </p>
          </div>
          <span className="text-[11px] opacity-60 bg-white/10 px-2 py-0.5 rounded-full shrink-0">プレビュー</span>
        </div>

        {/* Messages — flex-1 で残りを占有、最低高を確保 */}
        <div className="overflow-y-auto px-3 py-3 space-y-3" style={{ backgroundColor: '#f5f5f7', minHeight: 120, flex: '1 1 0' }}>
          {allMessages.map((msg, i) => (
            <div
              key={i}
              className={cn('flex gap-2 items-end', msg.role === 'user' ? 'justify-end' : 'justify-start')}
            >
              {msg.role === 'bot' && (
                <div
                  className="w-6 h-6 rounded-full flex items-center justify-center shrink-0 text-white mb-0.5"
                  style={{ backgroundColor: primaryColor }}
                >
                  <Bot className="h-3 w-3" />
                </div>
              )}
              {msg.role === 'user' ? (
                <div
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-2xl rounded-br-sm text-white text-sm font-medium max-w-[80%]"
                  style={{ backgroundColor: primaryColor }}
                >
                  <Check className="h-3 w-3 shrink-0 opacity-80" />
                  <span>{msg.content}</span>
                </div>
              ) : (
                <div className="bg-white rounded-2xl rounded-bl-sm px-3 py-2 text-sm leading-relaxed text-gray-800 shadow-sm max-w-[84%] whitespace-pre-wrap border border-gray-100">
                  {msg.content}
                </div>
              )}
            </div>
          ))}
          {sending && (
            <div className="flex gap-2 items-end justify-start">
              <div
                className="w-6 h-6 rounded-full flex items-center justify-center shrink-0 text-white mb-0.5"
                style={{ backgroundColor: primaryColor }}
              >
                <Bot className="h-3 w-3" />
              </div>
              <div className="bg-white rounded-2xl rounded-bl-sm px-3.5 py-2.5 shadow-sm border border-gray-100">
                <div className="flex gap-1 items-center">
                  <span className="w-1.5 h-1.5 rounded-full bg-gray-400 animate-bounce" style={{ animationDelay: '0ms' }} />
                  <span className="w-1.5 h-1.5 rounded-full bg-gray-400 animate-bounce" style={{ animationDelay: '150ms' }} />
                  <span className="w-1.5 h-1.5 rounded-full bg-gray-400 animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
              </div>
            </div>
          )}
          <div ref={bottomRef} />
        </div>

        {/* 選択肢 / 入力エリア — shrink-0 で押し込まれない */}
        <div className="border-t bg-white shrink-0">
          {/* ─── シナリオ型: 選択肢ボタン（最大240px・スクロール可） ─── */}
          {isScenarioMode && currentChoices && currentChoices.length > 0 && !isEnded && (
            <div className="flex flex-col" style={{ maxHeight: 260 }}>
              <p className="text-[10px] text-gray-400 font-medium tracking-wide px-4 pt-2 pb-1 shrink-0">
                選択してください
              </p>
              <div className="overflow-y-auto px-3 pb-2 space-y-1">
                {currentChoices.map((choice) => (
                  <button
                    key={choice}
                    type="button"
                    onClick={() => handleChoice(choice)}
                    disabled={sending}
                    className="w-full text-left flex items-center justify-between gap-2 px-3.5 py-2.5 rounded-xl border text-sm font-medium transition-colors disabled:opacity-40"
                    style={{ borderColor: '#e2e8f0', color: '#1e293b' }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = primaryColor;
                      e.currentTarget.style.color = '#fff';
                      e.currentTarget.style.borderColor = primaryColor;
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = '';
                      e.currentTarget.style.color = '#1e293b';
                      e.currentTarget.style.borderColor = '#e2e8f0';
                    }}
                  >
                    <span className="leading-snug">{choice}</span>
                    <ChevronRight className="h-3.5 w-3.5 shrink-0 text-gray-400" />
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* ─── 会話終了 ─── */}
          {isEnded && (
            <div className="px-4 py-4 flex flex-col items-center gap-2">
              <div className="flex items-center gap-2 text-xs text-gray-400">
                <Check className="h-3.5 w-3.5" />
                会話が終了しました
              </div>
              <button
                type="button"
                onClick={handleReset}
                className="text-xs font-medium px-4 py-1.5 rounded-full border transition-colors hover:text-white"
                style={{ borderColor: primaryColor, color: primaryColor }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = primaryColor;
                  e.currentTarget.style.color = '#fff';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = '';
                  e.currentTarget.style.color = primaryColor;
                }}
              >
                <RefreshCw className="h-3 w-3 inline mr-1" />
                最初からやり直す
              </button>
            </div>
          )}

          {/* ─── AI型: テキスト入力 ─── */}
          {!isScenarioMode && !isEnded && (
            <div className="p-3 flex gap-2">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="メッセージを入力..."
                disabled={sending}
                className="flex-1 text-sm px-4 py-2.5 rounded-full border bg-gray-50 outline-none focus:ring-2 focus:ring-offset-0 disabled:opacity-50"
                style={{ '--tw-ring-color': primaryColor } as React.CSSProperties}
              />
              <button
                type="button"
                onClick={handleSend}
                disabled={!input.trim() || sending}
                className="w-10 h-10 rounded-full flex items-center justify-center text-white transition-opacity disabled:opacity-40 shrink-0"
                style={{ backgroundColor: primaryColor }}
              >
                <Send className="h-4 w-4" />
              </button>
            </div>
          )}

          {/* ─── ハイブリッド型: 選択肢があれば選択肢、なければテキスト入力 ─── */}
          {chatbot.type === 'hybrid' && !isEnded && !currentChoices && (
            <div className="p-3 flex gap-2">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="メッセージを入力..."
                disabled={sending}
                className="flex-1 text-sm px-4 py-2.5 rounded-full border bg-gray-50 outline-none focus:ring-2 focus:ring-offset-0 disabled:opacity-50"
                style={{ '--tw-ring-color': primaryColor } as React.CSSProperties}
              />
              <button
                type="button"
                onClick={handleSend}
                disabled={!input.trim() || sending}
                className="w-10 h-10 rounded-full flex items-center justify-center text-white transition-opacity disabled:opacity-40 shrink-0"
                style={{ backgroundColor: primaryColor }}
              >
                <Send className="h-4 w-4" />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main page
// ---------------------------------------------------------------------------

export default function ChatbotDetailPage() {
  const params = useParams();
  const router = useRouter();
  const siteId = params.siteId as string;
  const chatbotId = params.chatbotId as string;

  const [chatbot, setChatbot] = useState<ChatbotRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<TabId>('settings');

  const loadChatbot = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await chatbotApi.getById(chatbotId);
      setChatbot(data.chatbot);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'チャットボットの取得に失敗しました');
    } finally {
      setLoading(false);
    }
  }, [chatbotId]);

  useEffect(() => {
    loadChatbot();
  }, [loadChatbot]);

  // シナリオタブはシナリオ/ハイブリッドタイプのみ
  const visibleTabs = TABS.filter((tab) => {
    if (tab.id === 'scenarios') {
      return chatbot?.type === 'scenario' || chatbot?.type === 'hybrid';
    }
    return true;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Spinner size="lg" />
      </div>
    );
  }

  if (error || !chatbot) {
    return (
      <div className="space-y-4">
        <Link
          href={`/sites/${siteId}/chatbots`}
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          チャットボット一覧へ戻る
        </Link>
        <div className="rounded-md border border-destructive/20 bg-destructive/5 p-4 text-sm text-destructive">
          {error ?? 'チャットボットが見つかりません'}
        </div>
        <Button variant="outline" onClick={() => router.push(`/sites/${siteId}/chatbots`)}>
          一覧へ戻る
        </Button>
      </div>
    );
  }

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
          <h2 className="text-lg font-semibold">{chatbot.name}</h2>
          <span
            className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium"
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
      </div>

      {/* Tabs */}
      <div className="border-b">
        <nav className="flex gap-0">
          {visibleTabs.map((tab) => {
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  'flex items-center gap-2 border-b-2 px-4 py-2.5 text-sm font-medium transition-colors',
                  active
                    ? 'border-primary text-primary'
                    : 'border-transparent text-muted-foreground hover:text-foreground hover:border-muted-foreground/30',
                )}
              >
                <tab.icon className="h-4 w-4" />
                {tab.label}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Tab content */}
      <div>
        {activeTab === 'settings' && (
          <SettingsTab chatbot={chatbot} onUpdated={setChatbot} />
        )}
        {activeTab === 'scenarios' && (
          <ScenariosTab chatbot={chatbot} />
        )}
        {activeTab === 'embed' && (
          <EmbedTab chatbot={chatbot} />
        )}
        {activeTab === 'history' && (
          <HistoryTab />
        )}
        {activeTab === 'preview' && (
          <PreviewTab chatbot={chatbot} />
        )}
      </div>
    </div>
  );
}
