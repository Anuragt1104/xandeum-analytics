'use client';

import { useEffect, useState, use } from 'react';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import {
  ArrowLeft,
  Copy,
  Check,
  ExternalLink,
  Globe,
  Server,
  Clock,
  HardDrive,
  Activity,
  Zap,
  Users,
  Award,
  Sparkles,
  MapPin,
  Shield,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { PerformanceChart, generateMockData } from '@/components/charts/performance-chart';
import { AvailabilityHeatmap } from '@/components/charts/availability-heatmap';
import { ClaimNodeModal } from '@/components/auth/claim-node';
import type { PNode } from '@/lib/types';
import { formatBytes, formatUptime, truncatePubkey } from '@/lib/prpc-client';

interface PageProps {
  params: Promise<{ pubkey: string }>;
}

function StatusBadge({ status }: { status: PNode['status'] }) {
  const variants = {
    online: 'bg-green-500/10 text-green-500 border-green-500/20',
    offline: 'bg-red-500/10 text-red-500 border-red-500/20',
    degraded: 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20',
  };

  return (
    <Badge variant="outline" className={`${variants[status]} text-sm`}>
      <span
        className={`mr-2 h-2 w-2 rounded-full ${
          status === 'online'
            ? 'bg-green-500 animate-pulse'
            : status === 'offline'
            ? 'bg-red-500'
            : 'bg-yellow-500'
        }`}
      />
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </Badge>
  );
}

function StatCard({
  title,
  value,
  icon,
  subtitle,
}: {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  subtitle?: string;
}) {
  return (
    <Card className="bg-card/50 backdrop-blur">
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-xs text-muted-foreground">{title}</p>
            <p className="text-xl font-bold mt-1">{value}</p>
            {subtitle && (
              <p className="text-xs text-muted-foreground mt-0.5">{subtitle}</p>
            )}
          </div>
          <div className="p-2 rounded-lg bg-primary/10 text-primary">{icon}</div>
        </div>
      </CardContent>
    </Card>
  );
}

export default function NodeDetailPage({ params }: PageProps) {
  const { pubkey } = use(params);
  const { data: session } = useSession();
  const [node, setNode] = useState<PNode | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [showClaimModal, setShowClaimModal] = useState(false);

  useEffect(() => {
    async function fetchNode() {
      try {
        const response = await fetch('/api/pnodes');
        const data = await response.json();
        
        if (data.success && data.data?.nodes) {
          const foundNode = data.data.nodes.find(
            (n: PNode) => n.pubkey === pubkey
          );
          setNode(foundNode || null);
        }
      } catch (error) {
        console.error('Failed to fetch node:', error);
      } finally {
        setIsLoading(false);
      }
    }

    fetchNode();
  }, [pubkey]);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(pubkey);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-6 space-y-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-64 w-full" />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[...Array(8)].map((_, i) => (
            <Skeleton key={i} className="h-24 w-full" />
          ))}
        </div>
      </div>
    );
  }

  if (!node) {
    return (
      <div className="container mx-auto px-4 py-6">
        <div className="text-center py-12">
          <h1 className="text-2xl font-bold mb-2">Node Not Found</h1>
          <p className="text-muted-foreground mb-4">
            The pNode with pubkey &quot;{truncatePubkey(pubkey, 8)}&quot; was not found.
          </p>
          <Button asChild>
            <Link href="/">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Dashboard
            </Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-2">
          <Button variant="ghost" size="sm" asChild className="-ml-2">
            <Link href="/">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Dashboard
            </Link>
          </Button>
          
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold">
              {node.displayName || 'pNode Details'}
            </h1>
            <StatusBadge status={node.status} />
            {node.isIncentivized && (
              <Badge variant="outline" className="bg-yellow-500/10 text-yellow-500 border-yellow-500/20">
                <Award className="mr-1 h-3 w-3" />
                Incentivized
              </Badge>
            )}
            {node.hasNftMultiplier && (
              <Badge variant="outline" className="bg-purple-500/10 text-purple-500 border-purple-500/20">
                <Sparkles className="mr-1 h-3 w-3" />
                NFT Boost
              </Badge>
            )}
          </div>
          
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <code className="font-mono">{node.pubkey}</code>
            <Button variant="ghost" size="icon" className="h-6 w-6" onClick={handleCopy}>
              {copied ? (
                <Check className="h-3 w-3 text-green-500" />
              ) : (
                <Copy className="h-3 w-3" />
              )}
            </Button>
          </div>
        </div>

        {/* Claim Button */}
        <Button
          variant="outline"
          className="shrink-0"
          onClick={() => setShowClaimModal(true)}
        >
          <Shield className="h-4 w-4 mr-2" />
          Claim This Node
        </Button>
      </div>

      {/* Claim Modal */}
      {showClaimModal && node && (
        <ClaimNodeModal
          isOpen={showClaimModal}
          onClose={() => setShowClaimModal(false)}
          node={node}
        />
      )}

      {/* Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard
          title="Storage Reliability Index"
          value={node.sri}
          icon={<Activity className="h-4 w-4" />}
          subtitle="Out of 100"
        />
        <StatCard
          title="Uptime"
          value={`${node.uptimePercent.toFixed(1)}%`}
          icon={<Clock className="h-4 w-4" />}
          subtitle={formatUptime(node.uptime)}
        />
        <StatCard
          title="Storage Used"
          value={formatBytes(node.storageUsed)}
          icon={<HardDrive className="h-4 w-4" />}
          subtitle={`of ${formatBytes(node.storageCapacity)}`}
        />
        <StatCard
          title="RPC Latency"
          value={node.status === 'online' ? `${node.rpcLatency}ms` : '—'}
          icon={<Zap className="h-4 w-4" />}
          subtitle="Response time"
        />
      </div>

      {/* Tabs */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList className="bg-card/50">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
          <TabsTrigger value="network">Network</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            {/* Node Info */}
            <Card className="bg-card/50 backdrop-blur">
              <CardHeader>
                <CardTitle className="text-sm font-medium">Node Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-muted-foreground flex items-center gap-2">
                    <Globe className="h-4 w-4" />
                    IP Address
                  </span>
                  <span className="font-mono">{node.ipAddress}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground flex items-center gap-2">
                    <Server className="h-4 w-4" />
                    Port
                  </span>
                  <span>{node.port}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground flex items-center gap-2">
                    <MapPin className="h-4 w-4" />
                    Location
                  </span>
                  <span>
                    {node.geoCity && node.geoCountry
                      ? `${node.geoCity}, ${node.geoCountry}`
                      : 'Unknown'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Version</span>
                  <Badge
                    variant="outline"
                    className={
                      node.isLatestVersion
                        ? 'bg-green-500/10 text-green-500 border-green-500/20'
                        : 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20'
                    }
                  >
                    {node.version}
                  </Badge>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground flex items-center gap-2">
                    <Users className="h-4 w-4" />
                    Peers
                  </span>
                  <span>{node.peerCount}</span>
                </div>
                {node.firstSeen && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">First Seen</span>
                    <span>{new Date(node.firstSeen).toLocaleDateString()}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Last Seen</span>
                  <span>{new Date(node.lastSeen).toLocaleString()}</span>
                </div>
              </CardContent>
            </Card>

            {/* SRI Breakdown */}
            <Card className="bg-card/50 backdrop-blur">
              <CardHeader>
                <CardTitle className="text-sm font-medium">SRI Breakdown</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-muted-foreground">RPC Availability (40%)</span>
                    <span>{node.rpcAvailability}%</span>
                  </div>
                  <div className="h-2 rounded-full bg-muted overflow-hidden">
                    <div
                      className="h-full bg-primary transition-all"
                      style={{ width: `${node.rpcAvailability}%` }}
                    />
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-muted-foreground">Gossip Visibility (30%)</span>
                    <span>{node.gossipVisibility}%</span>
                  </div>
                  <div className="h-2 rounded-full bg-muted overflow-hidden">
                    <div
                      className="h-full bg-chart-2 transition-all"
                      style={{ width: `${node.gossipVisibility}%` }}
                    />
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-muted-foreground">Version Compliance (30%)</span>
                    <span>{node.versionCompliance}%</span>
                  </div>
                  <div className="h-2 rounded-full bg-muted overflow-hidden">
                    <div
                      className="h-full bg-chart-3 transition-all"
                      style={{ width: `${node.versionCompliance}%` }}
                    />
                  </div>
                </div>
                <div className="pt-4 border-t border-border">
                  <div className="flex justify-between items-center">
                    <span className="font-medium">Total SRI Score</span>
                    <span className="text-2xl font-bold">{node.sri}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Availability Heatmap */}
          <AvailabilityHeatmap />
        </TabsContent>

        <TabsContent value="performance" className="space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            <PerformanceChart
              title="Uptime (24h)"
              data={generateMockData(node.uptimePercent, 5)}
              color="hsl(var(--chart-1))"
              unit="%"
            />
            <PerformanceChart
              title="Latency (24h)"
              data={generateMockData(node.rpcLatency, 50)}
              color="hsl(var(--chart-2))"
              unit="ms"
            />
            <PerformanceChart
              title="Storage Usage (24h)"
              data={generateMockData(node.storagePercent, 3)}
              color="hsl(var(--chart-3))"
              unit="%"
            />
            <PerformanceChart
              title="Peer Count (24h)"
              data={generateMockData(node.peerCount, 5)}
              color="hsl(var(--chart-4))"
            />
          </div>
        </TabsContent>

        <TabsContent value="network" className="space-y-4">
          <Card className="bg-card/50 backdrop-blur">
            <CardHeader>
              <CardTitle className="text-sm font-medium">Network Configuration</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 rounded-lg bg-muted/50">
                    <p className="text-xs text-muted-foreground mb-1">pRPC Port</p>
                    <p className="font-mono">{node.port}</p>
                  </div>
                  <div className="p-4 rounded-lg bg-muted/50">
                    <p className="text-xs text-muted-foreground mb-1">Gossip Port</p>
                    <p className="font-mono">9001</p>
                  </div>
                </div>
                
                <div className="p-4 rounded-lg bg-muted/50">
                  <p className="text-xs text-muted-foreground mb-2">Endpoints</p>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <code className="text-xs">http://{node.ipAddress}:{node.port}</code>
                      <a
                        href={`http://${node.ipAddress}:${node.port}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary hover:underline flex items-center gap-1 text-xs"
                      >
                        Open <ExternalLink className="h-3 w-3" />
                      </a>
                    </div>
                  </div>
                </div>

                <div className="text-sm text-muted-foreground">
                  <p>
                    This pNode is connected to {node.peerCount} peers in the Xandeum gossip network.
                    The node is running version {node.version} and has been online since{' '}
                    {node.firstSeen
                      ? new Date(node.firstSeen).toLocaleDateString()
                      : 'recently'}.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
