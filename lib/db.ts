// Prisma Database Client
// Singleton pattern for Next.js hot reloading

import { PrismaClient } from '@prisma/client';

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  });

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;

export default prisma;

// Helper types for common queries
export type NodeWithMetrics = Awaited<ReturnType<typeof getNodeWithLatestMetrics>>;

// Helper functions for common database operations
export async function getNodeWithLatestMetrics(identityPubkey: string) {
  return prisma.pNode.findUnique({
    where: { identityPubkey },
    include: {
      metrics: {
        orderBy: { timestamp: 'desc' },
        take: 1,
      },
      claimedBy: {
        include: {
          user: {
            select: {
              name: true,
              image: true,
            },
          },
        },
      },
    },
  });
}

export async function getAllNodesWithLatestMetrics() {
  return prisma.pNode.findMany({
    include: {
      metrics: {
        orderBy: { timestamp: 'desc' },
        take: 1,
      },
    },
    orderBy: {
      lastSeen: 'desc',
    },
  });
}

export async function upsertNode(data: {
  identityPubkey: string;
  currentIp: string;
  port?: number;
  softwareVersion: string;
  geoCountry?: string;
  geoCountryCode?: string;
  geoCity?: string;
  geoLatitude?: number;
  geoLongitude?: number;
  geoIsp?: string;
  status: 'ONLINE' | 'OFFLINE' | 'DEGRADED';
  isLatestVersion?: boolean;
  isIncentivized?: boolean;
  hasNftMultiplier?: boolean;
}) {
  return prisma.pNode.upsert({
    where: { identityPubkey: data.identityPubkey },
    update: {
      currentIp: data.currentIp,
      port: data.port ?? 6000,
      softwareVersion: data.softwareVersion,
      geoCountry: data.geoCountry,
      geoCountryCode: data.geoCountryCode,
      geoCity: data.geoCity,
      geoLatitude: data.geoLatitude,
      geoLongitude: data.geoLongitude,
      geoIsp: data.geoIsp,
      status: data.status,
      isLatestVersion: data.isLatestVersion ?? false,
      lastSeen: new Date(),
    },
    create: {
      identityPubkey: data.identityPubkey,
      currentIp: data.currentIp,
      port: data.port ?? 6000,
      softwareVersion: data.softwareVersion,
      geoCountry: data.geoCountry,
      geoCountryCode: data.geoCountryCode,
      geoCity: data.geoCity,
      geoLatitude: data.geoLatitude,
      geoLongitude: data.geoLongitude,
      geoIsp: data.geoIsp,
      status: data.status,
      isLatestVersion: data.isLatestVersion ?? false,
      isIncentivized: data.isIncentivized ?? false,
      hasNftMultiplier: data.hasNftMultiplier ?? false,
    },
  });
}

export async function recordNodeMetric(data: {
  nodeId: string;
  uptimeSeconds: bigint;
  uptimePercent: number;
  rpcLatencyMs: number;
  peerCount: number;
  storageUsedBytes: bigint;
  storageCapacityBytes: bigint;
  storagePercent: number;
  sri: number;
  rpcAvailability: number;
  gossipVisibility: number;
  versionCompliance: number;
  statusCode?: number;
  sentinelId?: string;
}) {
  return prisma.nodeMetric.create({
    data: {
      nodeId: data.nodeId,
      uptimeSeconds: data.uptimeSeconds,
      uptimePercent: data.uptimePercent,
      rpcLatencyMs: data.rpcLatencyMs,
      peerCount: data.peerCount,
      storageUsedBytes: data.storageUsedBytes,
      storageCapacityBytes: data.storageCapacityBytes,
      storagePercent: data.storagePercent,
      sri: data.sri,
      rpcAvailability: data.rpcAvailability,
      gossipVisibility: data.gossipVisibility,
      versionCompliance: data.versionCompliance,
      statusCode: data.statusCode ?? 200,
      sentinelId: data.sentinelId,
    },
  });
}

export async function getNodeMetricsHistory(nodeId: string, hours: number = 24) {
  const since = new Date(Date.now() - hours * 60 * 60 * 1000);
  return prisma.nodeMetric.findMany({
    where: {
      nodeId,
      timestamp: { gte: since },
    },
    orderBy: { timestamp: 'asc' },
  });
}

export async function recordNetworkSnapshot(data: {
  totalNodes: number;
  activeNodes: number;
  totalStorageCapacity: bigint;
  totalStorageUsed: bigint;
  averageSri: number;
  averageUptime: number;
  averageLatency: number;
  nodesOnLatestVersion: number;
  latestVersion: string;
}) {
  return prisma.networkSnapshot.create({ data });
}

export async function getNetworkHistory(hours: number = 24) {
  const since = new Date(Date.now() - hours * 60 * 60 * 1000);
  return prisma.networkSnapshot.findMany({
    where: { timestamp: { gte: since } },
    orderBy: { timestamp: 'asc' },
  });
}

export async function getNodePeers(nodeId: string) {
  return prisma.nodePeer.findMany({
    where: { nodeId },
    include: {
      peer: {
        select: {
          identityPubkey: true,
          displayName: true,
          currentIp: true,
          status: true,
          geoCountry: true,
          geoCity: true,
        },
      },
    },
  });
}

export async function updateNodePeers(nodeId: string, peerIds: string[]) {
  // Remove old peer relationships
  await prisma.nodePeer.deleteMany({
    where: { nodeId },
  });
  
  // Add new peer relationships
  const peerData = peerIds.map((peerId) => ({
    nodeId,
    peerId,
  }));
  
  return prisma.nodePeer.createMany({
    data: peerData,
    skipDuplicates: true,
  });
}

