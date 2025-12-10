'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
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
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import type { PNode } from '@/lib/types';
import { formatBytes, formatUptime, truncatePubkey } from '@/lib/prpc-client';

export default function OperatorPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [claimedNodes, setClaimedNodes] = useState<PNode[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/');
    }
  }, [status, router]);

  useEffect(() => {
    async function fetchClaimedNodes() {
      try {
        // In a real implementation, this would fetch only the user's claimed nodes
        const response = await fetch('/api/pnodes');
        const data = await response.json();
        
        if (data.success && data.data?.nodes) {
          // For demo, show first 3 nodes as "claimed"
          setClaimedNodes(data.data.nodes.slice(0, 3));
        }
      } catch (error) {
        console.error('Failed to fetch nodes:', error);
      } finally {
        setIsLoading(false);
      }
    }

    if (session) {
      fetchClaimedNodes();
    }
  }, [session]);

  if (status === 'loading' || isLoading) {
    return (
      <div className="container mx-auto px-4 py-6 space-y-6">
        <Skeleton className="h-10 w-64" />
        <div className="grid md:grid-cols-3 gap-4">
          <Skeleton className="h-32" />
          <Skeleton className="h-32" />
          <Skeleton className="h-32" />
        </div>
        <Skeleton className="h-64" />
      </div>
    );
  }

  if (!session) {
    return null;
  }

  const totalStorage = claimedNodes.reduce((acc, n) => acc + n.storageCapacity, 0);
  const avgSri = claimedNodes.length > 0 
    ? Math.round(claimedNodes.reduce((acc, n) => acc + n.sri, 0) / claimedNodes.length)
    : 0;
  const onlineNodes = claimedNodes.filter((n) => n.status === 'online').length;

  return (
    <div className="container mx-auto px-4 py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold flex items-center gap-3">
            <Server className="h-7 w-7" />
            Operator Dashboard
          </h1>
          <p className="text-muted-foreground mt-1">
            Manage your pNodes and monitor performance
          </p>
        </div>
        <Button variant="outline" onClick={() => window.location.reload()}>
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="bg-card/50 backdrop-blur">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <Server className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{claimedNodes.length}</p>
                <p className="text-xs text-muted-foreground">Claimed Nodes</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card/50 backdrop-blur">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-green-500/10">
                <Activity className="h-5 w-5 text-green-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{onlineNodes}/{claimedNodes.length}</p>
                <p className="text-xs text-muted-foreground">Online</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card/50 backdrop-blur">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-yellow-500/10">
                <Award className="h-5 w-5 text-yellow-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{avgSri}</p>
                <p className="text-xs text-muted-foreground">Avg SRI Score</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card/50 backdrop-blur">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-blue-500/10">
                <HardDrive className="h-5 w-5 text-blue-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{formatBytes(totalStorage)}</p>
                <p className="text-xs text-muted-foreground">Total Storage</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Nodes List */}
      <Card className="bg-card/50 backdrop-blur">
        <CardHeader>
          <CardTitle className="text-lg">Your pNodes</CardTitle>
        </CardHeader>
        <CardContent>
          {claimedNodes.length === 0 ? (
            <div className="text-center py-12">
              <Server className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="font-semibold mb-2">No Claimed Nodes</h3>
              <p className="text-sm text-muted-foreground mb-4">
                You haven&apos;t claimed any pNodes yet. Visit a node&apos;s detail page to claim it.
              </p>
              <Button asChild>
                <Link href="/">Browse Nodes</Link>
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {claimedNodes.map((node) => (
                <div
                  key={node.pubkey}
                  className="p-4 rounded-lg border border-border/50 bg-background/50 hover:bg-accent/50 transition-colors"
                >
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                      <div className={`w-3 h-3 rounded-full ${
                        node.status === 'online' ? 'bg-green-500' : 'bg-red-500'
                      }`} />
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-medium">
                            {node.displayName || truncatePubkey(node.pubkey, 6)}
                          </span>
                          <Badge variant="outline" className={
                            node.isLatestVersion
                              ? 'bg-green-500/10 text-green-500 border-green-500/20'
                              : 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20'
                          }>
                            {node.version.split('-').pop()}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {node.geoCity}, {node.geoCountry} • {node.ipAddress}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-6">
                      <div className="text-center">
                        <p className="text-lg font-bold">{node.sri}</p>
                        <p className="text-xs text-muted-foreground">SRI</p>
                      </div>
                      <div className="text-center">
                        <p className="text-lg font-bold">{node.uptimePercent.toFixed(0)}%</p>
                        <p className="text-xs text-muted-foreground">Uptime</p>
                      </div>
                      <div className="text-center">
                        <p className="text-lg font-bold">{node.peerCount}</p>
                        <p className="text-xs text-muted-foreground">Peers</p>
                      </div>
                      <Button variant="outline" size="sm" asChild>
                        <Link href={`/node/${node.pubkey}`}>
                          <ExternalLink className="h-4 w-4 mr-1" />
                          Details
                        </Link>
                      </Button>
                    </div>
                  </div>

                  {/* Alerts */}
                  {!node.isLatestVersion && (
                    <div className="mt-3 p-2 rounded bg-yellow-500/10 text-yellow-500 text-sm flex items-center gap-2">
                      <AlertCircle className="h-4 w-4" />
                      Update available: Your node is running an outdated version.
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Quick Links */}
      <div className="grid md:grid-cols-2 gap-4">
        <Card className="bg-card/50 backdrop-blur">
          <CardContent className="p-6">
            <h3 className="font-semibold mb-2 flex items-center gap-2">
              <Settings className="h-5 w-5" />
              Operator Tools
            </h3>
            <p className="text-sm text-muted-foreground mb-4">
              Diagnostic tools to help maintain your pNodes.
            </p>
            <Button asChild variant="outline">
              <Link href="/tools">Open Tools</Link>
            </Button>
          </CardContent>
        </Card>

        <Card className="bg-card/50 backdrop-blur">
          <CardContent className="p-6">
            <h3 className="font-semibold mb-2 flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Heartbeat Status
            </h3>
            <p className="text-sm text-muted-foreground mb-4">
              All your nodes are sending heartbeats correctly.
            </p>
            <Badge variant="outline" className="bg-green-500/10 text-green-500 border-green-500/20">
              All Systems Operational
            </Badge>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

