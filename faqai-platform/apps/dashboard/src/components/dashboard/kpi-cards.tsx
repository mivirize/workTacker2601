import { FileQuestion, MessageSquare, CheckCircle2, Mail } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface KpiCardProps {
  title: string;
  value: string;
  change: string;
  changeType: 'positive' | 'negative' | 'neutral';
  icon: React.ComponentType<{ className?: string }>;
  iconClassName?: string;
}

function KpiCard({ title, value, change, changeType, icon: Icon, iconClassName }: KpiCardProps) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {title}
        </CardTitle>
        <div className={cn('flex h-8 w-8 items-center justify-center rounded-md', iconClassName)}>
          <Icon className="h-4 w-4" />
        </div>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        <p
          className={cn('mt-1 text-xs', {
            'text-green-600': changeType === 'positive',
            'text-destructive': changeType === 'negative',
            'text-muted-foreground': changeType === 'neutral',
          })}
        >
          {change}
        </p>
      </CardContent>
    </Card>
  );
}

const kpiData: KpiCardProps[] = [
  {
    title: 'FAQ総数',
    value: '0',
    change: 'サイトを追加してFAQを生成しましょう',
    changeType: 'neutral',
    icon: FileQuestion,
    iconClassName: 'bg-blue-50 text-blue-600',
  },
  {
    title: 'チャットセッション',
    value: '0',
    change: 'チャットボットを設定すると表示されます',
    changeType: 'neutral',
    icon: MessageSquare,
    iconClassName: 'bg-purple-50 text-purple-600',
  },
  {
    title: 'チャットボット解決率',
    value: '-',
    change: 'チャットボット設定後に計測開始',
    changeType: 'neutral',
    icon: CheckCircle2,
    iconClassName: 'bg-green-50 text-green-600',
  },
  {
    title: '未対応問い合わせ',
    value: '0',
    change: '問い合わせがありません',
    changeType: 'neutral',
    icon: Mail,
    iconClassName: 'bg-orange-50 text-orange-600',
  },
];

export function KpiCards() {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {kpiData.map((kpi) => (
        <KpiCard key={kpi.title} {...kpi} />
      ))}
    </div>
  );
}
