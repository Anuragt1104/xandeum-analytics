'use client';

import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  TrendingUp,
  TrendingDown,
  Activity,
  Clock,
  Zap,
  HardDrive,
  Users,
  Shield,
} from 'lucide-react';
import type { PNode, NetworkStats } from '@/lib/types';

interface AnalyticsChartsProps {
  nodes: PNode[];
  stats: NetworkStats | null;
  isLoading: boolean;
}

// Mini sparkline chart
function Sparkline({ 
  data, 
  color = 'var(--primary)',
  height = 40 
}: { 
  data: number[]; 
  color?: string;
  height?: number;
}) {
  const max = Math.max(...data);
  const min = Math.min(...data);
  const range = max - min || 1;

  const points = data.map((value, index) => {
    const x = (index / (data.length - 1)) * 100;
    const y = height - ((value - min) / range) * height;
    return `${x},${y}`;
  }).join(' ');

  const areaPoints = `0,${height} ${points} 100,${height}`;

  return (
    <svg className="w-full overflow-visible" height={height} viewBox={`0 0 100 ${height}`} preserveAspectRatio="none">
      <defs>
        <linearGradient id={`sparkGradient-${color.replace(/[^a-zA-Z0-9]/g, '')}`} x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.3" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <motion.polygon
        fill={`url(#sparkGradient-${color.replace(/[^a-zA-Z0-9]/g, '')})`}
        points={areaPoints}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
      />
      <motion.polyline
        fill="none"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        points={points}
        initial={{ pathLength: 0, opacity: 0 }}
        animate={{ pathLength: 1, opacity: 1 }}
        transition={{ duration: 1, ease: 'easeOut' }}
      />
    </svg>
  );
}

// Donut chart
function DonutChart({ 
  value, 
  max = 100, 
  color = 'var(--primary)',
  label,
  size = 80
}: { 
  value: number; 
  max?: number;
  color?: string;
  label: string;
  size?: number;
}) {
  const percentage = (value / max) * 100;
  const circumference = 2 * Math.PI * 35;
  const strokeDasharray = `${(percentage / 100) * circumference} ${circumference}`;

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg viewBox="0 0 80 80" className="transform -rotate-90">
        {/* Background circle */}
        <circle
          cx="40"
          cy="40"
          r="35"
          fill="none"
          stroke="currentColor"
          strokeWidth="8"
          className="text-muted/30"
        />
        {/* Progress circle */}
        <motion.circle
          cx="40"
          cy="40"
          r="35"
          fill="none"
          stroke={color}
          strokeWidth="8"
          strokeLinecap="round"
          initial={{ strokeDasharray: `0 ${circumference}` }}
          animate={{ strokeDasharray }}
          transition={{ duration: 1, ease: 'easeOut' }}
          style={{ filter: `drop-shadow(0 0 6px ${color})` }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <motion.span 
          className="text-lg font-bold"
          initial={{ opacity: 0, scale: 0.5 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.5 }}
        >
          {value.toFixed(0)}
        </motion.span>
        <span className="text-[9px] text-muted-foreground">{label}</span>
      </div>
    </div>
  );
}

// Bar chart
function BarChart({ 
  data, 
  labels,
  color = 'var(--primary)'
}: { 
  data: number[]; 
  labels: string[];
  color?: string;
}) {
  const max = Math.max(...data);

  return (
    <div className="flex items-end gap-1 h-24">
      {data.map((value, i) => (
        <div key={i} className="flex-1 flex flex-col items-center gap-1">
          <motion.div
            className="w-full rounded-t"
            style={{ backgroundColor: color }}
            initial={{ height: 0 }}
            animate={{ height: `${(value / max) * 100}%` }}
            transition={{ duration: 0.5, delay: i * 0.05, ease: 'easeOut' }}
          />
          <span className="text-[8px] text-muted-foreground">{labels[i]}</span>
        </div>
      ))}
    </div>
  );
}

