'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  ExternalLink,
  Copy,
  Check,
  Award,
  Sparkles,
} from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { Skeleton } from '@/components/ui/skeleton';
import type { PNode, SortConfig, SortField } from '@/lib/types';
import { truncatePubkey, formatBytes, formatUptime } from '@/lib/prpc-client';

interface NodeTableProps {
  nodes: PNode[];
  isLoading: boolean;
  sortConfig: SortConfig;
  onSortChange: (config: SortConfig) => void;
}

function SortButton({
  field,
  label,
  sortConfig,
  onSort,
}: {
  field: SortField;
  label: string;
  sortConfig: SortConfig;
  onSort: (field: SortField) => void;
}) {
  const isActive = sortConfig.field === field;
  const Icon = isActive
    ? sortConfig.direction === 'asc'
      ? ArrowUp
      : ArrowDown
    : ArrowUpDown;

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={() => onSort(field)}
      className={`-ml-3 h-8 font-medium ${
        isActive ? 'text-primary' : 'text-muted-foreground hover:text-foreground'
      }`}
    >
      {label}
      <Icon className="ml-1 h-3 w-3" />
    </Button>
  );
}

function StatusBadge({ status }: { status: PNode['status'] }) {
  const variants = {
    online: 'bg-green-500/10 text-green-500 border-green-500/20',
    offline: 'bg-red-500/10 text-red-500 border-red-500/20',
    degraded: 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20',
  };

  return (
    <Badge variant="outline" className={variants[status]}>
      <span
        className={`mr-1.5 h-2 w-2 rounded-full ${
          status === 'online'
            ? 'bg-green-500 animate-pulse'
            : status === 'offline'
            ? 'bg-red-500'
            : 'bg-yellow-500'
        }`}
      />
      {status}
    </Badge>
  );
}

function VersionBadge({ version, isLatest }: { version: string; isLatest: boolean }) {
  const variant = isLatest
    ? 'bg-green-500/10 text-green-500 border-green-500/20'
    : 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20';

  // Extract just the version name part
  const displayVersion = version.split('-').pop() || version;

  return (
    <Badge variant="outline" className={variant}>
      {displayVersion}
    </Badge>
  );
}

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Button
      variant="ghost"
      size="icon"
      className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        handleCopy();
      }}
    >
      {copied ? (
        <Check className="h-3 w-3 text-green-500" />
      ) : (
        <Copy className="h-3 w-3" />
      )}
    </Button>
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
    <div className="flex items-center gap-2">
      <div className="w-16 h-2 rounded-full bg-muted overflow-hidden">
        <div
          className={`h-full ${color} transition-all`}
          style={{ width: `${value}%` }}
        />
      </div>
      <span className="text-sm font-medium">{value}</span>
    </div>
  );
}

function StorageBar({ percent }: { percent: number }) {
  const color =
    percent >= 90
      ? 'bg-red-500'
      : percent >= 70
      ? 'bg-yellow-500'
      : 'bg-primary';

  return (
    <div className="w-20 h-2 rounded-full bg-muted overflow-hidden">
      <div
        className={`h-full ${color} transition-all`}
        style={{ width: `${Math.min(100, percent)}%` }}
      />
    </div>
  );
}

function TableSkeleton() {
  return (
    <>
      {[...Array(10)].map((_, i) => (
        <TableRow key={i}>
          <TableCell><Skeleton className="h-4 w-8" /></TableCell>
          <TableCell><Skeleton className="h-4 w-16" /></TableCell>
          <TableCell><Skeleton className="h-4 w-32" /></TableCell>
          <TableCell><Skeleton className="h-4 w-20" /></TableCell>
          <TableCell><Skeleton className="h-4 w-16" /></TableCell>
          <TableCell><Skeleton className="h-4 w-12" /></TableCell>
          <TableCell><Skeleton className="h-4 w-10" /></TableCell>
          <TableCell><Skeleton className="h-4 w-24" /></TableCell>
          <TableCell><Skeleton className="h-4 w-16" /></TableCell>
        </TableRow>
      ))}
    </>
  );
}

