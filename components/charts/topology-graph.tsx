'use client';

import { useEffect, useRef, useState, useMemo, useCallback } from 'react';
import * as d3 from 'd3';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Network, ZoomIn, ZoomOut, Maximize2, Info } from 'lucide-react';
import type { PNode } from '@/lib/types';
import { truncatePubkey } from '@/lib/prpc-client';

interface TopologyGraphProps {
  nodes: PNode[];
  isLoading?: boolean;
  onNodeClick?: (node: PNode) => void;
}

interface GraphNode extends d3.SimulationNodeDatum {
  id: string;
  node: PNode;
  radius: number;
  color: string;
}

interface GraphLink extends d3.SimulationLinkDatum<GraphNode> {
  source: GraphNode;
  target: GraphNode;
  strength: number;
}

// Color based on SRI score
function getSRIColor(sri: number): string {
  if (sri >= 80) return '#22c55e'; // green
  if (sri >= 60) return '#eab308'; // yellow
  return '#ef4444'; // red
}

// Color based on status
function getStatusColor(status: string): string {
  switch (status) {
    case 'online': return '#22c55e';
    case 'offline': return '#ef4444';
    case 'degraded': return '#eab308';
    default: return '#6b7280';
  }
}

// Get node radius based on peer count or storage
function getNodeRadius(node: PNode): number {
  const peers = node.peerCount || 10;
  return Math.max(8, Math.min(20, 6 + peers * 0.5));
}

