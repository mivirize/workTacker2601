import { ActivityIcon } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export function RecentActivity() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">最近のアクティビティ</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col items-center justify-center py-8 text-center">
          <ActivityIcon className="h-10 w-10 text-muted-foreground/40" />
          <p className="mt-3 text-sm text-muted-foreground">
            まだアクティビティはありません
          </p>
          <p className="mt-1 text-xs text-muted-foreground/70">
            サイトを追加してFAQを生成すると、ここにアクティビティが表示されます
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