export function NodeTable({
  nodes,
  isLoading,
  sortConfig,
  onSortChange,
}: NodeTableProps) {
  const handleSort = (field: SortField) => {
    const direction =
      sortConfig.field === field && sortConfig.direction === 'desc'
        ? 'asc'
        : 'desc';
    onSortChange({ field, direction });
  };

  return (
    <TooltipProvider>
      <div className="rounded-lg border border-border/50 bg-card/30 backdrop-blur overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent border-b border-border/50">
              <TableHead className="w-14">Rank</TableHead>
              <TableHead className="w-24">
                <SortButton
                  field="sri"
                  label="SRI"
                  sortConfig={sortConfig}
                  onSort={handleSort}
                />
              </TableHead>
              <TableHead className="min-w-[200px]">
                <SortButton
                  field="pubkey"
                  label="Node"
                  sortConfig={sortConfig}
                  onSort={handleSort}
                />
              </TableHead>
              <TableHead>
                <SortButton
                  field="version"
                  label="Version"
                  sortConfig={sortConfig}
                  onSort={handleSort}
                />
              </TableHead>
              <TableHead>
                <SortButton
                  field="uptime"
                  label="Uptime"
                  sortConfig={sortConfig}
                  onSort={handleSort}
                />
              </TableHead>
              <TableHead>
                <SortButton
                  field="latency"
                  label="Latency"
                  sortConfig={sortConfig}
                  onSort={handleSort}
                />
              </TableHead>
              <TableHead>
                <SortButton
                  field="peers"
                  label="Peers"
                  sortConfig={sortConfig}
                  onSort={handleSort}
                />
              </TableHead>
              <TableHead>
                <SortButton
                  field="storage"
                  label="Storage"
                  sortConfig={sortConfig}
                  onSort={handleSort}
                />
              </TableHead>
              <TableHead>
                <SortButton
                  field="status"
                  label="Status"
                  sortConfig={sortConfig}
                  onSort={handleSort}
                />
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableSkeleton />
            ) : nodes.length === 0 ? (
              <TableRow>
                <TableCell colSpan={9} className="h-32 text-center text-muted-foreground">
                  No pNodes found matching your filters.
                </TableCell>
              </TableRow>
            ) : (
              nodes.map((node, index) => (
                <TableRow
                  key={node.pubkey}
                  className="group cursor-pointer hover:bg-accent/50 transition-colors"
                >
                  <TableCell className="font-medium text-muted-foreground">
                    #{index + 1}
                  </TableCell>
                  <TableCell>
                    <SRIBar value={node.sri} />
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Link
                        href={`/node/${node.pubkey}`}
                        className="flex items-center gap-2 hover:text-primary transition-colors"
                      >
                        <div className="flex flex-col">
                          <div className="flex items-center gap-1">
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <span className="font-mono text-sm">
                                  {node.displayName || truncatePubkey(node.pubkey, 6)}
                                </span>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p className="font-mono text-xs">{node.pubkey}</p>
                              </TooltipContent>
                            </Tooltip>
                            {node.isIncentivized && (
                              <Tooltip>
                                <TooltipTrigger>
                                  <Award className="h-3.5 w-3.5 text-yellow-500" />
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p>Incentivized Deep South Node</p>
                                </TooltipContent>
                              </Tooltip>
                            )}
                            {node.hasNftMultiplier && (
                              <Tooltip>
                                <TooltipTrigger>
                                  <Sparkles className="h-3.5 w-3.5 text-purple-500" />
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p>NFT Multiplier Active</p>
                                </TooltipContent>
                              </Tooltip>
                            )}
                          </div>
                          <span className="text-xs text-muted-foreground">
                            {node.geoCity && node.geoCountry
                              ? `${node.geoCity}, ${node.geoCountry}`
                              : node.ipAddress}
                          </span>
                        </div>
                        <ExternalLink className="h-3 w-3 opacity-0 group-hover:opacity-50" />
                      </Link>
                      <CopyButton text={node.pubkey} />
                    </div>
                  </TableCell>
                  <TableCell>
                    <VersionBadge
                      version={node.version}
                      isLatest={node.isLatestVersion}
                    />
                  </TableCell>
                  <TableCell>
                    <Tooltip>
                      <TooltipTrigger>
                        <span className="text-sm">{node.uptimePercent.toFixed(1)}%</span>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>{formatUptime(node.uptime)} total uptime</p>
                      </TooltipContent>
                    </Tooltip>
                  </TableCell>
                  <TableCell>
                    <span
                      className={`text-sm ${
                        node.rpcLatency < 100
                          ? 'text-green-500'
                          : node.rpcLatency < 300
                          ? 'text-yellow-500'
                          : 'text-red-500'
                      }`}
                    >
                      {node.status === 'online' ? `${node.rpcLatency}ms` : '—'}
                    </span>
                  </TableCell>
                  <TableCell>
                    <span className="text-sm">{node.peerCount}</span>
                  </TableCell>
                  <TableCell>
                    <Tooltip>
                      <TooltipTrigger>
                        <div className="flex items-center gap-2">
                          <StorageBar percent={node.storagePercent} />
                          <span className="text-xs text-muted-foreground">
                            {node.storagePercent.toFixed(0)}%
                          </span>
                        </div>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>
                          {formatBytes(node.storageUsed)} / {formatBytes(node.storageCapacity)}
                        </p>
                      </TooltipContent>
                    </Tooltip>
                  </TableCell>
                  <TableCell>
                    <StatusBadge status={node.status} />
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </TooltipProvider>
  );
}
