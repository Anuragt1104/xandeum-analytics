'use client';

import { useEffect, useRef, useState, useMemo, useCallback } from 'react';
import * as d3 from 'd3';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Network, ZoomIn, ZoomOut, Maximize2, Info, X, Play, Pause } from 'lucide-react';
import type { PNode } from '@/lib/types';
import { truncatePubkey, formatBytes } from '@/lib/prpc-client';

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

// Color based on SRI score with glow
function getSRIColor(sri: number): string {
  if (sri >= 80) return '#22c55e';
  if (sri >= 60) return '#eab308';
  return '#ef4444';
}

function getStatusColor(status: string): string {
  switch (status) {
    case 'online': return '#22c55e';
    case 'offline': return '#ef4444';
    case 'degraded': return '#eab308';
    default: return '#6b7280';
  }
}

function getNodeRadius(node: PNode): number {
  const peers = node.peerCount || 10;
  return Math.max(10, Math.min(25, 8 + peers * 0.6));
}

// Node detail panel
function NodeDetailPanel({ node, onClose, onViewDetails }: {
  node: GraphNode;
  onClose: () => void;
  onViewDetails: () => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9, y: 20 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.9, y: 10 }}
      className="absolute top-4 left-4 w-72 bg-card/95 backdrop-blur-xl border border-border/50 rounded-xl shadow-2xl z-20 overflow-hidden"
    >
      <div className="p-4">
        <div className="flex items-start justify-between mb-3">
          <div>
            <h3 className="font-semibold text-sm">
              {node.node.displayName || truncatePubkey(node.id, 6)}
            </h3>
            {node.node.geoCity && (
              <p className="text-xs text-muted-foreground">
                {node.node.geoCity}, {node.node.geoCountry}
              </p>
            )}
          </div>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-muted transition-colors">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="grid grid-cols-2 gap-3 text-xs mb-4">
          <div className="space-y-0.5">
            <span className="text-muted-foreground">SRI Score</span>
            <div className="flex items-center gap-1.5">
              <div 
                className="w-2.5 h-2.5 rounded-full shadow-lg" 
                style={{ 
                  backgroundColor: getSRIColor(node.node.sri),
                  boxShadow: `0 0 8px ${getSRIColor(node.node.sri)}` 
                }}
              />
              <span className="font-bold">{node.node.sri}</span>
            </div>
          </div>
          <div className="space-y-0.5">
            <span className="text-muted-foreground">Status</span>
            <Badge
              variant="outline"
              className={`text-[10px] ${
                node.node.status === 'online'
                  ? 'bg-green-500/10 text-green-500 border-green-500/30'
                  : 'bg-red-500/10 text-red-500 border-red-500/30'
              }`}
            >
              {node.node.status}
            </Badge>
          </div>
          <div className="space-y-0.5">
            <span className="text-muted-foreground">Peers</span>
            <span className="font-medium">{node.node.peerCount}</span>
          </div>
          <div className="space-y-0.5">
            <span className="text-muted-foreground">Latency</span>
            <span className="font-medium">{node.node.rpcLatency}ms</span>
          </div>
          <div className="space-y-0.5">
            <span className="text-muted-foreground">Version</span>
            <span className="font-medium text-[10px]">{node.node.version.split('-').pop()}</span>
          </div>
          <div className="space-y-0.5">
            <span className="text-muted-foreground">Uptime</span>
            <span className="font-medium">{node.node.uptimePercent.toFixed(1)}%</span>
          </div>
        </div>

        <Button onClick={onViewDetails} size="sm" className="w-full">
          View Full Details
        </Button>
      </div>
    </motion.div>
  );
}

