// Port Check API Route
import { NextRequest, NextResponse } from 'next/server';
import { checkHealth, getVersion } from '@/lib/prpc-client';

interface PortCheckResult {
  port: number;
  status: 'open' | 'closed' | 'error';
  latency?: number;
  message?: string;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { ip } = body;

    if (!ip) {
      return NextResponse.json(
        { error: 'IP address is required' },
        { status: 400 }
      );
    }

    // Validate IP format
    const ipRegex = /^(\d{1,3}\.){3}\d{1,3}$/;
    if (!ipRegex.test(ip)) {
      return NextResponse.json(
        { error: 'Invalid IP address format' },
        { status: 400 }
      );
    }

    const results: PortCheckResult[] = [];

    // Check port 6000 (pRPC)
    try {
      const healthResult = await checkHealth(ip, 6000);
      results.push({
        port: 6000,
        status: healthResult.isHealthy ? 'open' : 'closed',
        latency: healthResult.latencyMs,
        message: healthResult.isHealthy ? 'pRPC responding' : 'No response from pRPC',
      });
    } catch (error) {
      results.push({
        port: 6000,
        status: 'error',
        message: error instanceof Error ? error.message : 'Check failed',
      });
    }

    // Check port 9001 (Gossip) - we can't easily check UDP from here,
    // so we'll simulate based on whether port 6000 is open
    // In a real implementation, you'd need a UDP probe server
    const port6000Result = results.find((r) => r.port === 6000);
    if (port6000Result?.status === 'open') {
      // If pRPC is open, assume gossip is likely configured correctly
      results.push({
        port: 9001,
        status: 'open',
        message: 'Gossip port (assumed based on pRPC availability)',
      });
    } else {
      results.push({
        port: 9001,
        status: 'closed',
        message: 'Cannot verify UDP port without direct probe',
      });
    }

    return NextResponse.json({
      success: true,
      ip,
      results,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Port check error:', error);
    return NextResponse.json(
      { error: 'Failed to check ports' },
      { status: 500 }
    );
  }
}

