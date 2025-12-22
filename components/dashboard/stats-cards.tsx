'use client';

import { useEffect, useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { 
  Server, 
  HardDrive, 
  Activity, 
  Clock, 
  Zap, 
  CheckCircle2,
  TrendingUp,
  TrendingDown,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { staggerContainer, staggerItem } from '@/lib/animations';
import type { NetworkStats } from '@/lib/types';
import { formatBytes } from '@/lib/prpc-client';

interface StatsCardsProps {
  stats: NetworkStats | null;
  isLoading: boolean;
}

// Animated counter hook with easing
function useAnimatedCounter(
  end: number, 
  duration: number = 1500, 
  decimals: number = 0,
  enabled: boolean = true
) {
  const [count, setCount] = useState(0);
  const countRef = useRef(0);

  useEffect(() => {
    if (!enabled || end === 0) {
      setCount(0);
      return;
    }

    let startTime: number;
    let animationFrame: number;

    const animate = (timestamp: number) => {
      if (!startTime) startTime = timestamp;
      const progress = Math.min((timestamp - startTime) / duration, 1);
      
      // Ease out quart for smooth deceleration
      const easeOutQuart = 1 - Math.pow(1 - progress, 4);
      const currentValue = easeOutQuart * end;
      
      countRef.current = currentValue;
      setCount(Number(currentValue.toFixed(decimals)));

      if (progress < 1) {
        animationFrame = requestAnimationFrame(animate);
      }
    };

    // Small delay before starting animation
    const timeout = setTimeout(() => {
      animationFrame = requestAnimationFrame(animate);
    }, 100);

    return () => {
      clearTimeout(timeout);
      cancelAnimationFrame(animationFrame);
    };
  }, [end, duration, decimals, enabled]);

  return count;
}

// Mini sparkline chart
function Sparkline({ data, color = 'var(--primary)' }: { data: number[]; color?: string }) {
  const max = Math.max(...data);
  const min = Math.min(...data);
  const range = max - min || 1;
  
  const points = data.map((value, index) => {
    const x = (index / (data.length - 1)) * 100;
    const y = 100 - ((value - min) / range) * 100;
    return `${x},${y}`;
  }).join(' ');

  return (
    <svg className="w-full h-8 overflow-visible" viewBox="0 0 100 100" preserveAspectRatio="none">
      <defs>
        <linearGradient id={`gradient-${color.replace(/[^a-zA-Z0-9]/g, '')}`} x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.3" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <motion.polyline
        fill="none"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        points={points}
        initial={{ pathLength: 0, opacity: 0 }}
        animate={{ pathLength: 1, opacity: 1 }}
        transition={{ duration: 1.5, ease: 'easeOut', delay: 0.5 }}
      />
      <motion.polygon
        fill={`url(#gradient-${color.replace(/[^a-zA-Z0-9]/g, '')})`}
        points={`0,100 ${points} 100,100`}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5, delay: 1 }}
      />
    </svg>
  );
}

interface StatCardProps {
  title: string;
  value: string | number;
  rawValue?: number;
  subtitle?: string;
  icon: React.ReactNode;
  trend?: 'up' | 'down' | 'neutral';
  trendValue?: string;
  isLoading?: boolean;
  color?: string;
  sparklineData?: number[];
  index?: number;
}

