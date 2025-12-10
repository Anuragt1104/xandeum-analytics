'use client';

import { 
  Server, 
  HardDrive, 
  Activity, 
  Clock, 
  Zap, 
  CheckCircle2 
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import type { NetworkStats } from '@/lib/types';
import { formatBytes } from '@/lib/prpc-client';

interface StatsCardsProps {
  stats: NetworkStats | null;
  isLoading: boolean;
}

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: React.ReactNode;
  trend?: 'up' | 'down' | 'neutral';
  isLoading?: boolean;
}

function StatCard({ title, value, subtitle, icon, isLoading }: StatCardProps) {
  return (
    <Card className="bg-card/50 backdrop-blur border-border/50 hover:border-primary/30 transition-colors">
      <CardContent className="p-4 md:p-6">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <p className="text-xs md:text-sm text-muted-foreground font-medium">{title}</p>
            {isLoading ? (
              <Skeleton className="h-8 w-24" />
            ) : (
              <p className="text-xl md:text-2xl font-bold text-foreground">{value}</p>
            )}
            {subtitle && !isLoading && (
              <p className="text-xs text-muted-foreground">{subtitle}</p>
            )}
          </div>
          <div className="p-2 md:p-3 rounded-lg bg-primary/10 text-primary">
            {icon}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export function StatsCards({ stats, isLoading }: StatsCardsProps) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 md:gap-4">
      <StatCard
        title="Total pNodes"
        value={stats?.totalNodes ?? 0}
        subtitle={`${stats?.activeNodes ?? 0} online`}
        icon={<Server className="h-4 w-4 md:h-5 md:w-5" />}
        isLoading={isLoading}
      />
      <StatCard
        title="Network Storage"
        value={stats ? formatBytes(stats.totalStorageCapacity) : '0 B'}
        subtitle={`${stats ? formatBytes(stats.totalStorageUsed) : '0 B'} used`}
        icon={<HardDrive className="h-4 w-4 md:h-5 md:w-5" />}
        isLoading={isLoading}
      />
      <StatCard
        title="Average SRI"
        value={stats?.averageSri ?? 0}
        subtitle="Storage Reliability Index"
        icon={<Activity className="h-4 w-4 md:h-5 md:w-5" />}
        isLoading={isLoading}
      />
      <StatCard
        title="Avg Uptime"
        value={`${stats?.averageUptime ?? 0}%`}
        subtitle="Last 24 hours"
        icon={<Clock className="h-4 w-4 md:h-5 md:w-5" />}
        isLoading={isLoading}
      />
      <StatCard
        title="Avg Latency"
        value={`${stats?.averageLatency ?? 0}ms`}
        subtitle="RPC response time"
        icon={<Zap className="h-4 w-4 md:h-5 md:w-5" />}
        isLoading={isLoading}
      />
      <StatCard
        title="Latest Version"
        value={`${stats?.nodesOnLatestVersion ?? 0}`}
        subtitle={stats?.latestVersion ?? 'v0.5.0'}
        icon={<CheckCircle2 className="h-4 w-4 md:h-5 md:w-5" />}
        isLoading={isLoading}
      />
    </div>
  );
}