export function TopologyGraph({ nodes, isLoading, onNodeClick }: TopologyGraphProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState({ width: 800, height: 500 });
  const [colorBy, setColorBy] = useState<'sri' | 'status' | 'version'>('sri');
  const [hoveredNode, setHoveredNode] = useState<GraphNode | null>(null);
  const [selectedNode, setSelectedNode] = useState<GraphNode | null>(null);
  const [isSimulationRunning, setIsSimulationRunning] = useState(true);
  const simulationRef = useRef<d3.Simulation<GraphNode, GraphLink> | null>(null);
  const zoomRef = useRef<d3.ZoomBehavior<SVGSVGElement, unknown> | null>(null);

  // Generate graph data
  const graphData = useMemo(() => {
    if (!nodes.length) return { nodes: [], links: [] };

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

    const links: GraphLink[] = [];
    const nodeMap = new Map(graphNodes.map((n) => [n.id, n]));

    // Connect nodes by country
    const countryGroups = new Map<string, GraphNode[]>();
    graphNodes.forEach((n) => {
      const country = n.node.geoCountry || 'Unknown';
      if (!countryGroups.has(country)) countryGroups.set(country, []);
      countryGroups.get(country)!.push(n);
    });

    countryGroups.forEach((groupNodes) => {
      for (let i = 0; i < groupNodes.length; i++) {
        const numConnections = Math.min(groupNodes.length - 1, Math.floor(Math.random() * 3) + 2);
        const shuffled = [...groupNodes].sort(() => Math.random() - 0.5);
        
        for (let j = 0; j < numConnections; j++) {
          if (shuffled[j].id !== groupNodes[i].id) {
            const exists = links.find(
              (l) =>
                (l.source.id === groupNodes[i].id && l.target.id === shuffled[j].id) ||
                (l.source.id === shuffled[j].id && l.target.id === groupNodes[i].id)
            );
            if (!exists) {
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

    // Cross-region connections
    const allNodes = [...graphNodes];
    for (let i = 0; i < Math.min(25, nodes.length / 2); i++) {
      const sourceIdx = Math.floor(Math.random() * allNodes.length);
      const targetIdx = Math.floor(Math.random() * allNodes.length);
      if (sourceIdx !== targetIdx) {
        const exists = links.find(
          (l) =>
            (l.source.id === allNodes[sourceIdx].id && l.target.id === allNodes[targetIdx].id) ||
            (l.source.id === allNodes[targetIdx].id && l.target.id === allNodes[sourceIdx].id)
        );
        if (!exists) {
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

  // Update dimensions
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

  // D3 visualization
  useEffect(() => {
    if (!svgRef.current || !graphData.nodes.length) return;

    const svg = d3.select(svgRef.current);
    const { width, height } = dimensions;

    svg.selectAll('*').remove();

    // Defs for gradients and filters
    const defs = svg.append('defs');

    // Glow filter
    const filter = defs.append('filter')
      .attr('id', 'glow')
      .attr('x', '-50%')
      .attr('y', '-50%')
      .attr('width', '200%')
      .attr('height', '200%');
    filter.append('feGaussianBlur')
      .attr('stdDeviation', '3')
      .attr('result', 'coloredBlur');
    const feMerge = filter.append('feMerge');
    feMerge.append('feMergeNode').attr('in', 'coloredBlur');
    feMerge.append('feMergeNode').attr('in', 'SourceGraphic');

    // Create container
    const g = svg.append('g');

    // Zoom behavior
    const zoom = d3.zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.2, 4])
      .on('zoom', (event) => g.attr('transform', event.transform));
    
    svg.call(zoom);
    zoomRef.current = zoom;

    // Create links
    const link = g.append('g')
      .attr('class', 'links')
      .selectAll('line')
      .data(graphData.links)
      .join('line')
      .attr('stroke', 'url(#linkGradient)')
      .attr('stroke-opacity', 0.2)
      .attr('stroke-width', (d) => d.strength * 1.5);

    // Link gradient
    defs.append('linearGradient')
      .attr('id', 'linkGradient')
      .attr('gradientUnits', 'userSpaceOnUse')
      .selectAll('stop')
      .data([
        { offset: '0%', color: 'var(--primary)' },
        { offset: '100%', color: 'var(--primary)' },
      ])
      .join('stop')
      .attr('offset', (d) => d.offset)
      .attr('stop-color', (d) => d.color);

    // Create nodes
    const node = g.append('g')
      .attr('class', 'nodes')
      .selectAll('g')
      .data(graphData.nodes)
      .join('g')
      .style('cursor', 'pointer');

    // Outer glow ring
    node.append('circle')
      .attr('r', (d) => d.radius + 4)
      .attr('fill', 'none')
      .attr('stroke', (d) => d.color)
      .attr('stroke-width', 2)
      .attr('stroke-opacity', 0.3)
      .attr('filter', 'url(#glow)');

    // Main node circle
    node.append('circle')
      .attr('r', (d) => d.radius)
      .attr('fill', (d) => d.color)
      .attr('stroke', '#1f2937')
      .attr('stroke-width', 2)
      .attr('filter', 'url(#glow)');

    // Node events
    node
      .on('mouseover', function(event, d) {
        setHoveredNode(d);
        d3.select(this).select('circle:last-child')
          .transition()
          .duration(200)
          .attr('stroke', '#fff')
          .attr('stroke-width', 3)
          .attr('r', d.radius * 1.2);
        
        link.attr('stroke-opacity', (l) => 
          l.source.id === d.id || l.target.id === d.id ? 0.6 : 0.05
        );
      })
      .on('mouseout', function(event, d) {
        setHoveredNode(null);
        d3.select(this).select('circle:last-child')
          .transition()
          .duration(200)
          .attr('stroke', '#1f2937')
          .attr('stroke-width', 2)
          .attr('r', d.radius);
        
        link.attr('stroke-opacity', 0.2);
      })
      .on('click', (event, d) => {
        event.stopPropagation();
        setSelectedNode(d);
      });

    // Labels
    const labels = g.append('g')
      .attr('class', 'labels')
      .selectAll('text')
      .data(graphData.nodes)
      .join('text')
      .text((d) => d.node.displayName || truncatePubkey(d.id, 3))
      .attr('font-size', '9px')
      .attr('font-family', 'var(--font-jetbrains), monospace')
      .attr('fill', '#9ca3af')
      .attr('text-anchor', 'middle')
      .attr('dy', (d) => d.radius + 14)
      .style('pointer-events', 'none')
      .style('opacity', 0.7);

    // Drag behavior
    const drag = d3.drag<SVGGElement, GraphNode>()
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

    node.call(drag as any);

    // Force simulation
    const simulation = d3.forceSimulation<GraphNode>(graphData.nodes)
      .force('link', d3.forceLink<GraphNode, GraphLink>(graphData.links)
        .id((d) => d.id)
        .distance(100)
        .strength((d) => d.strength * 0.4))
      .force('charge', d3.forceManyBody().strength(-200))
      .force('center', d3.forceCenter(width / 2, height / 2))
      .force('collision', d3.forceCollide<GraphNode>().radius((d) => d.radius + 8))
      .on('tick', () => {
        link
          .attr('x1', (d) => d.source.x!)
          .attr('y1', (d) => d.source.y!)
          .attr('x2', (d) => d.target.x!)
          .attr('y2', (d) => d.target.y!);

        node.attr('transform', (d) => `translate(${d.x},${d.y})`);
        labels.attr('x', (d) => d.x!).attr('y', (d) => d.y!);
      });

    simulationRef.current = simulation;

    // Initial zoom
    setTimeout(() => {
      svg.transition().duration(800).call(
        zoom.transform,
        d3.zoomIdentity.translate(0, 0).scale(0.85)
      );
    }, 300);

    return () => { simulation.stop(); };
  }, [graphData, dimensions]);

  // Zoom controls
  const handleZoomIn = useCallback(() => {
    if (svgRef.current && zoomRef.current) {
      d3.select(svgRef.current).transition().duration(300).call(zoomRef.current.scaleBy, 1.4);
    }
  }, []);

  const handleZoomOut = useCallback(() => {
    if (svgRef.current && zoomRef.current) {
      d3.select(svgRef.current).transition().duration(300).call(zoomRef.current.scaleBy, 0.7);
    }
  }, []);

  const handleResetZoom = useCallback(() => {
    if (svgRef.current && zoomRef.current) {
      d3.select(svgRef.current).transition().duration(500).call(
        zoomRef.current.transform,
        d3.zoomIdentity.translate(0, 0).scale(0.85)
      );
    }
  }, []);

  const toggleSimulation = useCallback(() => {
    if (simulationRef.current) {
      if (isSimulationRunning) {
        simulationRef.current.stop();
      } else {
        simulationRef.current.alpha(0.3).restart();
      }
      setIsSimulationRunning(!isSimulationRunning);
    }
  }, [isSimulationRunning]);

  if (isLoading) {
    return (
      <Card className="bg-card/50 backdrop-blur border-border/50">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <Network className="h-4 w-4 text-primary" />
            Network Topology
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[500px] flex items-center justify-center">
            <div className="flex flex-col items-center gap-3">
              <div className="w-10 h-10 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
              <span className="text-sm text-muted-foreground">Building topology...</span>
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
            <Network className="h-4 w-4 text-primary" />
            Network Topology
            <Badge variant="secondary" className="ml-2 text-xs">
              {nodes.length} nodes · {graphData.links.length} connections
            </Badge>
          </CardTitle>
          
          <div className="flex items-center gap-2">
            <Select value={colorBy} onValueChange={(v) => setColorBy(v as typeof colorBy)}>
              <SelectTrigger className="w-[120px] h-8 text-xs">
                <SelectValue placeholder="Color by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="sri">By SRI</SelectItem>
                <SelectItem value="status">By Status</SelectItem>
                <SelectItem value="version">By Version</SelectItem>
              </SelectContent>
            </Select>

            <div className="flex items-center gap-0.5 p-0.5 rounded-lg bg-muted/50">
              <Button variant="ghost" size="icon" className="h-7 w-7" onClick={handleZoomOut}>
                <ZoomOut className="h-3.5 w-3.5" />
              </Button>
              <Button variant="ghost" size="icon" className="h-7 w-7" onClick={handleZoomIn}>
                <ZoomIn className="h-3.5 w-3.5" />
              </Button>
              <Button variant="ghost" size="icon" className="h-7 w-7" onClick={handleResetZoom}>
                <Maximize2 className="h-3.5 w-3.5" />
              </Button>
              <Button variant="ghost" size="icon" className="h-7 w-7" onClick={toggleSimulation}>
                {isSimulationRunning ? <Pause className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5" />}
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
            className="bg-gradient-to-b from-background/50 to-background"
            onClick={() => setSelectedNode(null)}
          />
          
          {/* Legend */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="absolute bottom-4 left-4 bg-card/90 backdrop-blur-lg p-3 rounded-lg text-xs z-10 border border-border/50"
          >
            <div className="font-medium mb-2">
              {colorBy === 'sri' && 'SRI Score'}
              {colorBy === 'status' && 'Node Status'}
              {colorBy === 'version' && 'Version'}
            </div>
            {colorBy === 'sri' && (
              <div className="space-y-1.5">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-green-500 shadow-[0_0_6px_rgba(34,197,94,0.5)]" />
                  <span className="text-muted-foreground">High (80+)</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-yellow-500 shadow-[0_0_6px_rgba(234,179,8,0.5)]" />
                  <span className="text-muted-foreground">Medium (60-79)</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-red-500 shadow-[0_0_6px_rgba(239,68,68,0.5)]" />
                  <span className="text-muted-foreground">Low (&lt;60)</span>
                </div>
              </div>
            )}
            {colorBy === 'status' && (
              <div className="space-y-1.5">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-green-500" />
                  <span className="text-muted-foreground">Online</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-yellow-500" />
                  <span className="text-muted-foreground">Degraded</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-red-500" />
                  <span className="text-muted-foreground">Offline</span>
                </div>
              </div>
            )}
            {colorBy === 'version' && (
              <div className="space-y-1.5">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-green-500" />
                  <span className="text-muted-foreground">Latest Version</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-yellow-500" />
                  <span className="text-muted-foreground">Outdated</span>
                </div>
              </div>
            )}
          </motion.div>

          {/* Hover info */}
          <AnimatePresence>
            {hoveredNode && !selectedNode && (
              <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="absolute top-4 right-4 bg-card/90 backdrop-blur-lg p-3 rounded-lg text-xs z-10 min-w-[160px] border border-border/50"
              >
                <div className="font-medium mb-2 flex items-center gap-1">
                  <Info className="h-3 w-3 text-primary" />
                  Quick View
                </div>
                <div className="space-y-1.5">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">ID:</span>
                    <span className="font-mono">{truncatePubkey(hoveredNode.id, 4)}</span>
                  </div>
                  {hoveredNode.node.geoCity && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Location:</span>
                      <span>{hoveredNode.node.geoCity}</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">SRI:</span>
                    <span style={{ color: getSRIColor(hoveredNode.node.sri) }}>
                      {hoveredNode.node.sri}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Peers:</span>
                    <span>{hoveredNode.node.peerCount}</span>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Selected node detail panel */}
          <AnimatePresence>
            {selectedNode && (
              <NodeDetailPanel
                node={selectedNode}
                onClose={() => setSelectedNode(null)}
                onViewDetails={() => {
                  onNodeClick?.(selectedNode.node);
                  setSelectedNode(null);
                }}
              />
            )}
          </AnimatePresence>

          {/* Instructions */}
          <div className="absolute bottom-4 right-4 bg-card/80 backdrop-blur p-2 rounded-lg text-[10px] text-muted-foreground z-10 border border-border/50">
            Drag nodes • Scroll to zoom • Click for details
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
