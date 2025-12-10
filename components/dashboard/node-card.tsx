'use client';

import Link from 'next/link';
import { useState } from 'react';
import {
  Copy,
  Check,
  Award,
  Sparkles,
  ChevronRight,
  Globe,
  Clock,
  HardDrive,
  Users,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import type { PNode } from '@/lib/types';
import { truncatePubkey, formatBytes } from '@/lib/prpc-client';

interface NodeCardProps {
  node: PNode;
  rank: number;
}

function StatusIndicator({ status }: { status: PNode['status'] }) {
  const colors = {
    online: 'bg-green-500',
    offline: 'bg-red-500',
    degraded: 'bg-yellow-500',
  };

  return (
    <span
      className={`h-2.5 w-2.5 rounded-full ${colors[status]} ${
        status === 'online' ? 'animate-pulse' : ''
      }`}
    />
  );
}

function SRIBar({ value }: { value: number }) {
  const color =
    value >= 80
      ? 'bg-green-500'
      : value >= 60
      ? 'bg-yellow-500'
      : 'bg-red-500';

  return (
    <div className="flex items-center gap-2 w-full">
      <div className="flex-1 h-2 rounded-full bg-muted overflow-hidden">
        <div
          className={`h-full ${color} transition-all`}
          style={{ width: `${value}%` }}
        />
      </div>
      <span className="text-sm font-medium w-8">{value}</span>
    </div>
  );
}

export function NodeCard({ node, rank }: NodeCardProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    await navigator.clipboard.writeText(node.pubkey);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <TooltipProvider>
      <Link href={`/node/${node.pubkey}`}>
        <Card className="bg-card/50 backdrop-blur border-border/50 hover:border-primary/30 transition-all hover:shadow-lg cursor-pointer">
          <CardContent className="p-4">
            {/* Header */}
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-muted-foreground">
                  #{rank}
                </span>
                <StatusIndicator status={node.status} />
                <div className="flex items-center gap-1">
                  {node.isIncentivized && (
                    <Tooltip>
                      <TooltipTrigger>
                        <Award className="h-4 w-4 text-yellow-500" />
                      </TooltipTrigger>
                      <TooltipContent>Incentivized Node</TooltipContent>
                    </Tooltip>
                  )}
                  {node.hasNftMultiplier && (
                    <Tooltip>
                      <TooltipTrigger>
                        <Sparkles className="h-4 w-4 text-purple-500" />
                      </TooltipTrigger>
                      <TooltipContent>NFT Multiplier Active</TooltipContent>
                    </Tooltip>
                  )}
                </div>
              </div>
              <Badge
                variant="outline"
                className={
                  node.isLatestVersion
                    ? 'bg-green-500/10 text-green-500 border-green-500/20 text-xs'
                    : 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20 text-xs'
                }
              >
                {node.version.split('-').pop()}
              </Badge>
            </div>

            {/* Node ID */}
            <div className="flex items-center gap-2 mb-3">
              <span className="font-mono text-sm font-medium">
                {node.displayName || truncatePubkey(node.pubkey, 6)}
              </span>
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6"
                onClick={handleCopy}
              >
                {copied ? (
                  <Check className="h-3 w-3 text-green-500" />
                ) : (
                  <Copy className="h-3 w-3" />
                )}
              </Button>
            </div>

            {/* Location */}
            {(node.geoCity || node.geoCountry) && (
              <div className="flex items-center gap-1 text-xs text-muted-foreground mb-3">
                <Globe className="h-3 w-3" />
                <span>
                  {node.geoCity && node.geoCountry
                    ? `${node.geoCity}, ${node.geoCountry}`
                    : node.ipAddress}
                </span>
              </div>
            )}

            {/* SRI Score */}
            <div className="mb-3">
              <div className="flex justify-between text-xs text-muted-foreground mb-1">
                <span>Storage Reliability Index</span>
              </div>
              <SRIBar value={node.sri} />
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-3 gap-2 text-xs">
              <div className="flex flex-col items-center p-2 rounded-lg bg-muted/50">
                <Clock className="h-3 w-3 text-muted-foreground mb-1" />
                <span className="font-medium">{node.uptimePercent.toFixed(0)}%</span>
                <span className="text-muted-foreground">Uptime</span>
              </div>
              <div className="flex flex-col items-center p-2 rounded-lg bg-muted/50">
                <HardDrive className="h-3 w-3 text-muted-foreground mb-1" />
                <span className="font-medium">{node.storagePercent.toFixed(0)}%</span>
                <span className="text-muted-foreground">Storage</span>
              </div>
              <div className="flex flex-col items-center p-2 rounded-lg bg-muted/50">
                <Users className="h-3 w-3 text-muted-foreground mb-1" />
                <span className="font-medium">{node.peerCount}</span>
                <span className="text-muted-foreground">Peers</span>
              </div>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between mt-3 pt-3 border-t border-border/50">
              <span className="text-xs text-muted-foreground">
                {node.status === 'online' ? `${node.rpcLatency}ms latency` : 'Offline'}
              </span>
              <ChevronRight className="h-4 w-4 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
      </Link>
    </TooltipProvider>
  );
}

interface NodeCardListProps {
  nodes: PNode[];
  isLoading: boolean;
}

export function NodeCardList({ nodes, isLoading }: NodeCardListProps) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {[...Array(6)].map((_, i) => (
          <Card key={i} className="bg-card/50 backdrop-blur">
            <CardContent className="p-4">
              <div className="animate-pulse space-y-3">
                <div className="h-4 bg-muted rounded w-1/3" />
                <div className="h-6 bg-muted rounded w-2/3" />
                <div className="h-2 bg-muted rounded w-full" />
                <div className="grid grid-cols-3 gap-2">
                  <div className="h-16 bg-muted rounded" />
                  <div className="h-16 bg-muted rounded" />
                  <div className="h-16 bg-muted rounded" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (nodes.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        No pNodes found matching your filters.
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      {nodes.map((node, index) => (
        <NodeCard key={node.pubkey} node={node} rank={index + 1} />
      ))}
    </div>
  );
}
