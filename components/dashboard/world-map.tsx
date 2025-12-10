'use client';

import { useEffect, useMemo, useState, useCallback } from 'react';
import dynamic from 'next/dynamic';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Globe, MapPin, Layers, ZoomIn, ZoomOut, Maximize2, X } from 'lucide-react';
import type { PNode } from '@/lib/types';
import { truncatePubkey, formatBytes } from '@/lib/prpc-client';

// Dynamically import Leaflet components to avoid SSR issues
const MapContainer = dynamic(
  () => import('react-leaflet').then((mod) => mod.MapContainer),
  { ssr: false }
);
const TileLayer = dynamic(
  () => import('react-leaflet').then((mod) => mod.TileLayer),
  { ssr: false }
);
const CircleMarker = dynamic(
  () => import('react-leaflet').then((mod) => mod.CircleMarker),
  { ssr: false }
);
const Popup = dynamic(
  () => import('react-leaflet').then((mod) => mod.Popup),
  { ssr: false }
);
const Polyline = dynamic(
  () => import('react-leaflet').then((mod) => mod.Polyline),
  { ssr: false }
);

interface WorldMapProps {
  nodes: PNode[];
  isLoading?: boolean;
  onNodeClick?: (node: PNode) => void;
}

// Map themes with better dark mode support
const MAP_TILES = {
  dark: {
    url: 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',
    attribution: '&copy; OpenStreetMap &copy; CARTO',
  },
  darker: {
    url: 'https://tiles.stadiamaps.com/tiles/alidade_smooth_dark/{z}/{x}/{y}{r}.png',
    attribution: '&copy; Stadia Maps',
  },
  satellite: {
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
    attribution: '&copy; Esri',
  },
};

// Color based on SRI score
function getSRIColor(sri: number): string {
  if (sri >= 80) return '#22c55e'; // green
  if (sri >= 60) return '#eab308'; // yellow
  return '#ef4444'; // red
}

// Get marker radius based on storage capacity
function getMarkerRadius(storageCapacity: number, peerCount: number): number {
  const gb = storageCapacity / (1024 * 1024 * 1024);
  const base = Math.min(15, Math.max(6, Math.log10(gb + 1) * 4));
  const peerBonus = Math.min(5, peerCount / 10);
  return base + peerBonus;
}

// Generate connections between nearby nodes
function generateConnections(nodes: PNode[]): Array<{ from: PNode; to: PNode; strength: number }> {
  const connections: Array<{ from: PNode; to: PNode; strength: number }> = [];
  const maxDistance = 30; // degrees
  
  // Group by country for more connections
  const countryGroups = new Map<string, PNode[]>();
  nodes.forEach(node => {
    const country = node.geoCountry || 'Unknown';
    if (!countryGroups.has(country)) {
      countryGroups.set(country, []);
    }
    countryGroups.get(country)!.push(node);
  });
  
  // Connect nodes within same country
  countryGroups.forEach((groupNodes) => {
    for (let i = 0; i < Math.min(groupNodes.length - 1, 3); i++) {
      const from = groupNodes[i];
      const to = groupNodes[(i + 1) % groupNodes.length];
      if (from.geoLatitude && from.geoLongitude && to.geoLatitude && to.geoLongitude) {
        connections.push({ from, to, strength: 0.8 });
      }
    }
  });
  
  // Add some cross-region connections
  const allNodes = nodes.filter(n => n.geoLatitude && n.geoLongitude);
  for (let i = 0; i < Math.min(10, allNodes.length / 3); i++) {
    const from = allNodes[Math.floor(Math.random() * allNodes.length)];
    const to = allNodes[Math.floor(Math.random() * allNodes.length)];
    if (from.pubkey !== to.pubkey) {
      connections.push({ from, to, strength: 0.3 });
    }
  }
  
  return connections.slice(0, 50); // Limit for performance
}

