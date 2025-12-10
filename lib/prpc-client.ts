// Xandeum pRPC Client - JSON-RPC 2.0 client for pNode communication

import type {
  PodInfo,
  NodeStats,
  GetPodsResponse,
  GetStatsResponse,
  GetVersionResponse,
  PNode,
  GeoLocation,
  PrpcError,
} from './types';

// Default configuration
const DEFAULT_PORT = 6000;
const DEFAULT_TIMEOUT = 5000; // 5 seconds
const LATEST_VERSION = '0.5.0'; // Munich release

// Known seed nodes for network discovery
// These are the primary entry points to the Xandeum pNode gossip network
export const SEED_NODES = [
  '173.212.220.65',   // Primary seed node
  // Add more seed nodes as discovered from the network
  // To find more: query get_pods from any known node
];

// Environment-based seed nodes override
const envSeedNodes = process.env.XANDEUM_SEED_NODES?.split(',').filter(Boolean);
if (envSeedNodes?.length) {
  SEED_NODES.length = 0;
  SEED_NODES.push(...envSeedNodes);
}

/**
 * JSON-RPC 2.0 request structure
 */
interface JsonRpcRequest {
  jsonrpc: '2.0';
  method: string;
  params?: unknown[];
  id: number;
}

/**
 * Make a JSON-RPC 2.0 call to a pNode
 */
async function rpcCall<T>(
  host: string,
  method: string,
  params: unknown[] = [],
  port: number = DEFAULT_PORT,
  timeout: number = DEFAULT_TIMEOUT
): Promise<T> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  const request: JsonRpcRequest = {
    jsonrpc: '2.0',
    method,
    params,
    id: Date.now(),
  };

  try {
    const response = await fetch(`http://${host}:${port}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(request),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`HTTP error: ${response.status}`);
    }

    const data = await response.json();

    if (data.error) {
      const error = data.error as PrpcError;
      throw new Error(`RPC error ${error.code}: ${error.message}`);
    }

    return data as T;
  } catch (error) {
    clearTimeout(timeoutId);
    if (error instanceof Error && error.name === 'AbortError') {
      throw new Error(`Request timeout after ${timeout}ms`);
    }
    throw error;
  }
}

/**
 * Get list of all pods (pNodes) known by a node
 */
export async function getPods(
  host: string,
  port: number = DEFAULT_PORT
): Promise<{ pods: PodInfo[]; totalCount: number }> {
  try {
    const response = await rpcCall<GetPodsResponse>(host, 'get_pods', [], port);
    return {
      pods: response.result.pods || [],
      totalCount: response.result.total_count || 0,
    };
  } catch (error) {
    console.error(`Failed to get pods from ${host}:${port}:`, error);
    return { pods: [], totalCount: 0 };
  }
}

/**
 * Get statistics for a specific pNode
 */
export async function getStats(
  host: string,
  port: number = DEFAULT_PORT
): Promise<NodeStats | null> {
  try {
    const response = await rpcCall<GetStatsResponse>(host, 'get_stats', [], port);
    return response.result;
  } catch (error) {
    console.error(`Failed to get stats from ${host}:${port}:`, error);
    return null;
  }
}

/**
 * Get version of a specific pNode
 */
export async function getVersion(
  host: string,
  port: number = DEFAULT_PORT
): Promise<string | null> {
  try {
    const response = await rpcCall<GetVersionResponse>(host, 'get_version', [], port);
    return response.result;
  } catch (error) {
    console.error(`Failed to get version from ${host}:${port}:`, error);
    return null;
  }
}

/**
 * Check if a node is reachable (health check)
 */
export async function checkHealth(
  host: string,
  port: number = DEFAULT_PORT
): Promise<{ isHealthy: boolean; latencyMs: number }> {
  const startTime = Date.now();
  try {
    await getVersion(host, port);
    return {
      isHealthy: true,
      latencyMs: Date.now() - startTime,
    };
  } catch {
    return {
      isHealthy: false,
      latencyMs: Date.now() - startTime,
    };
  }
}

/**
 * Discover all nodes in the network starting from seed nodes
 */
export async function discoverNetwork(
  seedNodes: string[] = SEED_NODES,
  maxDepth: number = 3
): Promise<Map<string, PodInfo>> {
  const discovered = new Map<string, PodInfo>();
  const visited = new Set<string>();
  const queue: Array<{ host: string; depth: number }> = seedNodes.map((host) => ({
    host,
    depth: 0,
  }));

  while (queue.length > 0) {
    const batch = queue.splice(0, 10); // Process 10 at a time

    await Promise.all(
      batch.map(async ({ host, depth }) => {
        if (visited.has(host) || depth > maxDepth) return;
        visited.add(host);

        const { pods } = await getPods(host);
        
        for (const pod of pods) {
          if (!discovered.has(pod.pubkey)) {
            discovered.set(pod.pubkey, pod);
            
            // Add to queue for further discovery if not at max depth
            if (depth < maxDepth && !visited.has(pod.ip_address)) {
              queue.push({ host: pod.ip_address, depth: depth + 1 });
            }
          }
        }
      })
    );
  }

  return discovered;
}

/**
 * Get geolocation data for an IP address using free API
 */
export async function getGeoLocation(ip: string): Promise<GeoLocation | null> {
  try {
    // Using ip-api.com (free tier: 45 requests per minute)
    const response = await fetch(`http://ip-api.com/json/${ip}?fields=status,country,countryCode,city,lat,lon,isp`);
    const data = await response.json();
    
    if (data.status !== 'success') {
      return null;
    }

    return {
      country: data.country,
      countryCode: data.countryCode,
      city: data.city,
      latitude: data.lat,
      longitude: data.lon,
      isp: data.isp,
    };
  } catch (error) {
    console.error(`Failed to get geolocation for ${ip}:`, error);
    return null;
  }
}

