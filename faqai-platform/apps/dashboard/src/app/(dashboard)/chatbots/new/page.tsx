'use client';

import Link from 'next/link';
import { Bot, ArrowRight } from 'lucide-react';
import { buttonVariants } from '@/components/ui/button';

export default function ChatbotNewRedirectPage() {
  return (
    <div className="flex flex-col items-center justify-center py-24 text-center space-y-6">
      <div className="rounded-full bg-muted p-6">
        <Bot className="h-10 w-10 text-muted-foreground" />
      </div>
      <div className="space-y-2">
        <h2 className="text-xl font-semibold">チャットボットはサイトごとに管理します</h2>
        <p className="text-sm text-muted-foreground max-w-md">
          チャットボットを作成するには、まず対象のサイトを選択してください。
          サイト詳細ページのチャットボットタブから新規作成できます。
        </p>
      </div>
      <Link href="/sites" className={buttonVariants()}>
        サイト一覧へ
        <ArrowRight className="h-4 w-4 ml-2" />
      </Link>
    </div>
  );
}
