'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import 'leaflet.markercluster/dist/MarkerCluster.css';
import 'leaflet.markercluster/dist/MarkerCluster.Default.css';
import 'leaflet.markercluster';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Globe2, 
  Maximize2, 
  Minimize2, 
  ZoomIn, 
  ZoomOut, 
  RotateCcw,
  MapPin,
  X,
  Activity,
  ExternalLink,
  Layers,
  Mountain,
  Moon
} from 'lucide-react';
import type { PNode } from '@/lib/types';
import { truncatePubkey, formatBytes } from '@/lib/prpc-client';
import Link from 'next/link';

interface WorldMapProps {
  nodes: PNode[];
  isLoading?: boolean;
  onNodeClick?: (node: PNode) => void;
}

type MapStyle = 'satellite' | 'topo' | 'dark';

// Get status color - Xandeum brand colors
function getStatusColor(status: string): string {
  switch (status) {
    case 'online': return '#00B39B'; // xandeum green
    case 'degraded': return '#F5A623'; // xandeum orange
    case 'offline': return '#ef4444'; // red
    default: return '#6b7280';
  }
}

// Get SRI color
function getSRIColor(sri: number): string {
  if (sri >= 80) return '#00C9A7'; // teal - excellent
  if (sri >= 60) return '#F5A623'; // orange - good
  return '#ef4444'; // red - needs attention
}

