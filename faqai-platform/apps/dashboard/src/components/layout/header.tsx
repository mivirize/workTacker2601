'use client';

import { useRouter } from 'next/navigation';
import { Bell, ChevronDown, LogOut, Settings, User as UserIcon } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { useAuthStore } from '@/stores/auth-store';
import { useState, useRef, useEffect } from 'react';
import { cn } from '@/lib/utils';

export function Header() {
  const router = useRouter();
  const { user, clearAuth } = useAuthStore();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = () => {
    clearAuth();
    toast.success('ログアウトしました');
    router.push('/login');
  };

  const userInitials = user?.name
    ? user.name
        .split(' ')
        .map((n) => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2)
    : 'U';

  return (
    <header className="flex h-14 items-center justify-between border-b bg-card px-6">
      <div className="flex items-center gap-2">
        <span className="text-sm font-medium text-muted-foreground">
          組織名: <span className="text-foreground">Acme Corp</span>
        </span>
      </div>

      <div className="flex items-center gap-2">
        <Button variant="ghost" size="icon" className="relative" aria-label="通知">
          <Bell className="h-4 w-4" />
          <span className="absolute right-1 top-1 flex h-2 w-2 rounded-full bg-destructive" />
        </Button>

        <Separator orientation="vertical" className="h-6" />

        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            className="flex items-center gap-2 rounded-md px-2 py-1.5 text-sm hover:bg-accent transition-colors"
            aria-expanded={isDropdownOpen}
            aria-haspopup="true"
          >
            <div className="flex h-7 w-7 items-center justify-center rounded-full bg-primary text-xs font-semibold text-primary-foreground">
              {userInitials}
            </div>
            <span className="font-medium">{user?.name ?? 'ユーザー'}</span>
            <ChevronDown
              className={cn('h-3 w-3 text-muted-foreground transition-transform', {
                'rotate-180': isDropdownOpen,
              })}
            />
          </button>

          {isDropdownOpen && (
            <div className="absolute right-0 top-full z-50 mt-1 w-48 rounded-md border bg-card shadow-md">
              <div className="p-2">
                <div className="px-2 py-1.5">
                  <p className="text-xs font-medium">{user?.name}</p>
                  <p className="text-xs text-muted-foreground">{user?.email}</p>
                </div>
                <Separator className="my-1" />
                <button
                  onClick={() => {
                    setIsDropdownOpen(false);
                    router.push('/settings/profile');
                  }}
                  className="flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-sm hover:bg-accent transition-colors"
                >
                  <UserIcon className="h-3.5 w-3.5" />
                  プロフィール
                </button>
                <button
                  onClick={() => {
                    setIsDropdownOpen(false);
                    router.push('/settings');
                  }}
                  className="flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-sm hover:bg-accent transition-colors"
                >
                  <Settings className="h-3.5 w-3.5" />
                  設定
                </button>
                <Separator className="my-1" />
                <button
                  onClick={handleLogout}
                  className="flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-sm text-destructive hover:bg-destructive/10 transition-colors"
                >
                  <LogOut className="h-3.5 w-3.5" />
                  ログアウト
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
