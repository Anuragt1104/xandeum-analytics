'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
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
import type { PNode, SortConfig, SortField } from '@/lib/types';
import { truncatePubkey, formatBytes, formatUptime } from '@/lib/prpc-client';

interface NodeTableProps {
  nodes: PNode[];
  isLoading: boolean;
  sortConfig: SortConfig;
  onSortChange: (config: SortConfig) => void;
}

// Animation variants
const tableRowVariants = {
  hidden: { opacity: 0, x: -20 },
  visible: (i: number) => ({
    opacity: 1,
    x: 0,
    transition: {
      delay: i * 0.03,
      duration: 0.3,
      ease: [0.16, 1, 0.3, 1] as const,
    },
  }),
  exit: {
    opacity: 0,
    x: 20,
    transition: { duration: 0.2 },
  },
};

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
      className={`-ml-3 h-8 font-medium transition-colors ${
        isActive ? 'text-primary' : 'text-muted-foreground hover:text-foreground'
      }`}
    >
      {label}
      <motion.div
        animate={{ rotate: isActive && sortConfig.direction === 'asc' ? 180 : 0 }}
        transition={{ duration: 0.2 }}
      >
        <Icon className="ml-1 h-3 w-3" />
      </motion.div>
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
    <Badge variant="outline" className={`${variants[status]} transition-all`}>
      <motion.span
        className={`mr-1.5 h-2 w-2 rounded-full ${
          status === 'online'
            ? 'bg-green-500'
            : status === 'offline'
            ? 'bg-red-500'
            : 'bg-yellow-500'
        }`}
        animate={status === 'online' ? { 
          scale: [1, 1.2, 1],
          opacity: [1, 0.7, 1],
        } : {}}
        transition={{ duration: 2, repeat: Infinity }}
      />
      {status}
    </Badge>
  );
}

function VersionBadge({ version, isLatest }: { version: string; isLatest: boolean }) {
  const variant = isLatest
    ? 'bg-green-500/10 text-green-500 border-green-500/20'
    : 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20';

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
    <motion.div whileTap={{ scale: 0.9 }}>
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
        <AnimatePresence mode="wait">
          {copied ? (
            <motion.div
              key="check"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0 }}
            >
              <Check className="h-3 w-3 text-green-500" />
            </motion.div>
          ) : (
            <motion.div
              key="copy"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0 }}
            >
              <Copy className="h-3 w-3" />
            </motion.div>
          )}
        </AnimatePresence>
      </Button>
    </motion.div>
  );
}

function SRIBar({ value }: { value: number }) {
  const color =
    value >= 80
      ? 'bg-green-500'
      : value >= 60
      ? 'bg-yellow-500'
      : 'bg-red-500';

  const glowColor =
    value >= 80
      ? 'shadow-green-500/30'
      : value >= 60
      ? 'shadow-yellow-500/30'
      : 'shadow-red-500/30';

  return (
    <div className="flex items-center gap-2">
      <div className="w-16 h-2 rounded-full bg-muted overflow-hidden">
        <motion.div
          className={`h-full ${color} shadow-lg ${glowColor}`}
          initial={{ width: 0 }}
          animate={{ width: `${value}%` }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1], delay: 0.2 }}
        />
      </div>
      <span className="text-sm font-medium tabular-nums">{value}</span>
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
      <motion.div
        className={`h-full ${color}`}
        initial={{ width: 0 }}
        animate={{ width: `${Math.min(100, percent)}%` }}
        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1], delay: 0.3 }}
      />
    </div>
  );
}

function TableSkeleton() {
  return (
    <>
      {[...Array(10)].map((_, i) => (
        <TableRow key={i} className="animate-pulse">
          <TableCell><div className="h-4 w-8 bg-muted/50 rounded" /></TableCell>
          <TableCell><div className="h-4 w-16 bg-muted/50 rounded" /></TableCell>
          <TableCell><div className="h-4 w-32 bg-muted/50 rounded" /></TableCell>
          <TableCell><div className="h-4 w-20 bg-muted/50 rounded" /></TableCell>
          <TableCell><div className="h-4 w-16 bg-muted/50 rounded" /></TableCell>
          <TableCell><div className="h-4 w-12 bg-muted/50 rounded" /></TableCell>
          <TableCell><div className="h-4 w-10 bg-muted/50 rounded" /></TableCell>
          <TableCell><div className="h-4 w-24 bg-muted/50 rounded" /></TableCell>
          <TableCell><div className="h-4 w-16 bg-muted/50 rounded" /></TableCell>
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
      <motion.div 
        className="rounded-xl border border-border/50 bg-card/30 backdrop-blur overflow-hidden"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent border-b border-border/50">
              <TableHead className="w-14">Rank</TableHead>
              <TableHead className="w-24">
                <SortButton field="sri" label="SRI" sortConfig={sortConfig} onSort={handleSort} />
              </TableHead>
              <TableHead className="min-w-[200px]">
                <SortButton field="pubkey" label="Node" sortConfig={sortConfig} onSort={handleSort} />
              </TableHead>
              <TableHead>
                <SortButton field="version" label="Version" sortConfig={sortConfig} onSort={handleSort} />
              </TableHead>
              <TableHead>
                <SortButton field="uptime" label="Uptime" sortConfig={sortConfig} onSort={handleSort} />
              </TableHead>
              <TableHead>
                <SortButton field="latency" label="Latency" sortConfig={sortConfig} onSort={handleSort} />
              </TableHead>
              <TableHead>
                <SortButton field="peers" label="Peers" sortConfig={sortConfig} onSort={handleSort} />
              </TableHead>
              <TableHead>
                <SortButton field="storage" label="Storage" sortConfig={sortConfig} onSort={handleSort} />
              </TableHead>
              <TableHead>
                <SortButton field="status" label="Status" sortConfig={sortConfig} onSort={handleSort} />
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
              <AnimatePresence mode="popLayout">
                {nodes.map((node, index) => (
                  <motion.tr
                    key={node.pubkey}
                    custom={index}
                    variants={tableRowVariants}
                    initial="hidden"
                    animate="visible"
                    exit="exit"
                    layout
                    className="group cursor-pointer hover:bg-accent/30 transition-colors border-b border-border/30"
                  >
                    <TableCell className="font-medium text-muted-foreground">
                      <span className="tabular-nums">#{index + 1}</span>
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
                          <ExternalLink className="h-3 w-3 opacity-0 group-hover:opacity-50 transition-opacity" />
                        </Link>
                        <CopyButton text={node.pubkey} />
                      </div>
                    </TableCell>
                    <TableCell>
                      <VersionBadge version={node.version} isLatest={node.isLatestVersion} />
                    </TableCell>
                    <TableCell>
                      <Tooltip>
                        <TooltipTrigger>
                          <span className="text-sm tabular-nums">{node.uptimePercent.toFixed(1)}%</span>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>{formatUptime(node.uptime)} total uptime</p>
                        </TooltipContent>
                      </Tooltip>
                    </TableCell>
                    <TableCell>
                      <span
                        className={`text-sm tabular-nums ${
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
                      <span className="text-sm tabular-nums">{node.peerCount}</span>
                    </TableCell>
                    <TableCell>
                      <Tooltip>
                        <TooltipTrigger>
                          <div className="flex items-center gap-2">
                            <StorageBar percent={node.storagePercent} />
                            <span className="text-xs text-muted-foreground tabular-nums">
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
                  </motion.tr>
                ))}
              </AnimatePresence>
            )}
          </TableBody>
        </Table>
      </motion.div>
    </TooltipProvider>
  );
}
