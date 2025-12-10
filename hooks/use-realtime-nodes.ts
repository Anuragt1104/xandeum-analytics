'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { getSupabase, isSupabaseConfigured } from '@/lib/supabase/client';
import type { PNodeRow } from '@/lib/supabase/types';
import type { PNode } from '@/lib/types';
import type { RealtimeChannel } from '@supabase/supabase-js';

interface UseRealtimeNodesOptions {
  enabled?: boolean;
  onUpdate?: (nodes: PNode[]) => void;
  onError?: (error: Error) => void;
}

// Convert Supabase row to PNode
function convertToPNode(row: PNodeRow): PNode {
  return {
    pubkey: row.identity_pubkey,
    displayName: row.display_name || undefined,
    ipAddress: row.current_ip,
    port: row.port,
    version: row.software_version,
    geoCountry: row.geo_country || undefined,
    geoCity: row.geo_city || undefined,
    geoLatitude: row.geo_latitude || undefined,
    geoLongitude: row.geo_longitude || undefined,
    status: row.status.toLowerCase() as 'online' | 'offline' | 'degraded',
    lastSeen: new Date(row.last_seen),
    firstSeen: new Date(row.first_seen),
    isLatestVersion: row.is_latest_version,
    isIncentivized: row.is_incentivized,
    hasNftMultiplier: row.has_nft_multiplier,
    // These will be updated from metrics
    uptime: 0,
    uptimePercent: 0,
    rpcLatency: 0,
    peerCount: 0,
    storageUsed: 0,
    storageCapacity: 0,
    storagePercent: 0,
    sri: 0,
    rpcAvailability: 0,
    gossipVisibility: 0,
    versionCompliance: 0,
  };
}

export function useRealtimeNodes(options: UseRealtimeNodesOptions = {}) {
  const { enabled = true, onUpdate, onError } = options;
  const [nodes, setNodes] = useState<PNode[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const channelRef = useRef<RealtimeChannel | null>(null);

  // Fetch initial data
  const fetchNodes = useCallback(async () => {
    if (!isSupabaseConfigured()) {
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      const supabase = getSupabase();
      
      const { data, error: fetchError } = await supabase
        .from('pnodes')
        .select('*')
        .order('last_seen', { ascending: false });

      if (fetchError) throw fetchError;

      const pnodes = (data || []).map(convertToPNode);
      setNodes(pnodes);
      onUpdate?.(pnodes);
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to fetch nodes');
      setError(error);
      onError?.(error);
    } finally {
      setIsLoading(false);
    }
  }, [onUpdate, onError]);

  // Subscribe to real-time changes
  useEffect(() => {
    if (!enabled || !isSupabaseConfigured()) return;

    const supabase = getSupabase();

    // Create channel for real-time updates
    const channel = supabase
      .channel('pnodes-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'pnodes',
        },
        (payload) => {
          console.log('Real-time update:', payload.eventType);

          if (payload.eventType === 'INSERT') {
            const newNode = convertToPNode(payload.new as PNodeRow);
            setNodes((prev) => {
              const updated = [newNode, ...prev];
              onUpdate?.(updated);
              return updated;
            });
          } else if (payload.eventType === 'UPDATE') {
            const updatedNode = convertToPNode(payload.new as PNodeRow);
            setNodes((prev) => {
              const updated = prev.map((node) =>
                node.pubkey === updatedNode.pubkey ? updatedNode : node
              );
              onUpdate?.(updated);
              return updated;
            });
          } else if (payload.eventType === 'DELETE') {
            const deletedPubkey = (payload.old as PNodeRow).identity_pubkey;
            setNodes((prev) => {
              const updated = prev.filter((node) => node.pubkey !== deletedPubkey);
              onUpdate?.(updated);
              return updated;
            });
          }
        }
      )
      .subscribe((status) => {
        setIsConnected(status === 'SUBSCRIBED');
        if (status === 'SUBSCRIBED') {
          console.log('Real-time subscription active');
        }
      });

    channelRef.current = channel;

    // Fetch initial data
    fetchNodes();

    // Cleanup
    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
    };
  }, [enabled, fetchNodes, onUpdate]);

  // Manual refresh
  const refresh = useCallback(() => {
    fetchNodes();
  }, [fetchNodes]);

  return {
    nodes,
    isLoading,
    error,
    isConnected,
    refresh,
  };
}