export function TopologyGraph({ nodes, isLoading, onNodeClick }: TopologyGraphProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState({ width: 800, height: 500 });
  const [colorBy, setColorBy] = useState<'sri' | 'status' | 'version'>('sri');
  const [hoveredNode, setHoveredNode] = useState<GraphNode | null>(null);
  const [selectedNode, setSelectedNode] = useState<GraphNode | null>(null);
  const simulationRef = useRef<d3.Simulation<GraphNode, GraphLink> | null>(null);
  const zoomRef = useRef<d3.ZoomBehavior<SVGSVGElement, unknown> | null>(null);

  // Generate simulated peer connections (since we don't have real peer data yet)
  const graphData = useMemo(() => {
    if (!nodes.length) return { nodes: [], links: [] };

    // Create graph nodes
    const graphNodes: GraphNode[] = nodes.map((node) => ({
      id: node.pubkey,
      node,
      radius: getNodeRadius(node),
      color: colorBy === 'sri' 
        ? getSRIColor(node.sri)
        : colorBy === 'status'
        ? getStatusColor(node.status)
        : node.isLatestVersion ? '#22c55e' : '#eab308',
    }));

    // Generate simulated links based on geographic proximity and random connections
    const links: GraphLink[] = [];
    const nodeMap = new Map(graphNodes.map((n) => [n.id, n]));

    // Connect nodes that are in the same country/region
    const countryGroups = new Map<string, GraphNode[]>();
    graphNodes.forEach((n) => {
      const country = n.node.geoCountry || 'Unknown';
      if (!countryGroups.has(country)) {
        countryGroups.set(country, []);
      }
      countryGroups.get(country)!.push(n);
    });

    // Create connections within country groups
    countryGroups.forEach((groupNodes) => {
      for (let i = 0; i < groupNodes.length; i++) {
        // Connect to 2-4 random peers in the same region
        const numConnections = Math.min(groupNodes.length - 1, Math.floor(Math.random() * 3) + 2);
        const shuffled = [...groupNodes].sort(() => Math.random() - 0.5);
        
        for (let j = 0; j < numConnections; j++) {
          if (shuffled[j].id !== groupNodes[i].id) {
            // Avoid duplicate links
            const existingLink = links.find(
              (l) =>
                (l.source.id === groupNodes[i].id && l.target.id === shuffled[j].id) ||
                (l.source.id === shuffled[j].id && l.target.id === groupNodes[i].id)
            );
            if (!existingLink) {
              links.push({
                source: groupNodes[i],
                target: shuffled[j],
                strength: 0.5 + Math.random() * 0.5,
              });
            }
          }
        }
      }
    });

    // Add some cross-region connections (simulating global gossip)
    const allNodes = [...graphNodes];
    for (let i = 0; i < Math.min(20, nodes.length / 2); i++) {
      const sourceIdx = Math.floor(Math.random() * allNodes.length);
      const targetIdx = Math.floor(Math.random() * allNodes.length);
      if (sourceIdx !== targetIdx) {
        const existingLink = links.find(
          (l) =>
            (l.source.id === allNodes[sourceIdx].id && l.target.id === allNodes[targetIdx].id) ||
            (l.source.id === allNodes[targetIdx].id && l.target.id === allNodes[sourceIdx].id)
        );
        if (!existingLink) {
          links.push({
            source: allNodes[sourceIdx],
            target: allNodes[targetIdx],
            strength: 0.2 + Math.random() * 0.3,
          });
        }
      }
    }

    return { nodes: graphNodes, links };
  }, [nodes, colorBy]);

  // Update dimensions on resize
  useEffect(() => {
    const updateDimensions = () => {
      if (containerRef.current) {
        const { width } = containerRef.current.getBoundingClientRect();
        setDimensions({ width, height: 500 });
      }
    };

    updateDimensions();
    window.addEventListener('resize', updateDimensions);
    return () => window.removeEventListener('resize', updateDimensions);
  }, []);

  // Initialize and update D3 visualization
  useEffect(() => {
    if (!svgRef.current || !graphData.nodes.length) return;

    const svg = d3.select(svgRef.current);
    const { width, height } = dimensions;

    // Clear previous content
    svg.selectAll('*').remove();

    // Create container group for zoom
    const g = svg.append('g');

    // Setup zoom behavior
    const zoom = d3.zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.2, 4])
      .on('zoom', (event) => {
        g.attr('transform', event.transform);
      });

    svg.call(zoom);
    zoomRef.current = zoom;

    // Create links
    const link = g.append('g')
      .attr('class', 'links')
      .selectAll('line')
      .data(graphData.links)
      .join('line')
      .attr('stroke', '#4b5563')
      .attr('stroke-opacity', 0.3)
      .attr('stroke-width', (d) => d.strength * 2);

    // Create nodes
    const node = g.append('g')
      .attr('class', 'nodes')
      .selectAll('circle')
      .data(graphData.nodes)
      .join('circle')
      .attr('r', (d) => d.radius)
      .attr('fill', (d) => d.color)
      .attr('stroke', '#1f2937')
      .attr('stroke-width', 2)
      .style('cursor', 'pointer')
      .on('mouseover', function(event, d) {
        setHoveredNode(d);
        d3.select(this)
          .attr('stroke', '#fff')
          .attr('stroke-width', 3);
        
        // Highlight connected links
        link.attr('stroke-opacity', (l) => 
          l.source.id === d.id || l.target.id === d.id ? 0.8 : 0.1
        );
      })
      .on('mouseout', function(event, d) {
        setHoveredNode(null);
        d3.select(this)
          .attr('stroke', '#1f2937')
          .attr('stroke-width', 2);
        
        link.attr('stroke-opacity', 0.3);
      })
      .on('click', (event, d) => {
        setSelectedNode(d);
        onNodeClick?.(d.node);
      });

    // Add drag behavior
    const drag = d3.drag<SVGCircleElement, GraphNode>()
      .on('start', (event, d) => {
        if (!event.active) simulationRef.current?.alphaTarget(0.3).restart();
        d.fx = d.x;
        d.fy = d.y;
      })
      .on('drag', (event, d) => {
        d.fx = event.x;
        d.fy = event.y;
      })
      .on('end', (event, d) => {
        if (!event.active) simulationRef.current?.alphaTarget(0);
        d.fx = null;
        d.fy = null;
      });

    node.call(drag);

    // Create labels
    const labels = g.append('g')
      .attr('class', 'labels')
      .selectAll('text')
      .data(graphData.nodes)
      .join('text')
      .text((d) => d.node.displayName || truncatePubkey(d.id, 3))
      .attr('font-size', '10px')
      .attr('fill', '#9ca3af')
      .attr('text-anchor', 'middle')
      .attr('dy', (d) => d.radius + 12)
      .style('pointer-events', 'none');

    // Create force simulation
    const simulation = d3.forceSimulation<GraphNode>(graphData.nodes)
      .force('link', d3.forceLink<GraphNode, GraphLink>(graphData.links)
        .id((d) => d.id)
        .distance(80)
        .strength((d) => d.strength * 0.5))
      .force('charge', d3.forceManyBody().strength(-150))
      .force('center', d3.forceCenter(width / 2, height / 2))
      .force('collision', d3.forceCollide<GraphNode>().radius((d) => d.radius + 5))
      .on('tick', () => {
        link
          .attr('x1', (d) => d.source.x!)
          .attr('y1', (d) => d.source.y!)
          .attr('x2', (d) => d.target.x!)
          .attr('y2', (d) => d.target.y!);

        node
          .attr('cx', (d) => d.x!)
          .attr('cy', (d) => d.y!);

        labels
          .attr('x', (d) => d.x!)
          .attr('y', (d) => d.y!);
      });

    simulationRef.current = simulation;

    // Initial zoom to fit
    setTimeout(() => {
      svg.transition().duration(500).call(
        zoom.transform,
        d3.zoomIdentity.translate(0, 0).scale(0.9)
      );
    }, 500);

    return () => {
      simulation.stop();
    };
  }, [graphData, dimensions, onNodeClick]);

  // Zoom controls
  const handleZoomIn = useCallback(() => {
    if (svgRef.current && zoomRef.current) {
      d3.select(svgRef.current).transition().call(
        zoomRef.current.scaleBy, 1.3
      );
    }
  }, []);

  const handleZoomOut = useCallback(() => {
    if (svgRef.current && zoomRef.current) {
      d3.select(svgRef.current).transition().call(
        zoomRef.current.scaleBy, 0.7
      );
    }
  }, []);

  const handleResetZoom = useCallback(() => {
    if (svgRef.current && zoomRef.current) {
      d3.select(svgRef.current).transition().call(
        zoomRef.current.transform,
        d3.zoomIdentity.translate(0, 0).scale(0.9)
      );
    }
  }, []);

  if (isLoading) {
    return (
      <Card className="bg-card/50 backdrop-blur">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <Network className="h-4 w-4" />
            Network Topology
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Skeleton className="h-[500px] w-full rounded-lg" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-card/50 backdrop-blur overflow-hidden">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <Network className="h-4 w-4" />
            Network Topology
            <Badge variant="secondary" className="ml-2">
              {nodes.length} nodes · {graphData.links.length} connections
            </Badge>
          </CardTitle>
          
          <div className="flex items-center gap-2">
            {/* Color by selector */}
            <Select value={colorBy} onValueChange={(v) => setColorBy(v as typeof colorBy)}>
              <SelectTrigger className="w-[130px] h-8">
                <SelectValue placeholder="Color by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="sri">Color by SRI</SelectItem>
                <SelectItem value="status">Color by Status</SelectItem>
                <SelectItem value="version">Color by Version</SelectItem>
              </SelectContent>
            </Select>

            {/* Zoom controls */}
            <div className="flex items-center gap-1">
              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={handleZoomOut}>
                <ZoomOut className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={handleZoomIn}>
                <ZoomIn className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={handleResetZoom}>
                <Maximize2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <div ref={containerRef} className="relative">
          <svg
            ref={svgRef}
            width={dimensions.width}
            height={dimensions.height}
            className="bg-background/50"
          />
          
          {/* Legend */}
          <div className="absolute bottom-4 left-4 bg-background/90 backdrop-blur p-3 rounded-lg text-xs z-10">
            <div className="font-medium mb-2">
              {colorBy === 'sri' && 'SRI Score'}
              {colorBy === 'status' && 'Node Status'}
              {colorBy === 'version' && 'Version'}
            </div>
            {colorBy === 'sri' && (
              <>
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
              </>
            )}
            {colorBy === 'status' && (
              <>
                <div className="flex items-center gap-2 mb-1">
                  <div className="w-3 h-3 rounded-full bg-green-500" />
                  <span>Online</span>
                </div>
                <div className="flex items-center gap-2 mb-1">
                  <div className="w-3 h-3 rounded-full bg-yellow-500" />
                  <span>Degraded</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-red-500" />
                  <span>Offline</span>
                </div>
              </>
            )}
            {colorBy === 'version' && (
              <>
                <div className="flex items-center gap-2 mb-1">
                  <div className="w-3 h-3 rounded-full bg-green-500" />
                  <span>Latest Version</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-yellow-500" />
                  <span>Outdated</span>
                </div>
              </>
            )}
          </div>

          {/* Hover info */}
          {hoveredNode && (
            <div className="absolute top-4 right-4 bg-background/90 backdrop-blur p-3 rounded-lg text-xs z-10 min-w-[180px]">
              <div className="font-medium mb-2 flex items-center gap-1">
                <Info className="h-3 w-3" />
                Node Details
              </div>
              <div className="space-y-1">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">ID:</span>
                  <span className="font-mono">{truncatePubkey(hoveredNode.id, 4)}</span>
                </div>
                {hoveredNode.node.geoCity && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Location:</span>
                    <span>{hoveredNode.node.geoCity}, {hoveredNode.node.geoCountry}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-muted-foreground">SRI:</span>
                  <span style={{ color: getSRIColor(hoveredNode.node.sri) }}>
                    {hoveredNode.node.sri}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Status:</span>
                  <span style={{ color: getStatusColor(hoveredNode.node.status) }}>
                    {hoveredNode.node.status}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Peers:</span>
                  <span>{hoveredNode.node.peerCount}</span>
                </div>
              </div>
            </div>
          )}

          {/* Instructions */}
          <div className="absolute bottom-4 right-4 bg-background/90 backdrop-blur p-2 rounded-lg text-[10px] text-muted-foreground z-10">
            Drag nodes • Scroll to zoom • Click for details
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

