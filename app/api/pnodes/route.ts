// API Route: GET /api/pnodes
// Returns list of all pNodes with their stats and computed metrics

import { NextResponse } from 'next/server';
import type { PNode, ApiResponse, NetworkStats } from '@/lib/types';
import { cache, CACHE_KEYS, CACHE_TTL } from '@/lib/cache';
import { getMockPNodes, getMockNetworkStats } from '@/lib/mock-data';
import {
  discoverNetwork,
  fetchPNodeData,
  SEED_NODES,
} from '@/lib/prpc-client';

// Use mock data in development or when network is unavailable
const USE_MOCK_DATA = process.env.USE_MOCK_DATA === 'true' || process.env.NODE_ENV === 'development';

interface PNodesResponse {
  nodes: PNode[];
  stats: NetworkStats;
}

async function fetchRealPNodes(): Promise<PNode[]> {
  try {
    // Discover nodes from seed nodes
    const discoveredPods = await discoverNetwork(SEED_NODES, 2);
    
    if (discoveredPods.size === 0) {
      console.warn('No pNodes discovered from network, falling back to mock data');
      return getMockPNodes();
    }

    // Fetch detailed data for each node (limit concurrent requests)
    const nodes: PNode[] = [];
    const podArray = Array.from(discoveredPods.values());
    
    // Process in batches of 10 to avoid overwhelming the network
    const batchSize = 10;
    for (let i = 0; i < podArray.length; i += batchSize) {
      const batch = podArray.slice(i, i + batchSize);
      const batchResults = await Promise.all(
        batch.map((pod) => fetchPNodeData(pod, true))
      );
      nodes.push(...batchResults);
    }

    // Sort by SRI descending
    return nodes.sort((a, b) => b.sri - a.sri);
  } catch (error) {
    console.error('Error fetching real pNodes:', error);
    return getMockPNodes();
  }
}

function computeNetworkStats(nodes: PNode[]): NetworkStats {
  const activeNodes = nodes.filter((n) => n.status === 'online');
  const totalStorage = nodes.reduce((sum, n) => sum + n.storageCapacity, 0);
  const usedStorage = nodes.reduce((sum, n) => sum + n.storageUsed, 0);
  const avgSri = nodes.length > 0 
    ? nodes.reduce((sum, n) => sum + n.sri, 0) / nodes.length 
    : 0;
  const avgUptime = nodes.length > 0 
    ? nodes.reduce((sum, n) => sum + n.uptimePercent, 0) / nodes.length 
    : 0;
  const avgLatency = activeNodes.length > 0 
    ? activeNodes.reduce((sum, n) => sum + n.rpcLatency, 0) / activeNodes.length 
    : 0;
  const onLatestVersion = nodes.filter((n) => n.isLatestVersion).length;

  return {
    totalNodes: nodes.length,
    activeNodes: activeNodes.length,
    totalStorageCapacity: totalStorage,
    totalStorageUsed: usedStorage,
    averageSri: Math.round(avgSri),
    averageUptime: Math.round(avgUptime * 10) / 10,
    averageLatency: Math.round(avgLatency),
    latestVersion: '0.5.0-munich',
    nodesOnLatestVersion: onLatestVersion,
    lastUpdated: new Date(),
  };
}

export async function GET(): Promise<NextResponse<ApiResponse<PNodesResponse>>> {
  try {
    // Check cache first
    const cachedData = cache.get<PNodesResponse>(CACHE_KEYS.PNODES);
    if (cachedData) {
      return NextResponse.json({
        success: true,
        data: cachedData,
        timestamp: new Date().toISOString(),
      });
    }

    // Fetch data
    let nodes: PNode[];
    let stats: NetworkStats;

    if (USE_MOCK_DATA) {
      nodes = getMockPNodes();
      stats = getMockNetworkStats();
    } else {
      nodes = await fetchRealPNodes();
      stats = computeNetworkStats(nodes);
    }

    const responseData: PNodesResponse = { nodes, stats };

    // Cache the result
    cache.set(CACHE_KEYS.PNODES, responseData, CACHE_TTL.PNODES);

    return NextResponse.json({
      success: true,
      data: responseData,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error in /api/pnodes:', error);
    
    // Return mock data on error
    const nodes = getMockPNodes();
    const stats = getMockNetworkStats();
    
    return NextResponse.json({
      success: true,
      data: { nodes, stats },
      error: 'Using mock data due to network error',
      timestamp: new Date().toISOString(),
    });
  }
}

// Revalidate every 30 seconds
export const revalidate = 30;
