'use client';

import { useEffect, useRef, useState, useMemo, useCallback } from 'react';
import dynamic from 'next/dynamic';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Globe2,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Play,
  Pause,
  MapPin,
  Activity,
  X,
  ExternalLink,
  Maximize2,
  Minimize2
} from 'lucide-react';
import type { PNode } from '@/lib/types';
import { truncatePubkey, formatBytes } from '@/lib/prpc-client';
import Link from 'next/link';

interface Globe3DProps {
  nodes: PNode[];
  isLoading?: boolean;
  onNodeClick?: (node: PNode) => void;
}

// Color based on SRI
function getSRIColor(sri: number): string {
  if (sri >= 80) return '#22c55e';
  if (sri >= 60) return '#eab308';
  return '#ef4444';
}

// Node info panel
function NodeInfoPanel({ 
  node, 
  onClose, 
  onViewDetails 
}: { 
  node: PNode; 
  onClose: () => void;
  onViewDetails: () => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, x: 20, scale: 0.95 }}
      animate={{ opacity: 1, x: 0, scale: 1 }}
      exit={{ opacity: 0, x: 20, scale: 0.95 }}
      className="absolute top-4 right-4 w-80 bg-card/95 backdrop-blur-xl border border-border/50 rounded-xl shadow-2xl overflow-hidden z-20"
    >
      {/* Gradient accent */}
      <div className="h-1 bg-gradient-to-r from-primary via-cyan-400 to-green-400" />
      
      <div className="p-4">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h3 className="font-bold text-base flex items-center gap-2">
              <div 
                className="w-3 h-3 rounded-full shadow-lg"
                style={{ 
                  backgroundColor: getSRIColor(node.sri),
                  boxShadow: `0 0 10px ${getSRIColor(node.sri)}`
                }}
              />
              {node.displayName || truncatePubkey(node.pubkey, 6)}
            </h3>
            <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
              <MapPin className="h-3 w-3" />
              {node.geoCity || 'Unknown'}, {node.geoCountry || 'Unknown'}
            </p>
          </div>
          <button 
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-muted transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        
        <div className="grid grid-cols-2 gap-3 text-xs mb-4">
          <div className="p-2 rounded-lg bg-muted/50">
            <span className="text-muted-foreground block mb-1">SRI Score</span>
            <div className="flex items-center gap-2">
              <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                <motion.div
                  className="h-full rounded-full"
                  style={{ backgroundColor: getSRIColor(node.sri) }}
                  initial={{ width: 0 }}
                  animate={{ width: `${node.sri}%` }}
                  transition={{ duration: 0.8, ease: 'easeOut' }}
                />
              </div>
              <span className="font-bold">{node.sri}</span>
            </div>
          </div>
          <div className="p-2 rounded-lg bg-muted/50">
            <span className="text-muted-foreground block mb-1">Status</span>
            <Badge
              variant="outline"
              className={`text-[10px] ${
                node.status === 'online'
                  ? 'bg-green-500/10 text-green-500 border-green-500/30'
                  : node.status === 'degraded'
                  ? 'bg-yellow-500/10 text-yellow-500 border-yellow-500/30'
                  : 'bg-red-500/10 text-red-500 border-red-500/30'
              }`}
            >
              <span className="relative flex h-2 w-2 mr-1">
                {node.status === 'online' && (
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                )}
                <span className={`relative inline-flex rounded-full h-2 w-2 ${
                  node.status === 'online' ? 'bg-green-500' : 
                  node.status === 'degraded' ? 'bg-yellow-500' : 'bg-red-500'
                }`}></span>
              </span>
              {node.status}
            </Badge>
          </div>
          <div className="p-2 rounded-lg bg-muted/50">
            <span className="text-muted-foreground block mb-1">Latency</span>
            <span className={`font-bold ${
              node.rpcLatency < 100 ? 'text-green-500' :
              node.rpcLatency < 300 ? 'text-yellow-500' : 'text-red-500'
            }`}>{node.rpcLatency}ms</span>
          </div>
          <div className="p-2 rounded-lg bg-muted/50">
            <span className="text-muted-foreground block mb-1">Peers</span>
            <span className="font-bold">{node.peerCount}</span>
          </div>
          <div className="p-2 rounded-lg bg-muted/50">
            <span className="text-muted-foreground block mb-1">Uptime</span>
            <span className="font-bold text-green-500">{node.uptimePercent.toFixed(1)}%</span>
          </div>
          <div className="p-2 rounded-lg bg-muted/50">
            <span className="text-muted-foreground block mb-1">Version</span>
            <span className="font-mono text-[10px]">{node.version.split('-').pop()}</span>
          </div>
        </div>
        
        <div className="p-2 rounded-lg bg-muted/50 mb-4">
          <span className="text-muted-foreground block mb-1 text-xs">Storage</span>
          <div className="flex items-center gap-2">
            <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
              <motion.div
                className="h-full bg-primary rounded-full"
                initial={{ width: 0 }}
                animate={{ width: `${node.storagePercent}%` }}
                transition={{ duration: 0.8, ease: 'easeOut' }}
              />
            </div>
            <span className="text-[10px] font-medium">
              {formatBytes(node.storageUsed)} / {formatBytes(node.storageCapacity)}
            </span>
          </div>
        </div>
        
        <Link href={`/node/${node.pubkey}`}>
          <Button className="w-full gap-2" onClick={onViewDetails}>
            <Activity className="h-4 w-4" />
            View Full Analytics
            <ExternalLink className="h-3 w-3" />
          </Button>
        </Link>
      </div>
    </motion.div>
  );
}