/**
 * Check if a version string is the latest
 */
export function isLatestVersion(version: string): boolean {
  // Extract version number (e.g., "0.5.0-munich" -> "0.5.0")
  const versionMatch = version.match(/(\d+\.\d+\.\d+)/);
  if (!versionMatch) return false;
  
  const current = versionMatch[1].split('.').map(Number);
  const latest = LATEST_VERSION.split('.').map(Number);
  
  for (let i = 0; i < 3; i++) {
    if (current[i] > latest[i]) return true;
    if (current[i] < latest[i]) return false;
  }
  
  return true;
}

/**
 * Calculate Storage Reliability Index (SRI)
 * Weighted average: RPC Availability (40%) + Gossip Visibility (30%) + Version Compliance (30%)
 */
export function calculateSRI(
  rpcAvailability: number, // 0-100
  gossipVisibility: number, // 0-100
  versionCompliance: number // 0-100
): number {
  return Math.round(
    rpcAvailability * 0.4 +
    gossipVisibility * 0.3 +
    versionCompliance * 0.3
  );
}

/**
 * Convert raw pod info and stats to full PNode object
 */
export function createPNode(
  pod: PodInfo,
  stats: NodeStats | null,
  geo: GeoLocation | null,
  rpcAvailability: number = 100,
  gossipVisibility: number = 100
): PNode {
  const versionCompliance = isLatestVersion(pod.version) ? 100 : 50;
  const sri = calculateSRI(rpcAvailability, gossipVisibility, versionCompliance);
  
  const storageCapacity = stats?.storage_capacity || stats?.storage_available || 0;
  const storageUsed = stats?.storage_utilized || 0;

  return {
    pubkey: pod.pubkey,
    displayName: undefined,
    ipAddress: pod.ip_address,
    port: pod.port || DEFAULT_PORT,
    geoCountry: geo?.country,
    geoCity: geo?.city,
    geoLatitude: geo?.latitude,
    geoLongitude: geo?.longitude,
    status: stats ? 'online' : 'offline',
    lastSeen: new Date(pod.last_seen),
    version: pod.version,
    isLatestVersion: isLatestVersion(pod.version),
    uptime: stats?.uptime || 0,
    uptimePercent: stats ? Math.min(100, (stats.uptime / 86400) * 100) : 0, // % of 24h
    rpcLatency: 0, // Will be set during health check
    peerCount: stats?.peer_count || 0,
    storageUsed,
    storageCapacity,
    storagePercent: storageCapacity > 0 ? (storageUsed / storageCapacity) * 100 : 0,
    sri,
    rpcAvailability,
    gossipVisibility,
    versionCompliance,
    isIncentivized: false, // Would need on-chain data
    hasNftMultiplier: false, // Would need on-chain data
  };
}

/**
 * Fetch complete pNode data with stats and geolocation
 */
export async function fetchPNodeData(
  pod: PodInfo,
  includeGeo: boolean = true
): Promise<PNode> {
  const [stats, health, geo] = await Promise.all([
    getStats(pod.ip_address, pod.port || DEFAULT_PORT),
    checkHealth(pod.ip_address, pod.port || DEFAULT_PORT),
    includeGeo ? getGeoLocation(pod.ip_address) : Promise.resolve(null),
  ]);

  const pnode = createPNode(
    pod,
    stats,
    geo,
    health.isHealthy ? 100 : 0,
    100 // Gossip visibility (seen in network)
  );

  pnode.rpcLatency = health.latencyMs;
  pnode.status = health.isHealthy ? 'online' : 'offline';

  return pnode;
}

/**
 * Format bytes to human readable string
 */
export function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB', 'PB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
}

/**
 * Format uptime to human readable string
 */
export function formatUptime(seconds: number): string {
  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);

  if (days > 0) return `${days}d ${hours}h`;
  if (hours > 0) return `${hours}h ${minutes}m`;
  return `${minutes}m`;
}

/**
 * Truncate pubkey for display
 */
export function truncatePubkey(pubkey: string, chars: number = 4): string {
  if (pubkey.length <= chars * 2 + 3) return pubkey;
  return `${pubkey.slice(0, chars)}...${pubkey.slice(-chars)}`;
}