// Animated pulsing marker component info panel
function NodeInfoPanel({ node, onClose, onViewDetails }: { 
  node: PNode; 
  onClose: () => void;
  onViewDetails: () => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 10, scale: 0.95 }}
      className="absolute bottom-4 left-4 right-4 md:left-auto md:right-4 md:w-80 z-[1000] bg-card/95 backdrop-blur-lg border border-border/50 rounded-xl shadow-2xl overflow-hidden"
    >
      <div className="p-4">
        <div className="flex items-start justify-between mb-3">
          <div>
            <h3 className="font-semibold text-sm">
              {node.displayName || truncatePubkey(node.pubkey, 6)}
            </h3>
            <p className="text-xs text-muted-foreground">
              {node.geoCity}, {node.geoCountry}
            </p>
          </div>
          <button 
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-muted transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        
        <div className="grid grid-cols-2 gap-3 text-xs mb-4">
          <div className="space-y-0.5">
            <span className="text-muted-foreground">SRI Score</span>
            <div className="flex items-center gap-1">
              <div 
                className="w-2 h-2 rounded-full" 
                style={{ backgroundColor: getSRIColor(node.sri) }}
              />
              <span className="font-medium">{node.sri}</span>
            </div>
          </div>
          <div className="space-y-0.5">
            <span className="text-muted-foreground">Status</span>
            <Badge
              variant="outline"
              className={`text-[10px] ${
                node.status === 'online'
                  ? 'bg-green-500/10 text-green-500 border-green-500/30'
                  : 'bg-red-500/10 text-red-500 border-red-500/30'
              }`}
            >
              {node.status}
            </Badge>
          </div>
          <div className="space-y-0.5">
            <span className="text-muted-foreground">Latency</span>
            <span className="font-medium">{node.rpcLatency}ms</span>
          </div>
          <div className="space-y-0.5">
            <span className="text-muted-foreground">Peers</span>
            <span className="font-medium">{node.peerCount}</span>
          </div>
          <div className="space-y-0.5 col-span-2">
            <span className="text-muted-foreground">Storage</span>
            <div className="flex items-center gap-2">
              <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
                <div 
                  className="h-full bg-primary rounded-full transition-all"
                  style={{ width: `${node.storagePercent}%` }}
                />
              </div>
              <span className="font-medium text-[10px]">
                {formatBytes(node.storageUsed)} / {formatBytes(node.storageCapacity)}
              </span>
            </div>
          </div>
        </div>
        
        <Button onClick={onViewDetails} size="sm" className="w-full">
          View Full Details
        </Button>
      </div>
    </motion.div>
  );
}