export function Globe3D({ nodes, isLoading, onNodeClick }: Globe3DProps) {
  const globeRef = useRef<any>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [Globe, setGlobe] = useState<any>(null);
  const [selectedNode, setSelectedNode] = useState<PNode | null>(null);
  const [isAutoRotating, setIsAutoRotating] = useState(true);
  const [hoveredNode, setHoveredNode] = useState<PNode | null>(null);
  const [dimensions, setDimensions] = useState({ width: 800, height: 600 });
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Load globe.gl dynamically
  useEffect(() => {
    import('react-globe.gl').then((mod) => {
      setGlobe(() => mod.default);
    });
  }, []);

  // Update dimensions using ResizeObserver
  useEffect(() => {
    const updateDimensions = () => {
      if (containerRef.current) {
        const { width, height } = containerRef.current.getBoundingClientRect();
        setDimensions({
          width,
          height: isFullscreen ? window.innerHeight - 60 : Math.max(500, height)
        });
      }
    };

    updateDimensions();
    const resizeObserver = new ResizeObserver(updateDimensions);
    if (containerRef.current) {
      resizeObserver.observe(containerRef.current);
    }

    return () => resizeObserver.disconnect();
  }, [isFullscreen]);

  // Filter nodes with valid coordinates
  const nodesWithCoords = useMemo(() => {
    return nodes.filter(
      (node) =>
        node.geoLatitude !== undefined &&
        node.geoLongitude !== undefined &&
        node.geoLatitude !== 0 &&
        node.geoLongitude !== 0
    );
  }, [nodes]);

  // Generate arcs between nodes
  const arcsData = useMemo(() => {
    if (nodesWithCoords.length < 2) return [];
    const arcs: any[] = [];
    
    // Connect nodes in same region
    const countryGroups = new Map<string, PNode[]>();
    nodesWithCoords.forEach((node) => {
      const country = node.geoCountry || 'Unknown';
      if (!countryGroups.has(country)) countryGroups.set(country, []);
      countryGroups.get(country)!.push(node);
    });

    countryGroups.forEach((groupNodes) => {
      for (let i = 0; i < Math.min(groupNodes.length - 1, 3); i++) {
        const from = groupNodes[i];
        const to = groupNodes[(i + 1) % groupNodes.length];
        arcs.push({
          startLat: from.geoLatitude,
          startLng: from.geoLongitude,
          endLat: to.geoLatitude,
          endLng: to.geoLongitude,
          color: ['rgba(0, 217, 255, 0.5)', 'rgba(34, 197, 94, 0.5)'],
        });
      }
    });

    // Add some cross-region connections
    for (let i = 0; i < Math.min(15, nodesWithCoords.length / 3); i++) {
      const from = nodesWithCoords[Math.floor(Math.random() * nodesWithCoords.length)];
      const to = nodesWithCoords[Math.floor(Math.random() * nodesWithCoords.length)];
      if (from.pubkey !== to.pubkey) {
        arcs.push({
          startLat: from.geoLatitude,
          startLng: from.geoLongitude,
          endLat: to.geoLatitude,
          endLng: to.geoLongitude,
          color: ['rgba(139, 92, 246, 0.3)', 'rgba(0, 217, 255, 0.3)'],
        });
      }
    }

    return arcs;
  }, [nodesWithCoords]);

  // Country stats
  const countryStats = useMemo(() => {
    const stats: Record<string, number> = {};
    nodesWithCoords.forEach((node) => {
      const country = node.geoCountry || 'Unknown';
      stats[country] = (stats[country] || 0) + 1;
    });
    return Object.entries(stats)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5);
  }, [nodesWithCoords]);

  // Globe controls
  const handleZoomIn = useCallback(() => {
    if (globeRef.current) {
      const camera = globeRef.current.camera();
      const controls = globeRef.current.controls();
      controls.dollyIn(1.5);
      controls.update();
    }
  }, []);

  const handleZoomOut = useCallback(() => {
    if (globeRef.current) {
      const camera = globeRef.current.camera();
      const controls = globeRef.current.controls();
      controls.dollyOut(1.5);
      controls.update();
    }
  }, []);

  const handleReset = useCallback(() => {
    if (globeRef.current) {
      globeRef.current.pointOfView({ lat: 20, lng: 0, altitude: 2.5 }, 1000);
    }
  }, []);

  const handleNodeClick = useCallback((node: PNode) => {
    setSelectedNode(node);
    if (globeRef.current && node.geoLatitude && node.geoLongitude) {
      globeRef.current.pointOfView(
        { lat: node.geoLatitude, lng: node.geoLongitude, altitude: 1.5 },
        1000
      );
    }
  }, []);

  // Configure auto-rotation
  useEffect(() => {
    if (globeRef.current) {
      const controls = globeRef.current.controls();
      controls.autoRotate = isAutoRotating;
      controls.autoRotateSpeed = 0.5;
    }
  }, [isAutoRotating]);

  // Fullscreen toggle
  const toggleFullscreen = useCallback(() => {
    setIsFullscreen(!isFullscreen);
  }, [isFullscreen]);

  if (isLoading || !Globe) {
    return (
      <Card className="bg-card/50 backdrop-blur border-border/50 overflow-hidden">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <Globe2 className="h-4 w-4 text-primary animate-pulse" />
            Global Network
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[600px] rounded-lg bg-gradient-to-b from-background to-muted/20 flex items-center justify-center">
            <div className="flex flex-col items-center gap-4">
              <div className="relative">
                <div className="w-16 h-16 rounded-full border-4 border-primary/20 border-t-primary animate-spin" />
                <Globe2 className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-6 w-6 text-primary" />
              </div>
              <span className="text-sm text-muted-foreground">Initializing 3D Globe...</span>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={`bg-card/50 backdrop-blur border-border/50 overflow-hidden transition-all duration-200 ${
      isFullscreen ? 'fixed inset-0 z-[9999] rounded-none border-0 bg-background' : ''
    }`}>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <Globe2 className="h-4 w-4 text-primary" />
            Global Network Distribution
            <Badge variant="secondary" className="ml-2 text-xs">
              {nodesWithCoords.length} nodes active
            </Badge>
          </CardTitle>
          
          {/* Controls */}
          <div className="flex items-center gap-1">
            <Button
              variant={isAutoRotating ? 'secondary' : 'ghost'}
              size="icon"
              className="h-8 w-8"
              onClick={() => setIsAutoRotating(!isAutoRotating)}
            >
              {isAutoRotating ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
            </Button>
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={handleZoomIn}>
              <ZoomIn className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={handleZoomOut}>
              <ZoomOut className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={handleReset}>
              <RotateCcw className="h-4 w-4" />
            </Button>
            <div className="w-px h-6 bg-border mx-1" />
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={toggleFullscreen}
            >
              {isFullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <div ref={containerRef} className={`relative overflow-hidden rounded-b-lg ${isFullscreen ? 'h-[calc(100vh-60px)]' : 'h-[600px]'}`}>
          <Globe
            ref={globeRef}
            width={dimensions.width}
            height={dimensions.height}
            globeImageUrl="//unpkg.com/three-globe/example/img/earth-blue-marble.jpg"
            bumpImageUrl="//unpkg.com/three-globe/example/img/earth-topology.png"
            backgroundImageUrl="//unpkg.com/three-globe/example/img/night-sky.png"
            
            // Points (nodes)
            pointsData={nodesWithCoords}
            pointLat={(d: PNode) => d.geoLatitude!}
            pointLng={(d: PNode) => d.geoLongitude!}
            pointColor={(d: PNode) => getSRIColor(d.sri)}
            pointAltitude={0.01}
            pointRadius={(d: PNode) => d.status === 'online' ? 0.3 : 0.15}
            pointLabel={(d: PNode) => `
              <div style="background: rgba(0,0,0,0.8); padding: 8px 12px; border-radius: 8px; border: 1px solid rgba(255,255,255,0.1);">
                <div style="font-weight: bold; color: white;">${d.displayName || truncatePubkey(d.pubkey, 4)}</div>
                <div style="color: #888; font-size: 11px;">${d.geoCity || 'Unknown'}, ${d.geoCountry || 'Unknown'}</div>
                <div style="margin-top: 4px;">
                  <span style="color: ${getSRIColor(d.sri)};">●</span>
                  <span style="color: white; margin-left: 4px;">SRI: ${d.sri}</span>
                </div>
              </div>
            `}
            onPointClick={(point: any) => handleNodeClick(point as PNode)}
            onPointHover={(point: any) => setHoveredNode(point as PNode | null)}
            
            // Arcs (connections)
            arcsData={arcsData}
            arcColor="color"
            arcDashLength={0.4}
            arcDashGap={0.2}
            arcDashAnimateTime={2000}
            arcStroke={0.5}
            
            // Atmosphere
            atmosphereColor="#00d9ff"
            atmosphereAltitude={0.15}
            
            // Initial view
            pointOfView={{ lat: 20, lng: 0, altitude: 2.5 }}
          />
          
          {/* Legend */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="absolute bottom-4 left-4 bg-card/90 backdrop-blur-xl p-3 rounded-xl text-xs z-10 border border-border/50"
          >
            <div className="font-semibold mb-2 text-foreground">Node Health</div>
            <div className="space-y-1.5">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-green-500 shadow-[0_0_10px_rgba(34,197,94,0.6)]" />
                <span className="text-muted-foreground">Excellent (80+)</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-yellow-500 shadow-[0_0_10px_rgba(234,179,8,0.6)]" />
                <span className="text-muted-foreground">Good (60-79)</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.6)]" />
                <span className="text-muted-foreground">Needs Attention (&lt;60)</span>
              </div>
            </div>
          </motion.div>
          
          {/* Stats overlay */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="absolute bottom-4 right-4 bg-card/90 backdrop-blur-xl p-3 rounded-xl text-xs z-10 border border-border/50"
          >
            <div className="font-semibold mb-2 flex items-center gap-1 text-foreground">
              <MapPin className="h-3 w-3 text-primary" />
              Top Regions
            </div>
            <div className="space-y-1.5">
              {countryStats.map(([country, count], i) => (
                <motion.div 
                  key={country} 
                  className="flex justify-between gap-4"
                  initial={{ opacity: 0, x: 10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.7 + i * 0.1 }}
                >
                  <span className="text-muted-foreground">{country}</span>
                  <span className="font-bold text-primary">{count}</span>
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* Selected node panel */}
          <AnimatePresence>
            {selectedNode && (
              <NodeInfoPanel
                node={selectedNode}
                onClose={() => setSelectedNode(null)}
                onViewDetails={() => {
                  onNodeClick?.(selectedNode);
                }}
              />
            )}
          </AnimatePresence>

          {/* Instructions */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1 }}
            className="absolute top-4 left-4 bg-card/80 backdrop-blur px-3 py-1.5 rounded-lg text-[10px] text-muted-foreground z-10 border border-border/50"
          >
            🖱️ Drag to rotate • Scroll to zoom • Click node for details
          </motion.div>
        </div>
      </CardContent>
    </Card>
  );
}

