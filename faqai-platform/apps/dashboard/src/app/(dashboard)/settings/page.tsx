'use client';

import { useEffect, useState } from 'react';
import { User, Mail, Building2, Shield, Save, Edit2 } from 'lucide-react';
import { toast } from 'sonner';
import { PageHeader } from '@/components/layout/page-header';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Spinner } from '@/components/ui/spinner';
import { useAuthStore } from '@/stores/auth-store';
import { ApiError } from '@/lib/api-client';

// ---------------------------------------------------------------------------
// プロフィール編集セクション
// ---------------------------------------------------------------------------

function ProfileSection() {
  const user = useAuthStore((s) => s.user);
  const organizationId = useAuthStore((s) => s.organizationId);
  const updateProfile = useAuthStore((s) => s.updateProfile);
  const fetchMe = useAuthStore((s) => s.fetchMe);

  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState(user?.name ?? '');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchMe();
  }, [fetchMe]);

  useEffect(() => {
    if (user?.name) {
      setName(user.name);
    }
  }, [user?.name]);

  const handleSave = async () => {
    if (!name.trim()) {
      toast.error('名前は必須です');
      return;
    }
    setSaving(true);
    try {
      await updateProfile({ name: name.trim() });
      toast.success('プロフィールを更新しました');
      setIsEditing(false);
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : '更新に失敗しました');
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setName(user?.name ?? '');
    setIsEditing(false);
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <User className="h-5 w-5 text-muted-foreground" />
            <CardTitle className="text-base">プロフィール</CardTitle>
          </div>
          {!isEditing && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsEditing(true)}
              aria-label="プロフィールを編集"
            >
              <Edit2 className="h-4 w-4 mr-1" />
              編集
            </Button>
          )}
        </div>
        <CardDescription>アカウントの基本情報を管理します</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor="profile-name">名前</Label>
          {isEditing ? (
            <Input
              id="profile-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="表示名を入力"
              autoFocus
            />
          ) : (
            <p className="text-sm py-2 px-3 bg-muted/50 rounded-md" id="profile-name">
              {user?.name ?? '—'}
            </p>
          )}
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="profile-email" className="flex items-center gap-1">
            <Mail className="h-3.5 w-3.5" />
            メールアドレス
          </Label>
          <p className="text-sm py-2 px-3 bg-muted/50 rounded-md text-muted-foreground" id="profile-email">
            {user?.email ?? '—'}
          </p>
          <p className="text-xs text-muted-foreground">メールアドレスの変更は現在サポートされていません</p>
        </div>

        {organizationId && (
          <div className="space-y-1.5">
            <Label className="flex items-center gap-1">
              <Building2 className="h-3.5 w-3.5" />
              組織ID
            </Label>
            <p className="text-sm py-2 px-3 bg-muted/50 rounded-md font-mono text-xs text-muted-foreground">
              {organizationId}
            </p>
          </div>
        )}

        {isEditing && (
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={handleCancel} disabled={saving}>
              キャンセル
            </Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving && <Spinner size="sm" className="mr-2" />}
              <Save className="h-4 w-4 mr-1" />
              保存する
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ---------------------------------------------------------------------------
// アカウントセキュリティセクション
// ---------------------------------------------------------------------------

function SecuritySection() {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <Shield className="h-5 w-5 text-muted-foreground" />
          <CardTitle className="text-base">セキュリティ</CardTitle>
        </div>
        <CardDescription>パスワードとセキュリティ設定を管理します</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="rounded-md border border-dashed p-4 text-center">
          <p className="text-sm text-muted-foreground">パスワード変更機能は近日公開予定です</p>
        </div>
      </CardContent>
    </Card>
  );
}

// ---------------------------------------------------------------------------
// メインページ
// ---------------------------------------------------------------------------

export default function SettingsPage() {
  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title="設定"
        description="アカウントとアプリケーションの設定を管理します"
      />

      <div className="max-w-2xl space-y-6">
        <ProfileSection />
        <SecuritySection />
      </div>
    </div>
  );
}
