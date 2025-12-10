'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  Server,
  Activity,
  HardDrive,
  Clock,
  Settings,
  AlertCircle,
  ExternalLink,
  RefreshCw,
  Award,
  TrendingUp,
  Zap,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useSession } from '@/components/auth/session-provider';
import { staggerContainer, staggerItem, fadeInUp } from '@/lib/animations';
import type { PNode } from '@/lib/types';
import { formatBytes, formatUptime, truncatePubkey } from '@/lib/prpc-client';

export default function OperatorPage() {
  const session = useSession();
  const router = useRouter();
  const [claimedNodes, setClaimedNodes] = useState<PNode[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!session.isLoading && !session.isAuthenticated) {
      router.push('/');
    }
  }, [session.isLoading, session.isAuthenticated, router]);

  useEffect(() => {
    async function fetchClaimedNodes() {
      try {
        const response = await fetch('/api/pnodes');
        const data = await response.json();
        
        if (data.success && data.data?.nodes) {
          setClaimedNodes(data.data.nodes.slice(0, 3));
        }
      } catch (error) {
        console.error('Failed to fetch nodes:', error);
      } finally {
        setIsLoading(false);
      }
    }

    if (session.isAuthenticated) {
      fetchClaimedNodes();
    }
  }, [session.isAuthenticated]);

  if (session.isLoading || isLoading) {
    return (
      <div className="container mx-auto px-4 py-6 space-y-6">
        <Skeleton className="h-10 w-64" />
        <div className="grid md:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
        <Skeleton className="h-64" />
      </div>
    );
  }

  if (!session.isAuthenticated) {
    return null;
  }

  const totalStorage = claimedNodes.reduce((acc, n) => acc + n.storageCapacity, 0);
  const avgSri = claimedNodes.length > 0 
    ? Math.round(claimedNodes.reduce((acc, n) => acc + n.sri, 0) / claimedNodes.length)
    : 0;
  const onlineNodes = claimedNodes.filter((n) => n.status === 'online').length;

  return (
    <motion.div 
      className="container mx-auto px-4 py-6 space-y-6"
      initial="hidden"
      animate="visible"
      variants={staggerContainer}
    >
      {/* Header */}
      <motion.div variants={fadeInUp} className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold flex items-center gap-3">
            <div className="p-2 rounded-xl bg-primary/10">
              <Server className="h-6 w-6 text-primary" />
            </div>
            Operator Dashboard
          </h1>
          <p className="text-muted-foreground mt-1">
            Welcome back, <span className="text-primary font-medium">{session.user?.name || 'Operator'}</span>
          </p>
        </div>
        <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
          <Button variant="outline" onClick={() => window.location.reload()} className="gap-2">
            <RefreshCw className="h-4 w-4" />
            Refresh
          </Button>
        </motion.div>
      </motion.div>

      {/* Summary Stats */}
      <motion.div variants={fadeInUp} className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { icon: Server, label: 'Claimed Nodes', value: claimedNodes.length, color: 'primary', trend: '+1' },
          { icon: Activity, label: 'Online', value: `${onlineNodes}/${claimedNodes.length}`, color: 'green', trend: null },
          { icon: Award, label: 'Avg SRI Score', value: avgSri, color: 'yellow', trend: '+5' },
          { icon: HardDrive, label: 'Total Storage', value: formatBytes(totalStorage), color: 'blue', trend: null },
        ].map((stat, i) => (
          <motion.div
            key={stat.label}
            variants={staggerItem}
            whileHover={{ y: -4, transition: { duration: 0.2 } }}
          >
            <Card className="bg-card/50 backdrop-blur border-border/50 hover:border-primary/30 transition-colors">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg bg-${stat.color}-500/10`}>
                      <stat.icon className={`h-5 w-5 text-${stat.color}-500`} />
                    </div>
                    <div>
                      <p className="text-2xl font-bold">{stat.value}</p>
                      <p className="text-xs text-muted-foreground">{stat.label}</p>
                    </div>
                  </div>
                  {stat.trend && (
                    <Badge variant="outline" className="text-[10px] bg-green-500/10 text-green-500 border-green-500/30">
                      <TrendingUp className="h-3 w-3 mr-0.5" />
                      {stat.trend}
                    </Badge>
                  )}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </motion.div>

      {/* Nodes List */}
      <motion.div variants={fadeInUp}>
        <Card className="bg-card/50 backdrop-blur border-border/50">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-lg flex items-center gap-2">
              <Zap className="h-5 w-5 text-primary" />
              Your pNodes
            </CardTitle>
            <Badge variant="secondary">{claimedNodes.length} nodes</Badge>
          </CardHeader>
          <CardContent>
            {claimedNodes.length === 0 ? (
              <div className="text-center py-12">
                <motion.div
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ duration: 0.5 }}
                >
                  <Server className="h-16 w-16 mx-auto text-muted-foreground/30 mb-4" />
                </motion.div>
                <h3 className="font-semibold mb-2">No Claimed Nodes</h3>
                <p className="text-sm text-muted-foreground mb-4 max-w-md mx-auto">
                  You haven&apos;t claimed any pNodes yet. Visit a node&apos;s detail page to claim it and start earning rewards.
                </p>
                <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                  <Button asChild>
                    <Link href="/">Browse Nodes</Link>
                  </Button>
                </motion.div>
              </div>
            ) : (
              <div className="space-y-3">
                {claimedNodes.map((node, i) => (
                  <motion.div
                    key={node.pubkey}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.1 }}
                    className="p-4 rounded-xl border border-border/50 bg-background/50 hover:bg-accent/30 hover:border-primary/30 transition-all"
                  >
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                      <div className="flex items-center gap-4">
                        <div className="relative">
                          <div className={`w-3 h-3 rounded-full ${
                            node.status === 'online' 
                              ? 'bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.5)]' 
                              : 'bg-red-500'
                          }`} />
                          {node.status === 'online' && (
                            <div className="absolute inset-0 rounded-full bg-green-500 animate-ping opacity-30" />
                          )}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-semibold">
                              {node.displayName || truncatePubkey(node.pubkey, 6)}
                            </span>
                            <Badge variant="outline" className={
                              node.isLatestVersion
                                ? 'bg-green-500/10 text-green-500 border-green-500/20 text-[10px]'
                                : 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20 text-[10px]'
                            }>
                              {node.version.split('-').pop()}
                            </Badge>
                            {node.isIncentivized && (
                              <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20 text-[10px]">
                                <Award className="h-3 w-3 mr-1" />
                                Incentivized
                              </Badge>
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground">
                            📍 {node.geoCity}, {node.geoCountry}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-4 md:gap-6">
                        <div className="text-center">
                          <p className="text-lg font-bold text-primary">{node.sri}</p>
                          <p className="text-[10px] text-muted-foreground uppercase tracking-wide">SRI</p>
                        </div>
                        <div className="text-center">
                          <p className="text-lg font-bold text-green-500">{node.uptimePercent.toFixed(0)}%</p>
                          <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Uptime</p>
                        </div>
                        <div className="text-center">
                          <p className="text-lg font-bold">{node.peerCount}</p>
                          <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Peers</p>
                        </div>
                        <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                          <Button variant="outline" size="sm" asChild>
                            <Link href={`/node/${node.pubkey}`}>
                              <ExternalLink className="h-4 w-4 mr-1" />
                              Details
                            </Link>
                          </Button>
                        </motion.div>
                      </div>
                    </div>

                    {!node.isLatestVersion && (
                      <motion.div 
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="mt-3 p-2 rounded-lg bg-yellow-500/10 text-yellow-500 text-sm flex items-center gap-2"
                      >
                        <AlertCircle className="h-4 w-4" />
                        Update available: Your node is running an outdated version.
                      </motion.div>
                    )}
                  </motion.div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>

      {/* Quick Links */}
      <motion.div variants={fadeInUp} className="grid md:grid-cols-2 gap-4">
        <motion.div whileHover={{ y: -4 }} transition={{ duration: 0.2 }}>
          <Card className="bg-card/50 backdrop-blur border-border/50 hover:border-primary/30 transition-colors h-full">
            <CardContent className="p-6">
              <div className="flex items-center gap-3 mb-3">
                <div className="p-2 rounded-lg bg-primary/10">
                  <Settings className="h-5 w-5 text-primary" />
                </div>
                <h3 className="font-semibold">Operator Tools</h3>
              </div>
              <p className="text-sm text-muted-foreground mb-4">
                Diagnostic tools to help maintain your pNodes - port checker, version validator, and more.
              </p>
              <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                <Button asChild variant="outline" className="w-full">
                  <Link href="/tools">Open Tools</Link>
                </Button>
              </motion.div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div whileHover={{ y: -4 }} transition={{ duration: 0.2 }}>
          <Card className="bg-card/50 backdrop-blur border-border/50 hover:border-green-500/30 transition-colors h-full">
            <CardContent className="p-6">
              <div className="flex items-center gap-3 mb-3">
                <div className="p-2 rounded-lg bg-green-500/10">
                  <Clock className="h-5 w-5 text-green-500" />
                </div>
                <h3 className="font-semibold">Heartbeat Status</h3>
              </div>
              <p className="text-sm text-muted-foreground mb-4">
                All your nodes are sending heartbeats correctly. Network is healthy.
              </p>
              <Badge variant="outline" className="bg-green-500/10 text-green-500 border-green-500/20">
                <span className="relative flex h-2 w-2 mr-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                </span>
                All Systems Operational
              </Badge>
            </CardContent>
          </Card>
        </motion.div>
      </motion.div>
    </motion.div>
  );
}