export function WorldMap({ nodes, isLoading, onNodeClick }: WorldMapProps) {
  const [mapTheme, setMapTheme] = useState<'dark' | 'darker' | 'satellite'>('dark');
  const [isMounted, setIsMounted] = useState(false);
  const [selectedNode, setSelectedNode] = useState<PNode | null>(null);
  const [showConnections, setShowConnections] = useState(true);

  useEffect(() => {
    setIsMounted(true);
  }, []);

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

  // Generate connection lines
  const connections = useMemo(() => {
    if (!showConnections || nodesWithCoords.length < 2) return [];
    return generateConnections(nodesWithCoords);
  }, [nodesWithCoords, showConnections]);

  // Aggregate stats by country
  const countryStats = useMemo(() => {
    const stats: Record<string, { count: number; avgSri: number }> = {};
    nodesWithCoords.forEach((node) => {
      const country = node.geoCountry || 'Unknown';
      if (!stats[country]) {
        stats[country] = { count: 0, avgSri: 0 };
      }
      stats[country].count++;
      stats[country].avgSri += node.sri;
    });
    Object.keys(stats).forEach((country) => {
      stats[country].avgSri = Math.round(stats[country].avgSri / stats[country].count);
    });
    return stats;
  }, [nodesWithCoords]);

  // Top countries by node count
  const topCountries = useMemo(() => {
    return Object.entries(countryStats)
      .sort(([, a], [, b]) => b.count - a.count)
      .slice(0, 5);
  }, [countryStats]);

  const handleNodeClick = useCallback((node: PNode) => {
    setSelectedNode(node);
  }, []);

  if (isLoading || !isMounted) {
    return (
      <Card className="bg-card/50 backdrop-blur border-border/50 overflow-hidden">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <Globe className="h-4 w-4 text-primary" />
            Network Distribution
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[500px] rounded-lg bg-muted/20 flex items-center justify-center">
            <div className="flex flex-col items-center gap-3">
              <div className="w-10 h-10 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
              <span className="text-sm text-muted-foreground">Loading map data...</span>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-card/50 backdrop-blur border-border/50 overflow-hidden">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <Globe className="h-4 w-4 text-primary" />
            Network Distribution
            <Badge variant="secondary" className="ml-2 text-xs">
              {nodesWithCoords.length} nodes mapped
            </Badge>
          </CardTitle>
          
          {/* Controls */}
          <div className="flex items-center gap-2">
            {/* Connection toggle */}
            <Button
              variant={showConnections ? 'secondary' : 'ghost'}
              size="sm"
              className="h-7 px-2 text-xs"
              onClick={() => setShowConnections(!showConnections)}
            >
              <Layers className="h-3 w-3 mr-1" />
              Links
            </Button>
            
            {/* Theme Toggle */}
            <div className="flex items-center gap-0.5 p-0.5 rounded-lg bg-muted/50">
              {(['dark', 'darker', 'satellite'] as const).map((theme) => (
                <Button
                  key={theme}
                  variant={mapTheme === theme ? 'secondary' : 'ghost'}
                  size="sm"
                  className="h-6 px-2 text-[10px] capitalize"
                  onClick={() => setMapTheme(theme)}
                >
                  {theme === 'satellite' ? <Layers className="h-3 w-3" /> : theme}
                </Button>
              ))}
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <div className="relative">
          {/* Map Container */}
          <div className="h-[500px] w-full">
            <MapContainer
              center={[20, 0]}
              zoom={2}
              minZoom={2}
              maxZoom={12}
              style={{ height: '100%', width: '100%' }}
              className="rounded-b-lg"
              scrollWheelZoom={true}
              zoomControl={false}
            >
              <TileLayer
                url={MAP_TILES[mapTheme].url}
                attribution={MAP_TILES[mapTheme].attribution}
              />
              
              {/* Connection lines */}
              {showConnections && connections.map((conn, i) => (
                <Polyline
                  key={`conn-${i}`}
                  positions={[
                    [conn.from.geoLatitude!, conn.from.geoLongitude!],
                    [conn.to.geoLatitude!, conn.to.geoLongitude!],
                  ]}
                  pathOptions={{
                    color: 'var(--primary)',
                    weight: 1,
                    opacity: conn.strength * 0.3,
                    dashArray: '5, 10',
                  }}
                />
              ))}
              
              {/* Node markers with glow effect */}
              {nodesWithCoords.map((node) => {
                const radius = getMarkerRadius(node.storageCapacity, node.peerCount);
                const color = getSRIColor(node.sri);
                const isSelected = selectedNode?.pubkey === node.pubkey;
                
                return (
                  <CircleMarker
                    key={node.pubkey}
                    center={[node.geoLatitude!, node.geoLongitude!]}
                    radius={isSelected ? radius * 1.5 : radius}
                    pathOptions={{
                      color: isSelected ? '#fff' : color,
                      fillColor: color,
                      fillOpacity: node.status === 'online' ? 0.8 : 0.4,
                      weight: isSelected ? 3 : 2,
                    }}
                    eventHandlers={{
                      click: () => handleNodeClick(node),
                    }}
                  >
                    <Popup>
                      <div className="p-2 min-w-[180px] text-foreground">
                        <div className="font-semibold text-sm mb-2">
                          {node.displayName || truncatePubkey(node.pubkey, 6)}
                        </div>
                        <div className="space-y-1 text-xs">
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Location:</span>
                            <span>{node.geoCity}, {node.geoCountry}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">SRI:</span>
                            <span style={{ color }}>{node.sri}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Status:</span>
                            <span className={node.status === 'online' ? 'text-green-500' : 'text-red-500'}>
                              {node.status}
                            </span>
                          </div>
                        </div>
                        {onNodeClick && (
                          <Button
                            size="sm"
                            className="w-full mt-2 h-7 text-xs"
                            onClick={() => onNodeClick(node)}
                          >
                            View Details
                          </Button>
                        )}
                      </div>
                    </Popup>
                  </CircleMarker>
                );
              })}
            </MapContainer>
          </div>
          
          {/* Legend Overlay */}
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.5 }}
            className="absolute bottom-4 left-4 bg-card/90 backdrop-blur-lg p-3 rounded-lg text-xs z-[1000] border border-border/50"
          >
            <div className="font-medium mb-2 text-foreground">SRI Score</div>
            <div className="space-y-1.5">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.5)]" />
                <span className="text-muted-foreground">High (80+)</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-yellow-500 shadow-[0_0_8px_rgba(234,179,8,0.5)]" />
                <span className="text-muted-foreground">Medium (60-79)</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.5)]" />
                <span className="text-muted-foreground">Low (&lt;60)</span>
              </div>
            </div>
          </motion.div>
          
          {/* Stats Overlay */}
          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.6 }}
            className="absolute top-4 right-4 bg-card/90 backdrop-blur-lg p-3 rounded-lg text-xs z-[1000] border border-border/50 hidden md:block"
          >
            <div className="font-medium mb-2 flex items-center gap-1 text-foreground">
              <MapPin className="h-3 w-3 text-primary" />
              Top Regions
            </div>
            <div className="space-y-1.5">
              {topCountries.map(([country, stats], i) => (
                <motion.div 
                  key={country} 
                  className="flex justify-between gap-4"
                  initial={{ opacity: 0, x: 10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.7 + i * 0.1 }}
                >
                  <span className="text-muted-foreground">{country}</span>
                  <span className="font-medium text-foreground">{stats.count}</span>
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* Selected node info panel */}
          <AnimatePresence>
            {selectedNode && (
              <NodeInfoPanel
                node={selectedNode}
                onClose={() => setSelectedNode(null)}
                onViewDetails={() => {
                  onNodeClick?.(selectedNode);
                  setSelectedNode(null);
                }}
              />
            )}
          </AnimatePresence>
        </div>
      </CardContent>
    </Card>
  );
}
