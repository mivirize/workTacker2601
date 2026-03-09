'use client';

import { useEffect } from 'react';
import { useParams, usePathname } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft,
  LayoutDashboard,
  FileQuestion,
  Settings,
  Globe,
  Bot,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useSiteContextStore } from '@/stores/site-context-store';
import { Spinner } from '@/components/ui/spinner';

const siteNavItems = [
  { href: '', label: '概要', icon: LayoutDashboard, exact: true },
  { href: '/faqs', label: 'FAQ管理', icon: FileQuestion },
  { href: '/chatbots', label: 'チャットボット', icon: Bot },
  { href: '/settings', label: '設定', icon: Settings },
];

export default function SiteDetailLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const params = useParams();
  const pathname = usePathname();
  const siteId = params.siteId as string;

  const currentSite = useSiteContextStore((s) => s.currentSite);
  const isLoading = useSiteContextStore((s) => s.isLoading);
  const error = useSiteContextStore((s) => s.error);
  const fetchSite = useSiteContextStore((s) => s.fetchSite);

  useEffect(() => {
    if (!currentSite || currentSite.id !== siteId) {
      fetchSite(siteId);
    }
  }, [siteId, currentSite, fetchSite]);

  const basePath = `/sites/${siteId}`;

  const isActive = (href: string, exact?: boolean) => {
    const fullPath = `${basePath}${href}`;
    if (exact) return pathname === fullPath;
    return pathname.startsWith(fullPath);
  };

  if (isLoading && !currentSite) {
    return (
      <div className="flex items-center justify-center py-20">
        <Spinner size="lg" />
      </div>
    );
  }

  if (error && !currentSite) {
    return (
      <div className="space-y-4 animate-fade-in">
        <Link
          href="/sites"
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          サイト一覧へ戻る
        </Link>
        <div className="rounded-md border border-destructive/20 bg-destructive/5 p-4 text-sm text-destructive">
          {error}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 animate-fade-in">
      {/* Breadcrumb + Site name */}
      <div className="flex items-center gap-3">
        <Link
          href="/sites"
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          サイト一覧
        </Link>
        <span className="text-muted-foreground/40">|</span>
        <div className="flex items-center gap-2">
          {currentSite?.themeColor ? (
            <div
              className="h-5 w-5 rounded-md shrink-0"
              style={{ backgroundColor: currentSite.themeColor }}
            />
          ) : (
            <Globe className="h-5 w-5 text-muted-foreground shrink-0" />
          )}
          <h1 className="text-lg font-semibold truncate">
            {currentSite?.name ?? 'サイト'}
          </h1>
        </div>
      </div>

      {/* Site sub-navigation */}
      <nav className="border-b">
        <div className="flex gap-0">
          {siteNavItems.map((item) => {
            const active = isActive(item.href, item.exact);
            return (
              <Link
                key={item.href}
                href={`${basePath}${item.href}`}
                className={cn(
                  'flex items-center gap-2 border-b-2 px-4 py-2.5 text-sm font-medium transition-colors',
                  active
                    ? 'border-primary text-primary'
                    : 'border-transparent text-muted-foreground hover:text-foreground hover:border-muted-foreground/30',
                )}
              >
                <item.icon className="h-4 w-4" />
                {item.label}
              </Link>
            );
          })}
        </div>
      </nav>

      {/* Page content */}
      <div>{children}</div>
    </div>
  );
}
