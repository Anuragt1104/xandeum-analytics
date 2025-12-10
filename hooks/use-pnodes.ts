'use client';

import { useState, useEffect, useCallback } from 'react';
import type { PNode, NetworkStats, SortConfig, FilterConfig } from '@/lib/types';

interface UsePNodesReturn {
  nodes: PNode[];
  filteredNodes: PNode[];
  stats: NetworkStats | null;
  isLoading: boolean;
  error: string | null;
  sortConfig: SortConfig;
  filterConfig: FilterConfig;
  setSortConfig: (config: SortConfig) => void;
  setFilterConfig: (config: FilterConfig) => void;
  refresh: () => void;
}

const DEFAULT_SORT: SortConfig = { field: 'sri', direction: 'desc' };
const DEFAULT_FILTER: FilterConfig = {
  search: '',
  status: 'all',
  version: 'all',
  minSri: 0,
  showIncentivizedOnly: false,
};

export function usePNodes(autoRefresh: boolean = true): UsePNodesReturn {
  const [nodes, setNodes] = useState<PNode[]>([]);
  const [stats, setStats] = useState<NetworkStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sortConfig, setSortConfig] = useState<SortConfig>(DEFAULT_SORT);
  const [filterConfig, setFilterConfig] = useState<FilterConfig>(DEFAULT_FILTER);

  const fetchData = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const response = await fetch('/api/pnodes');
      const data = await response.json();
      
      if (data.success && data.data) {
        setNodes(data.data.nodes);
        setStats(data.data.stats);
      } else {
        setError(data.error || 'Failed to fetch data');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch pNodes');
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Initial fetch
  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Auto-refresh every 30 seconds
  useEffect(() => {
    if (!autoRefresh) return;
    
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, [autoRefresh, fetchData]);

  // Sort and filter nodes
  const filteredNodes = nodes
    .filter((node) => {
      // Search filter
      if (filterConfig.search) {
        const search = filterConfig.search.toLowerCase();
        const matchesPubkey = node.pubkey.toLowerCase().includes(search);
        const matchesName = node.displayName?.toLowerCase().includes(search);
        const matchesCity = node.geoCity?.toLowerCase().includes(search);
        const matchesCountry = node.geoCountry?.toLowerCase().includes(search);
        if (!matchesPubkey && !matchesName && !matchesCity && !matchesCountry) {
          return false;
        }
      }

      // Status filter
      if (filterConfig.status !== 'all' && node.status !== filterConfig.status) {
        return false;
      }

      // Version filter
      if (filterConfig.version !== 'all' && node.version !== filterConfig.version) {
        return false;
      }

      // Min SRI filter
      if (node.sri < filterConfig.minSri) {
        return false;
      }

      // Incentivized filter
      if (filterConfig.showIncentivizedOnly && !node.isIncentivized) {
        return false;
      }

      return true;
    })
    .sort((a, b) => {
      const { field, direction } = sortConfig;
      const multiplier = direction === 'asc' ? 1 : -1;

      switch (field) {
        case 'sri':
          return (a.sri - b.sri) * multiplier;
        case 'pubkey':
          return a.pubkey.localeCompare(b.pubkey) * multiplier;
        case 'version':
          return a.version.localeCompare(b.version) * multiplier;
        case 'uptime':
          return (a.uptimePercent - b.uptimePercent) * multiplier;
        case 'latency':
          return (a.rpcLatency - b.rpcLatency) * multiplier;
        case 'peers':
          return (a.peerCount - b.peerCount) * multiplier;
        case 'storage':
          return (a.storagePercent - b.storagePercent) * multiplier;
        case 'status':
          const statusOrder = { online: 0, degraded: 1, offline: 2 };
          return (statusOrder[a.status] - statusOrder[b.status]) * multiplier;
        default:
          return 0;
      }
    });

  return {
    nodes,
    filteredNodes,
    stats,
    isLoading,
    error,
    sortConfig,
    filterConfig,
    setSortConfig,
    setFilterConfig,
    refresh: fetchData,
  };
}
