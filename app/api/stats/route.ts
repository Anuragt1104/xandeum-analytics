// API Route: GET /api/stats
// Returns network-wide statistics

import { NextResponse } from 'next/server';
import type { NetworkStats, ApiResponse } from '@/lib/types';
import { cache, CACHE_KEYS, CACHE_TTL } from '@/lib/cache';
import { getMockNetworkStats } from '@/lib/mock-data';

export async function GET(): Promise<NextResponse<ApiResponse<NetworkStats>>> {
  try {
    // Check cache first
    const cachedStats = cache.get<NetworkStats>(CACHE_KEYS.NETWORK_STATS);
    if (cachedStats) {
      return NextResponse.json({
        success: true,
        data: cachedStats,
        timestamp: new Date().toISOString(),
      });
    }

    // Get stats from mock data (in production, this would compute from real data)
    const stats = getMockNetworkStats();

    // Cache the result
    cache.set(CACHE_KEYS.NETWORK_STATS, stats, CACHE_TTL.NETWORK_STATS);

    return NextResponse.json({
      success: true,
      data: stats,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error in /api/stats:', error);
    
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch network stats',
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}

export const revalidate = 30;
