// Mock data for development and demo purposes
// This simulates pNode data when the actual network is unavailable

import type { PNode, NetworkStats } from './types';

const MOCK_VERSIONS = ['0.5.0-munich', '0.4.0-harrenburgg', '0.4.0-ingolstadt'];
const MOCK_COUNTRIES = ['US', 'DE', 'SG', 'JP', 'NL', 'FR', 'GB', 'CA', 'AU', 'BR'];
const MOCK_CITIES: Record<string, string[]> = {
  US: ['New York', 'Los Angeles', 'Chicago', 'Dallas', 'Miami'],
  DE: ['Frankfurt', 'Berlin', 'Munich', 'Hamburg'],
  SG: ['Singapore'],
  JP: ['Tokyo', 'Osaka'],
  NL: ['Amsterdam', 'Rotterdam'],
  FR: ['Paris', 'Lyon'],
  GB: ['London', 'Manchester'],
  CA: ['Toronto', 'Vancouver'],
  AU: ['Sydney', 'Melbourne'],
  BR: ['Sao Paulo', 'Rio de Janeiro'],
};

const MOCK_COORDINATES: Record<string, { lat: number; lon: number }> = {
  'New York': { lat: 40.7128, lon: -74.006 },
  'Los Angeles': { lat: 34.0522, lon: -118.2437 },
  Chicago: { lat: 41.8781, lon: -87.6298 },
  Dallas: { lat: 32.7767, lon: -96.797 },
  Miami: { lat: 25.7617, lon: -80.1918 },
  Frankfurt: { lat: 50.1109, lon: 8.6821 },
  Berlin: { lat: 52.52, lon: 13.405 },
  Munich: { lat: 48.1351, lon: 11.582 },
  Hamburg: { lat: 53.5511, lon: 9.9937 },
  Singapore: { lat: 1.3521, lon: 103.8198 },
  Tokyo: { lat: 35.6762, lon: 139.6503 },
  Osaka: { lat: 34.6937, lon: 135.5023 },
  Amsterdam: { lat: 52.3676, lon: 4.9041 },
  Rotterdam: { lat: 51.9225, lon: 4.4792 },
  Paris: { lat: 48.8566, lon: 2.3522 },
  Lyon: { lat: 45.764, lon: 4.8357 },
  London: { lat: 51.5074, lon: -0.1278 },
  Manchester: { lat: 53.4808, lon: -2.2426 },
  Toronto: { lat: 43.6532, lon: -79.3832 },
  Vancouver: { lat: 49.2827, lon: -123.1207 },
  Sydney: { lat: -33.8688, lon: 151.2093 },
  Melbourne: { lat: -37.8136, lon: 144.9631 },
  'Sao Paulo': { lat: -23.5505, lon: -46.6333 },
  'Rio de Janeiro': { lat: -22.9068, lon: -43.1729 },
};

function randomElement<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function randomBetween(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function generatePubkey(): string {
  const chars = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz';
  let result = '';
  for (let i = 0; i < 44; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

function generateIP(): string {
  return `${randomBetween(1, 255)}.${randomBetween(1, 255)}.${randomBetween(1, 255)}.${randomBetween(1, 255)}`;
}

export function generateMockPNode(index: number): PNode {
  const country = randomElement(MOCK_COUNTRIES);
  const city = randomElement(MOCK_CITIES[country] || ['Unknown']);
  const coords = MOCK_COORDINATES[city] || { lat: 0, lon: 0 };
  const version = randomElement(MOCK_VERSIONS);
  const isLatestVersion = version.includes('0.5.0');
  const isOnline = Math.random() > 0.1; // 90% chance online
  
  const storageCapacity = randomBetween(100, 10000) * 1024 * 1024 * 1024; // 100GB - 10TB
  const storageUsed = Math.floor(storageCapacity * (Math.random() * 0.8)); // Up to 80% used
  
  const rpcAvailability = isOnline ? randomBetween(85, 100) : randomBetween(0, 30);
  const gossipVisibility = randomBetween(70, 100);
  const versionCompliance = isLatestVersion ? 100 : 50;
  const sri = Math.round(
    rpcAvailability * 0.4 +
    gossipVisibility * 0.3 +
    versionCompliance * 0.3
  );

  return {
    pubkey: generatePubkey(),
    displayName: Math.random() > 0.7 ? `pNode-${index + 1}` : undefined,
    ipAddress: generateIP(),
    port: 6000,
    geoCountry: country,
    geoCity: city,
    geoLatitude: coords.lat + (Math.random() - 0.5) * 0.1,
    geoLongitude: coords.lon + (Math.random() - 0.5) * 0.1,
    status: isOnline ? 'online' : 'offline',
    lastSeen: new Date(Date.now() - randomBetween(0, 300000)), // Up to 5 min ago
    firstSeen: new Date(Date.now() - randomBetween(86400000, 86400000 * 30)), // 1-30 days ago
    version,
    isLatestVersion,
    uptime: randomBetween(3600, 2592000), // 1 hour to 30 days in seconds
    uptimePercent: randomBetween(85, 100),
    rpcLatency: isOnline ? randomBetween(20, 500) : 9999,
    peerCount: randomBetween(5, 50),
    storageUsed,
    storageCapacity,
    storagePercent: (storageUsed / storageCapacity) * 100,
    sri,
    rpcAvailability,
    gossipVisibility,
    versionCompliance,
    isIncentivized: Math.random() > 0.7,
    hasNftMultiplier: Math.random() > 0.85,
  };
}

export function generateMockPNodes(count: number = 50): PNode[] {
  const nodes: PNode[] = [];
  for (let i = 0; i < count; i++) {
    nodes.push(generateMockPNode(i));
  }
  // Sort by SRI descending
  return nodes.sort((a, b) => b.sri - a.sri);
}

export function generateMockNetworkStats(nodes: PNode[]): NetworkStats {
  const activeNodes = nodes.filter((n) => n.status === 'online');
  const totalStorage = nodes.reduce((sum, n) => sum + n.storageCapacity, 0);
  const usedStorage = nodes.reduce((sum, n) => sum + n.storageUsed, 0);
  const avgSri = nodes.reduce((sum, n) => sum + n.sri, 0) / nodes.length;
  const avgUptime = nodes.reduce((sum, n) => sum + n.uptimePercent, 0) / nodes.length;
  const avgLatency = activeNodes.reduce((sum, n) => sum + n.rpcLatency, 0) / activeNodes.length;
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

// Cache mock data to keep it consistent during development
let cachedMockNodes: PNode[] | null = null;

export function getMockPNodes(): PNode[] {
  if (!cachedMockNodes) {
    cachedMockNodes = generateMockPNodes(75);
  }
  return cachedMockNodes;
}

export function getMockNetworkStats(): NetworkStats {
  return generateMockNetworkStats(getMockPNodes());
}

export function refreshMockData(): void {
  cachedMockNodes = null;
}