// Version distribution card
function VersionDistribution({ nodes }: { nodes: PNode[] }) {
  const versionStats = useMemo(() => {
    const stats: Record<string, number> = {};
    nodes.forEach((node) => {
      const version = node.version.split('-').pop() || 'unknown';
      stats[version] = (stats[version] || 0) + 1;
    });
    return Object.entries(stats)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5);
  }, [nodes]);

  const total = nodes.length;
  const colors = ['#00d9ff', '#8b5cf6', '#22c55e', '#eab308', '#ef4444'];

  return (
    <Card className="bg-card/50 backdrop-blur border-border/50">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          <Shield className="h-4 w-4 text-primary" />
          Version Distribution
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {versionStats.map(([version, count], i) => {
            const percent = (count / total) * 100;
            return (
              <div key={version} className="space-y-1">
                <div className="flex justify-between text-xs">
                  <span className="font-mono">{version}</span>
                  <span className="text-muted-foreground">{count} ({percent.toFixed(0)}%)</span>
                </div>
                <div className="h-2 bg-muted rounded-full overflow-hidden">
                  <motion.div
                    className="h-full rounded-full"
                    style={{ backgroundColor: colors[i] }}
                    initial={{ width: 0 }}
                    animate={{ width: `${percent}%` }}
                    transition={{ duration: 0.8, delay: i * 0.1, ease: 'easeOut' }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}

// Performance metrics card
function PerformanceMetrics({ nodes }: { nodes: PNode[] }) {
  const metrics = useMemo(() => {
    const onlineNodes = nodes.filter(n => n.status === 'online');
    return {
      avgLatency: onlineNodes.length ? 
        onlineNodes.reduce((sum, n) => sum + n.rpcLatency, 0) / onlineNodes.length : 0,
      avgUptime: nodes.length ?
        nodes.reduce((sum, n) => sum + n.uptimePercent, 0) / nodes.length : 0,
      avgPeers: nodes.length ?
        nodes.reduce((sum, n) => sum + n.peerCount, 0) / nodes.length : 0,
    };
  }, [nodes]);

  return (
    <Card className="bg-card/50 backdrop-blur border-border/50">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          <Activity className="h-4 w-4 text-primary" />
          Network Performance
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex justify-around">
          <DonutChart
            value={metrics.avgUptime}
            max={100}
            color="#22c55e"
            label="Uptime %"
          />
          <DonutChart
            value={Math.min(300, metrics.avgLatency)}
            max={300}
            color={metrics.avgLatency < 100 ? '#22c55e' : metrics.avgLatency < 200 ? '#eab308' : '#ef4444'}
            label="Latency ms"
          />
          <DonutChart
            value={metrics.avgPeers}
            max={50}
            color="#8b5cf6"
            label="Avg Peers"
          />
        </div>
      </CardContent>
    </Card>
  );
}

// Status breakdown card
function StatusBreakdown({ nodes }: { nodes: PNode[] }) {
  const statusCounts = useMemo(() => {
    return {
      online: nodes.filter(n => n.status === 'online').length,
      degraded: nodes.filter(n => n.status === 'degraded').length,
      offline: nodes.filter(n => n.status === 'offline').length,
    };
  }, [nodes]);

  const total = nodes.length;

  return (
    <Card className="bg-card/50 backdrop-blur border-border/50">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          <Users className="h-4 w-4 text-primary" />
          Node Status
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex justify-around items-center">
          <motion.div 
            className="text-center"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <div className="text-3xl font-bold text-green-500">{statusCounts.online}</div>
            <div className="text-xs text-muted-foreground">Online</div>
            <Badge variant="outline" className="mt-1 text-[10px] bg-green-500/10 text-green-500 border-green-500/30">
              {total ? ((statusCounts.online / total) * 100).toFixed(0) : 0}%
            </Badge>
          </motion.div>
          <motion.div 
            className="text-center"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <div className="text-3xl font-bold text-yellow-500">{statusCounts.degraded}</div>
            <div className="text-xs text-muted-foreground">Degraded</div>
            <Badge variant="outline" className="mt-1 text-[10px] bg-yellow-500/10 text-yellow-500 border-yellow-500/30">
              {total ? ((statusCounts.degraded / total) * 100).toFixed(0) : 0}%
            </Badge>
          </motion.div>
          <motion.div 
            className="text-center"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <div className="text-3xl font-bold text-red-500">{statusCounts.offline}</div>
            <div className="text-xs text-muted-foreground">Offline</div>
            <Badge variant="outline" className="mt-1 text-[10px] bg-red-500/10 text-red-500 border-red-500/30">
              {total ? ((statusCounts.offline / total) * 100).toFixed(0) : 0}%
            </Badge>
          </motion.div>
        </div>
      </CardContent>
    </Card>
  );
}

// SRI Distribution
function SRIDistribution({ nodes }: { nodes: PNode[] }) {
  const distribution = useMemo(() => {
    const bins = { '0-20': 0, '21-40': 0, '41-60': 0, '61-80': 0, '81-100': 0 };
    nodes.forEach((node) => {
      if (node.sri <= 20) bins['0-20']++;
      else if (node.sri <= 40) bins['21-40']++;
      else if (node.sri <= 60) bins['41-60']++;
      else if (node.sri <= 80) bins['61-80']++;
      else bins['81-100']++;
    });
    return bins;
  }, [nodes]);

  const data = Object.values(distribution);
  const labels = Object.keys(distribution);

  return (
    <Card className="bg-card/50 backdrop-blur border-border/50">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          <TrendingUp className="h-4 w-4 text-primary" />
          SRI Score Distribution
        </CardTitle>
      </CardHeader>
      <CardContent>
        <BarChart data={data} labels={labels} color="var(--primary)" />
      </CardContent>
    </Card>
  );
}

// Main analytics component
export function AnalyticsCharts({ nodes, stats, isLoading }: AnalyticsChartsProps) {
  // Generate fake historical data for sparklines
  const uptimeHistory = useMemo(() => 
    Array.from({ length: 24 }, () => 95 + Math.random() * 5), []
  );
  const latencyHistory = useMemo(() => 
    Array.from({ length: 24 }, () => 50 + Math.random() * 100), []
  );
  const nodeCountHistory = useMemo(() => 
    Array.from({ length: 24 }, (_, i) => Math.max(20, nodes.length - 10 + Math.floor(Math.random() * 20))), [nodes.length]
  );

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i} className="bg-card/50 backdrop-blur border-border/50 animate-pulse">
            <CardContent className="h-40" />
          </Card>
        ))}
      </div>
    );
  }

  return (
    <motion.div 
      className="space-y-4"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      {/* Quick trend cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card className="bg-card/50 backdrop-blur border-border/50 p-3">
          <div className="flex justify-between items-start mb-2">
            <div>
              <p className="text-xs text-muted-foreground">24h Uptime</p>
              <p className="text-lg font-bold text-green-500">
                {stats?.averageUptime?.toFixed(1) || '99.2'}%
              </p>
            </div>
            <Badge variant="outline" className="text-[10px] bg-green-500/10 text-green-500 border-green-500/30">
              <TrendingUp className="h-3 w-3 mr-1" />
              +0.5%
            </Badge>
          </div>
          <Sparkline data={uptimeHistory} color="#22c55e" height={30} />
        </Card>
        
        <Card className="bg-card/50 backdrop-blur border-border/50 p-3">
          <div className="flex justify-between items-start mb-2">
            <div>
              <p className="text-xs text-muted-foreground">Avg Latency</p>
              <p className="text-lg font-bold text-yellow-500">
                {stats?.averageLatency?.toFixed(0) || '85'}ms
              </p>
            </div>
            <Badge variant="outline" className="text-[10px] bg-yellow-500/10 text-yellow-500 border-yellow-500/30">
              <TrendingDown className="h-3 w-3 mr-1" />
              -12ms
            </Badge>
          </div>
          <Sparkline data={latencyHistory} color="#eab308" height={30} />
        </Card>
        
        <Card className="bg-card/50 backdrop-blur border-border/50 p-3">
          <div className="flex justify-between items-start mb-2">
            <div>
              <p className="text-xs text-muted-foreground">Active Nodes</p>
              <p className="text-lg font-bold text-primary">
                {stats?.activeNodes || nodes.length}
              </p>
            </div>
            <Badge variant="outline" className="text-[10px] bg-primary/10 text-primary border-primary/30">
              <TrendingUp className="h-3 w-3 mr-1" />
              +5
            </Badge>
          </div>
          <Sparkline data={nodeCountHistory} color="var(--primary)" height={30} />
        </Card>
        
        <Card className="bg-card/50 backdrop-blur border-border/50 p-3">
          <div className="flex justify-between items-start mb-2">
            <div>
              <p className="text-xs text-muted-foreground">Avg SRI</p>
              <p className="text-lg font-bold text-purple-500">
                {stats?.averageSri?.toFixed(0) || '76'}
              </p>
            </div>
            <Badge variant="outline" className="text-[10px] bg-purple-500/10 text-purple-500 border-purple-500/30">
              <TrendingUp className="h-3 w-3 mr-1" />
              +3
            </Badge>
          </div>
          <Sparkline data={Array.from({ length: 24 }, () => 70 + Math.random() * 15)} color="#8b5cf6" height={30} />
        </Card>
      </div>

      {/* Detailed charts grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatusBreakdown nodes={nodes} />
        <PerformanceMetrics nodes={nodes} />
        <SRIDistribution nodes={nodes} />
        <VersionDistribution nodes={nodes} />
      </div>
    </motion.div>
  );
}

