// Xandeum pNode Analytics - Type Definitions

/**
 * Basic pNode information from gossip network
 */
export interface PodInfo {
  pubkey: string;
  ip_address: string;
  port: number;
  last_seen: string;
  version: string;
}

/**
 * Detailed node statistics from get_stats RPC call
 */
export interface NodeStats {
  uptime: number;
  storage_utilized: number;
  storage_available: number;
  storage_capacity: number;
  packets_sent: number;
  packets_received: number;
  cpu_percent: number;
  memory_percent: number;
  peer_count: number;
}

/**
 * Combined pNode data with computed metrics
 */
export interface PNode {
  // Identity
  pubkey: string;
  displayName?: string;
  
  // Network
  ipAddress: string;
  port: number;
  geoCountry?: string;
  geoCity?: string;
  geoLatitude?: number;
  geoLongitude?: number;
  
  // Status
  status: 'online' | 'offline' | 'degraded';
  lastSeen: Date;
  firstSeen?: Date;
  version: string;
  isLatestVersion: boolean;
  
  // Performance Metrics
  uptime: number; // seconds
  uptimePercent: number; // 0-100
  rpcLatency: number; // ms
  peerCount: number;
  
  // Storage Metrics
  storageUsed: number; // bytes
  storageCapacity: number; // bytes
  storagePercent: number; // 0-100
  
  // Computed Scores
  sri: number; // Storage Reliability Index (0-100)
  rpcAvailability: number; // 0-100
  gossipVisibility: number; // 0-100
  versionCompliance: number; // 0-100
  
  // Flags
  isIncentivized: boolean;
  hasNftMultiplier: boolean;
}

/**
 * Network-wide statistics
 */
export interface NetworkStats {
  totalNodes: number;
  activeNodes: number;
  totalStorageCapacity: number; // bytes
  totalStorageUsed: number; // bytes
  averageSri: number;
  averageUptime: number;
  averageLatency: number;
  latestVersion: string;
  nodesOnLatestVersion: number;
  lastUpdated: Date;
}

/**
 * Response from get_pods RPC call
 */
export interface GetPodsResponse {
  jsonrpc: string;
  result: {
    pods: PodInfo[];
    total_count: number;
  };
  id: number;
}

/**
 * Response from get_stats RPC call
 */
export interface GetStatsResponse {
  jsonrpc: string;
  result: NodeStats;
  id: number;
}

/**
 * Response from get_version RPC call
 */
export interface GetVersionResponse {
  jsonrpc: string;
  result: string;
  id: number;
}

/**
 * Time-series metric point
 */
export interface MetricPoint {
  timestamp: Date;
  value: number;
}

/**
 * Historical metrics for a node
 */
export interface NodeHistory {
  pubkey: string;
  uptime: MetricPoint[];
  latency: MetricPoint[];
  storageUsed: MetricPoint[];
  peerCount: MetricPoint[];
}

/**
 * API response wrapper
 */
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  timestamp: string;
}

/**
 * Sorting options for the node table
 */
export type SortField = 
  | 'rank'
  | 'sri'
  | 'pubkey'
  | 'version'
  | 'uptime'
  | 'latency'
  | 'peers'
  | 'storage'
  | 'status';

export type SortDirection = 'asc' | 'desc';

export interface SortConfig {
  field: SortField;
  direction: SortDirection;
}

/**
 * Filter options
 */
export interface FilterConfig {
  search: string;
  status: 'all' | 'online' | 'offline' | 'degraded';
  version: string | 'all';
  minSri: number;
  showIncentivizedOnly: boolean;
}

/**
 * Cache entry for API responses
 */
export interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number;
}

/**
 * pRPC Error
 */
export interface PrpcError {
  code: number;
  message: string;
  data?: unknown;
}

/**
 * Geolocation data from IP
 */
export interface GeoLocation {
  country: string;
  countryCode: string;
  city: string;
  latitude: number;
  longitude: number;
  isp?: string;
}
