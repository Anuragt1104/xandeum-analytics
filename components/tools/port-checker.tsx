'use client';

import { useState } from 'react';
import {
  Network,
  Check,
  X,
  Loader2,
  AlertCircle,
  Info,
  RefreshCw,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';

interface PortCheckResult {
  port: number;
  status: 'open' | 'closed' | 'error' | 'checking';
  latency?: number;
  message?: string;
}

const REQUIRED_PORTS = [
  { port: 6000, name: 'pRPC', description: 'Public API for RPC calls' },
  { port: 9001, name: 'Gossip', description: 'UDP gossip network communication' },
];

export function PortChecker() {
  const [ipAddress, setIpAddress] = useState('');
  const [isChecking, setIsChecking] = useState(false);
  const [results, setResults] = useState<PortCheckResult[]>([]);
  const [error, setError] = useState<string | null>(null);

  const checkPorts = async () => {
    if (!ipAddress) {
      setError('Please enter an IP address');
      return;
    }

    // Basic IP validation
    const ipRegex = /^(\d{1,3}\.){3}\d{1,3}$/;
    if (!ipRegex.test(ipAddress)) {
      setError('Please enter a valid IP address');
      return;
    }

    setError(null);
    setIsChecking(true);
    setResults(REQUIRED_PORTS.map((p) => ({ port: p.port, status: 'checking' })));

    try {
      const response = await fetch('/api/port-check', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ip: ipAddress }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Port check failed');
      }

      setResults(data.results);
    } catch (err) {
      console.error('Port check error:', err);
      setError(err instanceof Error ? err.message : 'Failed to check ports');
      setResults(REQUIRED_PORTS.map((p) => ({ 
        port: p.port, 
        status: 'error',
        message: 'Check failed' 
      })));
    } finally {
      setIsChecking(false);
    }
  };

  const getStatusIcon = (status: PortCheckResult['status']) => {
    switch (status) {
      case 'open':
        return <Check className="h-5 w-5 text-green-500" />;
      case 'closed':
        return <X className="h-5 w-5 text-red-500" />;
      case 'error':
        return <AlertCircle className="h-5 w-5 text-yellow-500" />;
      case 'checking':
        return <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />;
    }
  };

  const getStatusBadge = (status: PortCheckResult['status']) => {
    switch (status) {
      case 'open':
        return <Badge className="bg-green-500/10 text-green-500 border-green-500/20">Open</Badge>;
      case 'closed':
        return <Badge className="bg-red-500/10 text-red-500 border-red-500/20">Closed</Badge>;
      case 'error':
        return <Badge className="bg-yellow-500/10 text-yellow-500 border-yellow-500/20">Error</Badge>;
      case 'checking':
        return <Badge variant="secondary">Checking...</Badge>;
    }
  };

  const allOpen = results.length > 0 && results.every((r) => r.status === 'open');
  const hasClosed = results.some((r) => r.status === 'closed');

  return (
    <Card className="bg-card/50 backdrop-blur">
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <Network className="h-5 w-5" />
          Port Checker
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-muted-foreground">
          Check if your pNode&apos;s required ports are accessible from the internet.
          Both ports must be open for your node to function correctly.
        </p>

        {/* Input */}
        <div className="flex gap-2">
          <Input
            placeholder="Enter your pNode IP address (e.g., 173.212.220.65)"
            value={ipAddress}
            onChange={(e) => setIpAddress(e.target.value)}
            className="flex-1"
          />
          <Button onClick={checkPorts} disabled={isChecking}>
            {isChecking ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Checking...
              </>
            ) : (
              <>
                <RefreshCw className="h-4 w-4 mr-2" />
                Check Ports
              </>
            )}
          </Button>
        </div>

        {error && (
          <div className="flex items-center gap-2 p-3 rounded-lg bg-red-500/10 text-red-500 text-sm">
            <AlertCircle className="h-4 w-4 shrink-0" />
            {error}
          </div>
        )}

        {/* Results */}
        {results.length > 0 && (
          <div className="space-y-3">
            {/* Summary */}
            {!isChecking && (
              <div className={`p-3 rounded-lg ${
                allOpen 
                  ? 'bg-green-500/10 text-green-500' 
                  : hasClosed 
                  ? 'bg-red-500/10 text-red-500'
                  : 'bg-yellow-500/10 text-yellow-500'
              }`}>
                <div className="flex items-center gap-2">
                  {allOpen ? (
                    <>
                      <Check className="h-5 w-5" />
                      <span className="font-medium">All ports are open and accessible!</span>
                    </>
                  ) : hasClosed ? (
                    <>
                      <AlertCircle className="h-5 w-5" />
                      <span className="font-medium">Some ports are closed. Your pNode may not function correctly.</span>
                    </>
                  ) : (
                    <>
                      <AlertCircle className="h-5 w-5" />
                      <span className="font-medium">Could not verify all ports.</span>
                    </>
                  )}
                </div>
              </div>
            )}

            {/* Port Details */}
            <div className="space-y-2">
              {REQUIRED_PORTS.map((portInfo) => {
                const result = results.find((r) => r.port === portInfo.port);
                return (
                  <div
                    key={portInfo.port}
                    className="flex items-center justify-between p-3 rounded-lg bg-muted/50"
                  >
                    <div className="flex items-center gap-3">
                      {result && getStatusIcon(result.status)}
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-medium">Port {portInfo.port}</span>
                          <span className="text-sm text-muted-foreground">({portInfo.name})</span>
                        </div>
                        <p className="text-xs text-muted-foreground">{portInfo.description}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      {result?.latency && (
                        <span className="text-sm text-muted-foreground">{result.latency}ms</span>
                      )}
                      {result && getStatusBadge(result.status)}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Help Text */}
        <div className="p-3 rounded-lg bg-muted/30 text-sm">
          <div className="flex items-start gap-2">
            <Info className="h-4 w-4 mt-0.5 text-muted-foreground shrink-0" />
            <div className="text-muted-foreground">
              <p className="mb-2">
                <strong>Port 6000 (TCP)</strong>: Required for pRPC API calls. Must be open to 0.0.0.0.
              </p>
              <p className="mb-2">
                <strong>Port 9001 (UDP)</strong>: Required for gossip network communication.
              </p>
              <p>
                If ports are closed, check your firewall settings or contact your hosting provider.
              </p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