// Node info panel
function NodeInfoPanel({ 
  node, 
  onClose 
}: { 
  node: PNode; 
  onClose: () => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, x: 20, scale: 0.95 }}
      animate={{ opacity: 1, x: 0, scale: 1 }}
      exit={{ opacity: 0, x: 20, scale: 0.95 }}
      className="absolute top-4 right-4 w-80 bg-card/95 backdrop-blur-xl border border-border/50 rounded-xl shadow-2xl overflow-hidden z-[1000]"
    >
      {/* Gradient accent using Xandeum colors */}
      <div className="h-1 bg-gradient-to-r from-xandeum-orange via-xandeum-green to-xandeum-purple" />
      
      <div className="p-4">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h3 className="font-bold text-base flex items-center gap-2">
              <div 
                className="w-3 h-3 rounded-full shadow-lg"
                style={{ 
                  backgroundColor: getStatusColor(node.status),
                  boxShadow: `0 0 10px ${getStatusColor(node.status)}`
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
                  ? 'bg-xandeum-green/10 text-xandeum-green border-xandeum-green/30'
                  : node.status === 'degraded'
                  ? 'bg-xandeum-orange/10 text-xandeum-orange border-xandeum-orange/30'
                  : 'bg-red-500/10 text-red-500 border-red-500/30'
              }`}
            >
              <span className="relative flex h-2 w-2 mr-1">
                {node.status === 'online' && (
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-xandeum-green opacity-75"></span>
                )}
                <span className={`relative inline-flex rounded-full h-2 w-2`} 
                  style={{ backgroundColor: getStatusColor(node.status) }}
                ></span>
              </span>
              {node.status}
            </Badge>
          </div>
          <div className="p-2 rounded-lg bg-muted/50">
            <span className="text-muted-foreground block mb-1">Latency</span>
            <span className={`font-bold ${
              node.rpcLatency < 100 ? 'text-xandeum-green' :
              node.rpcLatency < 300 ? 'text-xandeum-orange' : 'text-red-500'
            }`}>{node.rpcLatency}ms</span>
          </div>
          <div className="p-2 rounded-lg bg-muted/50">
            <span className="text-muted-foreground block mb-1">Peers</span>
            <span className="font-bold">{node.peerCount}</span>
          </div>
          <div className="p-2 rounded-lg bg-muted/50">
            <span className="text-muted-foreground block mb-1">Uptime</span>
            <span className="font-bold text-xandeum-green">{node.uptimePercent.toFixed(1)}%</span>
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
                className="h-full bg-xandeum-purple rounded-full"
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
          <Button className="w-full gap-2 bg-gradient-to-r from-xandeum-green to-xandeum-purple hover:opacity-90">
            <Activity className="h-4 w-4" />
            View Full Analytics
            <ExternalLink className="h-3 w-3" />
          </Button>
        </Link>
      </div>
    </motion.div>
  );
}

export function WorldMap({ nodes, isLoading, onNodeClick }: WorldMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const leafletMapRef = useRef<L.Map | null>(null);
  const tileLayerRef = useRef<L.TileLayer | null>(null);
  const markersRef = useRef<L.MarkerClusterGroup | null>(null);
  const [selectedNode, setSelectedNode] = useState<PNode | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const [mapStyle, setMapStyle] = useState<MapStyle>('satellite');

  // Initialize map
  useEffect(() => {
    if (!mapRef.current || leafletMapRef.current) return;

    // Create map with dark theme
    const map = L.map(mapRef.current, {
      center: [20, 0],
      zoom: 2,
      minZoom: 2,
      maxZoom: 18,
      zoomControl: false,
      attributionControl: false,
    });

    leafletMapRef.current = map;

    // Initialize marker cluster group with custom styling
    markersRef.current = L.markerClusterGroup({
      showCoverageOnHover: false,
      spiderfyOnMaxZoom: true,
      disableClusteringAtZoom: 10,
      maxClusterRadius: 50,
      iconCreateFunction: (cluster) => {
        const count = cluster.getChildCount();
        let sizeClass = 'marker-cluster-small';
        let size = 40;
        
        if (count > 50) {
          sizeClass = 'marker-cluster-large';
          size = 60;
        } else if (count > 20) {
          sizeClass = 'marker-cluster-medium';
          size = 50;
        }

        return L.divIcon({
          html: `<div style="
            width: ${size}px;
            height: ${size}px;
            display: flex;
            align-items: center;
            justify-content: center;
            border-radius: 50%;
            font-weight: 600;
            font-size: ${count > 99 ? '12px' : '14px'};
            color: white;
            background: ${count > 50 ? 'linear-gradient(135deg, #9B59B6, #8E44AD)' : 
                        count > 20 ? 'linear-gradient(135deg, #F5A623, #E09612)' :
                        'linear-gradient(135deg, #00C9A7, #00B396)'};
            box-shadow: 0 4px 15px ${count > 50 ? 'rgba(155, 89, 182, 0.5)' :
                        count > 20 ? 'rgba(245, 166, 35, 0.5)' :
                        'rgba(0, 201, 167, 0.5)'};
            border: 2px solid rgba(255,255,255,0.3);
          ">${count}</div>`,
          className: sizeClass,
          iconSize: L.point(size, size),
        });
      },
    });

    leafletMapRef.current.addLayer(markersRef.current);

    return () => {
      if (leafletMapRef.current) {
        leafletMapRef.current.remove();
        leafletMapRef.current = null;
      }
    };
  }, []);

  // Handle map style changes
  useEffect(() => {
    if (!leafletMapRef.current) return;

    // Remove existing layer
    if (tileLayerRef.current) {
      tileLayerRef.current.remove();
    }

    let url = '';
    let attribution = '';
    let subdomains = 'abc';

    switch (mapStyle) {
      case 'satellite':
        // Use ESRI World Imagery with fallback
        url = 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}';
        attribution = 'Tiles &copy; Esri';
        subdomains = '';
        break;
      case 'topo':
        // OpenStreetMap as more reliable alternative
        url = 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';
        attribution = '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors';
        break;
      case 'dark':
      default:
        url = 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png';
        attribution = '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>';
        break;
    }

    const options: L.TileLayerOptions = {
      maxZoom: 19,
      attribution,
      crossOrigin: true,
    };

    if (subdomains) {
      options.subdomains = subdomains;
    }

    tileLayerRef.current = L.tileLayer(url, options).addTo(leafletMapRef.current);

    // Force map to recalculate and reload tiles
    setTimeout(() => {
      leafletMapRef.current?.invalidateSize();
    }, 100);

    // Bring markers to front
    if (markersRef.current) {
      markersRef.current.bringToFront();
    }
  }, [mapStyle]);

  // Update markers when nodes change
  useEffect(() => {
    if (!markersRef.current || !leafletMapRef.current) return;

    markersRef.current.clearLayers();

    nodes.forEach((node) => {
      if (node.geoLatitude && node.geoLongitude) {
        const color = getStatusColor(node.status);
        const size = node.status === 'online' ? 14 : 10;
        
        // Advanced pulsing marker for satellite view
        const isSatellite = mapStyle === 'satellite';
        const shadowColor = isSatellite ? 'rgba(255, 255, 255, 0.8)' : color;
        
        const icon = L.divIcon({
          className: 'map-marker-container',
          html: `
            <div style="position: relative; width: ${size}px; height: ${size}px;">
              ${node.status === 'online' ? `
                <div class="animate-ping" style="
                  position: absolute;
                  top: 0;
                  left: 0;
                  width: 100%;
                  height: 100%;
                  border-radius: 50%;
                  background-color: ${color};
                  opacity: 0.75;
                "></div>
              ` : ''}
              <div style="
                position: relative;
                width: 100%;
                height: 100%;
                background: ${color};
                border-radius: 50%;
                box-shadow: 0 0 10px ${shadowColor};
                border: 2px solid white;
                cursor: pointer;
              "></div>
            </div>
          `,
          iconSize: [size, size],
          iconAnchor: [size / 2, size / 2],
        });

        const marker = L.marker([node.geoLatitude, node.geoLongitude], { icon });
        
        marker.on('click', () => {
          setSelectedNode(node);
          if (onNodeClick) onNodeClick(node);
        });

        markersRef.current?.addLayer(marker);
      }
    });
  }, [nodes, onNodeClick, mapStyle]);

  // Handle fullscreen - ensure map recalculates dimensions
  useEffect(() => {
    if (leafletMapRef.current) {
      // Multiple invalidateSize calls to ensure proper rendering
      const timeouts = [50, 150, 300].map(delay =>
        setTimeout(() => {
          leafletMapRef.current?.invalidateSize();
        }, delay)
      );

      return () => timeouts.forEach(t => clearTimeout(t));
    }
  }, [isFullscreen]);

  // Map controls
  const handleZoomIn = useCallback(() => {
    leafletMapRef.current?.zoomIn();
  }, []);

  const handleZoomOut = useCallback(() => {
    leafletMapRef.current?.zoomOut();
  }, []);

  const handleReset = useCallback(() => {
    leafletMapRef.current?.setView([20, 0], 2);
  }, []);

  const toggleFullscreen = useCallback(() => {
    setIsFullscreen(!isFullscreen);
  }, [isFullscreen]);

  // Count stats
  const onlineCount = nodes.filter(n => n.status === 'online').length;
  const uniqueCountries = new Set(nodes.map(n => n.geoCountry).filter(Boolean)).size;

  const cardContent = (
    <>
      <CardHeader className="pb-2 relative z-10">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <Globe2 className="h-4 w-4 text-xandeum-green" />
            Global Network Distribution
            <Badge variant="secondary" className="ml-2 text-xs bg-xandeum-green/10 text-xandeum-green border-xandeum-green/30">
              {onlineCount} online • {uniqueCountries} countries
            </Badge>
          </CardTitle>
          
          {/* Controls */}
          <div className="flex items-center gap-1">
            {/* Style Toggle */}
            <div className="flex items-center bg-background/50 backdrop-blur rounded-lg border border-border/50 p-0.5 mr-2">
              <Button
                variant={mapStyle === 'satellite' ? 'secondary' : 'ghost'}
                size="icon"
                className="h-7 w-7"
                onClick={() => setMapStyle('satellite')}
                title="Satellite View"
              >
                <Layers className="h-3.5 w-3.5" />
              </Button>
              <Button
                variant={mapStyle === 'topo' ? 'secondary' : 'ghost'}
                size="icon"
                className="h-7 w-7"
                onClick={() => setMapStyle('topo')}
                title="Topographical View"
              >
                <Mountain className="h-3.5 w-3.5" />
              </Button>
              <Button
                variant={mapStyle === 'dark' ? 'secondary' : 'ghost'}
                size="icon"
                className="h-7 w-7"
                onClick={() => setMapStyle('dark')}
                title="Dark Mode"
              >
                <Moon className="h-3.5 w-3.5" />
              </Button>
            </div>

            <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-xandeum-green/10 hover:text-xandeum-green" onClick={handleZoomIn}>
              <ZoomIn className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-xandeum-green/10 hover:text-xandeum-green" onClick={handleZoomOut}>
              <ZoomOut className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-xandeum-green/10 hover:text-xandeum-green" onClick={handleReset}>
              <RotateCcw className="h-4 w-4" />
            </Button>
            <div className="w-px h-6 bg-border mx-1" />
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-8 w-8 hover:bg-xandeum-purple/10 hover:text-xandeum-purple" 
              onClick={toggleFullscreen}
            >
              {isFullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-0 relative">
        <div 
          ref={mapRef} 
          className={`w-full rounded-b-lg ${isFullscreen ? 'h-[calc(100vh-60px)]' : 'h-[500px]'}`}
        />
        
        {/* Legend */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="absolute bottom-4 left-4 bg-card/90 backdrop-blur-xl p-3 rounded-xl text-xs z-[500] border border-border/50"
        >
          <div className="font-semibold mb-2 text-foreground">Node Status</div>
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full" style={{ background: '#00C9A7', boxShadow: '0 0 8px rgba(0,201,167,0.6)' }} />
              <span className="text-muted-foreground">Online</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full" style={{ background: '#F5A623', boxShadow: '0 0 8px rgba(245,166,35,0.6)' }} />
              <span className="text-muted-foreground">Degraded</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-red-500" />
              <span className="text-muted-foreground">Offline</span>
            </div>
          </div>
        </motion.div>

        {/* Selected node panel */}
        <AnimatePresence>
          {selectedNode && (
            <NodeInfoPanel
              node={selectedNode}
              onClose={() => setSelectedNode(null)}
            />
          )}
        </AnimatePresence>

        {/* Loading state */}
        {isLoading && (
          <div className="absolute inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center z-[600]">
            <div className="flex flex-col items-center gap-3">
              <div className="w-10 h-10 rounded-full border-2 border-xandeum-green/30 border-t-xandeum-green animate-spin" />
              <span className="text-sm text-muted-foreground">Loading nodes...</span>
            </div>
          </div>
        )}
      </CardContent>
    </>
  );

  return (
    <Card
      ref={containerRef}
      className={`bg-card/50 backdrop-blur border-border/50 overflow-hidden transition-all duration-200 ${
        isFullscreen ? 'fixed inset-0 z-[9999] rounded-none border-0 bg-background' : ''
      }`}
    >
      {cardContent}
    </Card>
  );
}