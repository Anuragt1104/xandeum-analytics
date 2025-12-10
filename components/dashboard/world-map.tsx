'use client';

import { useEffect, useRef, useMemo, useState } from 'react';
import dynamic from 'next/dynamic';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Globe, MapPin, Layers } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { PNode } from '@/lib/types';
import { truncatePubkey } from '@/lib/prpc-client';

// Dynamically import Leaflet components to avoid SSR issues
const MapContainer = dynamic(
  () => import('react-leaflet').then((mod) => mod.MapContainer),
  { ssr: false }
);
const TileLayer = dynamic(
  () => import('react-leaflet').then((mod) => mod.TileLayer),
  { ssr: false }
);
const Marker = dynamic(
  () => import('react-leaflet').then((mod) => mod.Marker),
  { ssr: false }
);
const Popup = dynamic(
  () => import('react-leaflet').then((mod) => mod.Popup),
  { ssr: false }
);
const CircleMarker = dynamic(
  () => import('react-leaflet').then((mod) => mod.CircleMarker),
  { ssr: false }
);

interface WorldMapProps {
  nodes: PNode[];
  isLoading?: boolean;
  onNodeClick?: (node: PNode) => void;
}

// Map themes
const MAP_TILES = {
  dark: {
    url: 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
  },
  light: {
    url: 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png',
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
  },
  satellite: {
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
    attribution: 'Tiles &copy; Esri',
  },
};

// Color based on SRI score
function getSRIColor(sri: number): string {
  if (sri >= 80) return '#22c55e'; // green
  if (sri >= 60) return '#eab308'; // yellow
  return '#ef4444'; // red
}

// Get marker radius based on storage capacity
function getMarkerRadius(storageCapacity: number): number {
  const gb = storageCapacity / (1024 * 1024 * 1024);
  if (gb >= 5000) return 12; // 5TB+
  if (gb >= 1000) return 10; // 1TB+
  if (gb >= 500) return 8;  // 500GB+
  return 6;
}

export function WorldMap({ nodes, isLoading, onNodeClick }: WorldMapProps) {
  const [mapTheme, setMapTheme] = useState<'dark' | 'light' | 'satellite'>('dark');
  const [isMounted, setIsMounted] = useState(false);

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
    // Calculate averages
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

  if (isLoading || !isMounted) {
    return (
      <Card className="bg-card/50 backdrop-blur">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <Globe className="h-4 w-4" />
            Network Distribution
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Skeleton className="h-[400px] w-full rounded-lg" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-card/50 backdrop-blur overflow-hidden">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <Globe className="h-4 w-4" />
            Network Distribution
            <Badge variant="secondary" className="ml-2">
              {nodesWithCoords.length} nodes mapped
            </Badge>
          </CardTitle>
          
          {/* Theme Toggle */}
          <div className="flex items-center gap-1">
            <Button
              variant={mapTheme === 'dark' ? 'secondary' : 'ghost'}
              size="sm"
              className="h-7 px-2"
              onClick={() => setMapTheme('dark')}
            >
              Dark
            </Button>
            <Button
              variant={mapTheme === 'light' ? 'secondary' : 'ghost'}
              size="sm"
              className="h-7 px-2"
              onClick={() => setMapTheme('light')}
            >
              Light
            </Button>
            <Button
              variant={mapTheme === 'satellite' ? 'secondary' : 'ghost'}
              size="sm"
              className="h-7 px-2"
              onClick={() => setMapTheme('satellite')}
            >
              <Layers className="h-3 w-3" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <div className="relative">
          {/* Map Container */}
          <div className="h-[400px] w-full">
            <MapContainer
              center={[20, 0]}
              zoom={2}
              minZoom={2}
              maxZoom={10}
              style={{ height: '100%', width: '100%' }}
              className="rounded-b-lg"
              scrollWheelZoom={true}
            >
              <TileLayer
                url={MAP_TILES[mapTheme].url}
                attribution={MAP_TILES[mapTheme].attribution}
              />
              
              {nodesWithCoords.map((node) => (
                <CircleMarker
                  key={node.pubkey}
                  center={[node.geoLatitude!, node.geoLongitude!]}
                  radius={getMarkerRadius(node.storageCapacity)}
                  pathOptions={{
                    color: getSRIColor(node.sri),
                    fillColor: getSRIColor(node.sri),
                    fillOpacity: 0.7,
                    weight: 2,
                  }}
                  eventHandlers={{
                    click: () => onNodeClick?.(node),
                  }}
                >
                  <Popup>
                    <div className="p-2 min-w-[200px]">
                      <div className="font-semibold text-sm mb-2">
                        {node.displayName || truncatePubkey(node.pubkey, 6)}
                      </div>
                      <div className="space-y-1 text-xs">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Location:</span>
                          <span>{node.geoCity}, {node.geoCountry}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">SRI Score:</span>
                          <span
                            className="font-medium"
                            style={{ color: getSRIColor(node.sri) }}
                          >
                            {node.sri}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Status:</span>
                          <Badge
                            variant="outline"
                            className={`text-xs ${
                              node.status === 'online'
                                ? 'bg-green-500/10 text-green-500'
                                : 'bg-red-500/10 text-red-500'
                            }`}
                          >
                            {node.status}
                          </Badge>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Version:</span>
                          <span>{node.version.split('-').pop()}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Latency:</span>
                          <span>{node.rpcLatency}ms</span>
                        </div>
                      </div>
                      {onNodeClick && (
                        <Button
                          size="sm"
                          className="w-full mt-3"
                          onClick={() => onNodeClick(node)}
                        >
                          View Details
                        </Button>
                      )}
                    </div>
                  </Popup>
                </CircleMarker>
              ))}
            </MapContainer>
          </div>
          
          {/* Legend Overlay */}
          <div className="absolute bottom-4 left-4 bg-background/90 backdrop-blur p-3 rounded-lg text-xs z-[1000]">
            <div className="font-medium mb-2">SRI Score</div>
            <div className="flex items-center gap-2 mb-1">
              <div className="w-3 h-3 rounded-full bg-green-500" />
              <span>High (80+)</span>
            </div>
            <div className="flex items-center gap-2 mb-1">
              <div className="w-3 h-3 rounded-full bg-yellow-500" />
              <span>Medium (60-79)</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-red-500" />
              <span>Low (&lt;60)</span>
            </div>
          </div>
          
          {/* Stats Overlay */}
          <div className="absolute top-4 right-4 bg-background/90 backdrop-blur p-3 rounded-lg text-xs z-[1000]">
            <div className="font-medium mb-2 flex items-center gap-1">
              <MapPin className="h-3 w-3" />
              Top Regions
            </div>
            {topCountries.map(([country, stats]) => (
              <div key={country} className="flex justify-between gap-4 mb-1">
                <span className="text-muted-foreground">{country}</span>
                <span className="font-medium">{stats.count} nodes</span>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// Leaflet CSS import component
export function LeafletCSS() {
  return (
    <link
      rel="stylesheet"
      href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"
      integrity="sha256-p4NxAoJBhIIN+hmNHrzRCf9tD/miZyoHS5obTRR9BMY="
      crossOrigin=""
    />
  );
}

