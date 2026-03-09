'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { Globe, ArrowRight } from 'lucide-react';
import { PageHeader } from '@/components/layout/page-header';
import { Spinner } from '@/components/ui/spinner';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useSitesStore } from '@/stores/sites-store';

export default function FaqsRedirectPage() {
  const sites = useSitesStore((s) => s.sites);
  const isLoading = useSitesStore((s) => s.isLoading);
  const fetchSites = useSitesStore((s) => s.fetchSites);

  useEffect(() => {
    fetchSites();
  }, [fetchSites]);

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title="FAQ管理"
        description="サイトを選択してFAQを管理してください"
      />

      {isLoading && (
        <div className="flex justify-center py-12">
          <Spinner size="lg" />
        </div>
      )}

      {!isLoading && sites.length === 0 && (
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed py-16 text-center">
          <Globe className="h-12 w-12 text-muted-foreground/40 mb-4" />
          <p className="text-sm font-medium">サイトがまだありません</p>
          <p className="text-xs text-muted-foreground mt-1">
            まず「サイト管理」からサイトを追加してください
          </p>
          <Link
            href="/sites"
            className="mt-4 inline-flex items-center gap-1 text-sm text-primary hover:underline"
          >
            サイト管理へ
            <ArrowRight className="h-3 w-3" />
          </Link>
        </div>
      )}

      {!isLoading && sites.length > 0 && (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {sites.map((site) => (
            <Link key={site.id} href={`/sites/${site.id}/faqs`}>
              <Card className="overflow-hidden hover:border-primary/30 hover:shadow-sm transition-all cursor-pointer">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Globe className="h-4 w-4 text-muted-foreground shrink-0" />
                    {site.name}
                  </CardTitle>
                  <CardDescription className="truncate">
                    {site.url}
                  </CardDescription>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>FAQ管理</span>
                    <ArrowRight className="h-3.5 w-3.5" />
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