function StatCard({
  title,
  value,
  rawValue,
  subtitle,
  icon,
  trend,
  trendValue,
  isLoading,
  color = 'var(--primary)',
  sparklineData,
  index = 0,
}: StatCardProps) {
  const animatedValue = useAnimatedCounter(
    rawValue || 0,
    1500,
    typeof rawValue === 'number' && rawValue < 100 ? 1 : 0,
    !isLoading && rawValue !== undefined
  );

  // Generate deterministic sparkline data if not provided (based on index for consistency)
  const chartData = sparklineData || Array.from({ length: 12 }, (_, i) => {
    // Use a seeded pseudo-random based on index to avoid hydration mismatch
    const seed = (index * 12 + i + 1) * 9301 + 49297;
    return ((seed % 233280) / 233280) * 30 + 70;
  });

  return (
    <motion.div
      variants={staggerItem}
      whileHover={{ 
        y: -4, 
        transition: { duration: 0.2 } 
      }}
      className="h-full"
    >
      <Card className="h-full bg-card/50 backdrop-blur border-border/50 hover:border-primary/30 transition-all duration-300 overflow-hidden group">
        <CardContent className="p-4 md:p-5 h-full flex flex-col">
          <div className="flex items-start justify-between mb-3">
            <div className="space-y-1 flex-1 min-w-0">
              <p className="text-xs md:text-sm text-muted-foreground font-medium truncate">
                {title}
              </p>
              {isLoading ? (
                <Skeleton className="h-8 w-20" />
              ) : (
                <motion.div 
                  className="flex items-baseline gap-2"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                >
                  <p className="text-xl md:text-2xl font-bold text-foreground tabular-nums">
                    {rawValue !== undefined ? (
                      typeof value === 'string' && value.includes('B') 
                        ? value // Keep formatted bytes
                        : animatedValue.toLocaleString()
                    ) : value}
                    {typeof value === 'string' && value.includes('%') && '%'}
                    {typeof value === 'string' && value.includes('ms') && 'ms'}
                  </p>
                  {trend && (
                    <span className={`flex items-center text-xs font-medium ${
                      trend === 'up' ? 'text-green-500' : 
                      trend === 'down' ? 'text-red-500' : 
                      'text-muted-foreground'
                    }`}>
                      {trend === 'up' && <TrendingUp className="h-3 w-3 mr-0.5" />}
                      {trend === 'down' && <TrendingDown className="h-3 w-3 mr-0.5" />}
                      {trendValue}
                    </span>
                  )}
                </motion.div>
              )}
              {subtitle && !isLoading && (
                <p className="text-[10px] md:text-xs text-muted-foreground truncate">
                  {subtitle}
                </p>
              )}
            </div>
            <motion.div 
              className="p-2 md:p-2.5 rounded-lg transition-all duration-300"
              style={{ 
                backgroundColor: `color-mix(in oklch, ${color} 15%, transparent)`,
                color: color,
              }}
              whileHover={{ scale: 1.1, rotate: 5 }}
            >
              {icon}
            </motion.div>
          </div>
          
          {/* Sparkline chart */}
          <div className="mt-auto pt-2 opacity-60 group-hover:opacity-100 transition-opacity">
            <Sparkline data={chartData} color={color} />
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

export function StatsCards({ stats, isLoading }: StatsCardsProps) {
  return (
    <motion.div 
      className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 md:gap-4"
      variants={staggerContainer}
      initial="hidden"
      animate="visible"
    >
      <StatCard
        title="Total pNodes"
        value={stats?.totalNodes ?? 0}
        rawValue={stats?.totalNodes}
        subtitle={`${stats?.activeNodes ?? 0} online`}
        icon={<Server className="h-4 w-4 md:h-5 md:w-5" />}
        isLoading={isLoading}
        color="var(--primary)"
        trend="up"
        trendValue="+12%"
        index={0}
      />
      <StatCard
        title="Network Storage"
        value={stats ? formatBytes(stats.totalStorageCapacity) : '0 B'}
        subtitle={`${stats ? formatBytes(stats.totalStorageUsed) : '0 B'} used`}
        icon={<HardDrive className="h-4 w-4 md:h-5 md:w-5" />}
        isLoading={isLoading}
        color="var(--chart-2)"
        index={1}
      />
      <StatCard
        title="Average SRI"
        value={stats?.averageSri ?? 0}
        rawValue={stats?.averageSri}
        subtitle="Storage Reliability Index"
        icon={<Activity className="h-4 w-4 md:h-5 md:w-5" />}
        isLoading={isLoading}
        color="var(--chart-4)"
        trend="up"
        trendValue="+5"
        index={2}
      />
      <StatCard
        title="Avg Uptime"
        value={`${stats?.averageUptime ?? 0}%`}
        rawValue={stats?.averageUptime}
        subtitle="Last 24 hours"
        icon={<Clock className="h-4 w-4 md:h-5 md:w-5" />}
        isLoading={isLoading}
        color="var(--success)"
        index={3}
      />
      <StatCard
        title="Avg Latency"
        value={`${stats?.averageLatency ?? 0}ms`}
        rawValue={stats?.averageLatency}
        subtitle="RPC response time"
        icon={<Zap className="h-4 w-4 md:h-5 md:w-5" />}
        isLoading={isLoading}
        color="var(--warning)"
        trend="down"
        trendValue="-15ms"
        index={4}
      />
      <StatCard
        title="Latest Version"
        value={stats?.nodesOnLatestVersion ?? 0}
        rawValue={stats?.nodesOnLatestVersion}
        subtitle={stats?.latestVersion ?? 'v0.5.0'}
        icon={<CheckCircle2 className="h-4 w-4 md:h-5 md:w-5" />}
        isLoading={isLoading}
        color="var(--chart-3)"
        index={5}
      />
    </motion.div>
  );
}
