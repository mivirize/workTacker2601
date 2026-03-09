'use client';

import { useAuthStore } from '@/stores/auth-store';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { Sparkles, Globe } from 'lucide-react';

export function WelcomeBanner() {
  const { user } = useAuthStore();

  return (
    <div className="rounded-lg border bg-gradient-to-r from-primary/10 via-primary/5 to-background p-6">
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-xl font-semibold">
            ようこそ、{user?.name ?? 'ユーザー'}さん！ 👋
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            FAQAI Platform へようこそ。まずはサイトを追加してFAQを自動生成しましょう。
          </p>
        </div>
        <Sparkles className="h-8 w-8 text-primary opacity-50" />
      </div>
      <div className="mt-4 flex gap-3">
        <Link href="/sites/new">
          <Button size="sm">
            <Globe className="mr-2 h-4 w-4" />
            サイトを追加する
          </Button>
        </Link>
      </div>
    </div>
  );
}
