import { PageHeader } from '@/components/layout/page-header';
import { KpiCards } from '@/components/dashboard/kpi-cards';
import { RecentActivity } from '@/components/dashboard/recent-activity';
import { WelcomeBanner } from '@/components/dashboard/welcome-banner';

export default function DashboardPage() {
  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title="ダッシュボード"
        description="プラットフォームの利用状況の概要"
      />
      <WelcomeBanner />
      <KpiCards />
      <RecentActivity />
    </div>
  );
}
