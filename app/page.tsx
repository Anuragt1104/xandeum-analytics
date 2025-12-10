'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import { LayoutGrid, List, Globe, Network } from 'lucide-react';
import { StatsCards } from '@/components/dashboard/stats-cards';
import { SearchFilter } from '@/components/dashboard/search-filter';
import { NodeTable } from '@/components/dashboard/node-table';
import { NodeCardList } from '@/components/dashboard/node-card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { usePNodes } from '@/hooks/use-pnodes';
import type { PNode } from '@/lib/types';

// Dynamic imports for heavy components
const WorldMap = dynamic(
  () => import('@/components/dashboard/world-map').then((mod) => mod.WorldMap),
  { ssr: false, loading: () => <div className="h-[400px] bg-muted/20 rounded-lg animate-pulse" /> }
);
const TopologyGraph = dynamic(
  () => import('@/components/charts/topology-graph').then((mod) => mod.TopologyGraph),
  { ssr: false, loading: () => <div className="h-[500px] bg-muted/20 rounded-lg animate-pulse" /> }
);

export default function HomePage() {
  const router = useRouter();
  const {
    nodes,
    filteredNodes,
    stats,
    isLoading,
    sortConfig,
    filterConfig,
    setSortConfig,
    setFilterConfig,
    refresh,
  } = usePNodes(true);

  // View mode: 'table' for desktop, 'cards' for mobile/user preference
  const [viewMode, setViewMode] = useState<'table' | 'cards'>('table');
  const [activeTab, setActiveTab] = useState<'list' | 'map' | 'topology'>('list');

  // Extract unique versions for filter
  const versions = useMemo(() => {
    const versionSet = new Set(nodes.map((n) => n.version));
    return Array.from(versionSet).sort().reverse();
  }, [nodes]);

  // Handle node click from map or graph
  const handleNodeClick = (node: PNode) => {
    router.push(`/node/${node.pubkey}`);
  };

  return (
    <div className="container mx-auto px-4 py-6 space-y-6">
      {/* Hero Section */}
      <div className="space-y-2">
        <h1 className="text-3xl md:text-4xl font-bold">
          pNode Network Dashboard
        </h1>
        <p className="text-muted-foreground max-w-2xl">
          Real-time analytics for the Xandeum pNode network. Monitor storage
          providers, track network health, and explore the decentralized storage
          layer powering Solana dApps.
        </p>
      </div>

      {/* Stats Cards */}
      <StatsCards stats={stats} isLoading={isLoading} />

      {/* Main Content Tabs */}
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as typeof activeTab)} className="space-y-4">
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
          <TabsList className="bg-card/50">
            <TabsTrigger value="list" className="gap-2">
              <List className="h-4 w-4" />
              <span className="hidden sm:inline">Node List</span>
            </TabsTrigger>
            <TabsTrigger value="map" className="gap-2">
              <Globe className="h-4 w-4" />
              <span className="hidden sm:inline">World Map</span>
            </TabsTrigger>
            <TabsTrigger value="topology" className="gap-2">
              <Network className="h-4 w-4" />
              <span className="hidden sm:inline">Topology</span>
            </TabsTrigger>
          </TabsList>

          {/* View Toggle (only for list view) */}
          {activeTab === 'list' && (
            <div className="flex items-center gap-1 p-1 rounded-lg bg-muted/50 shrink-0">
              <Button
                variant={viewMode === 'table' ? 'secondary' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('table')}
                className="h-8"
              >
                <List className="h-4 w-4 mr-1" />
                <span className="hidden sm:inline">Table</span>
              </Button>
              <Button
                variant={viewMode === 'cards' ? 'secondary' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('cards')}
                className="h-8"
              >
                <LayoutGrid className="h-4 w-4 mr-1" />
                <span className="hidden sm:inline">Cards</span>
              </Button>
            </div>
          )}
        </div>

        {/* Tab Content: Node List */}
        <TabsContent value="list" className="space-y-4 mt-0">
          {/* Search and Filters */}
          <SearchFilter
            filterConfig={filterConfig}
            onFilterChange={setFilterConfig}
            onRefresh={refresh}
            isLoading={isLoading}
            versions={versions}
            totalCount={nodes.length}
            filteredCount={filteredNodes.length}
          />

          {/* Node List - Table or Cards based on view mode */}
          <div className="hidden md:block">
            {viewMode === 'table' ? (
              <NodeTable
                nodes={filteredNodes}
                isLoading={isLoading}
                sortConfig={sortConfig}
                onSortChange={setSortConfig}
              />
            ) : (
              <NodeCardList nodes={filteredNodes} isLoading={isLoading} />
            )}
          </div>
          
          {/* Mobile: Always show cards */}
          <div className="md:hidden">
            <NodeCardList nodes={filteredNodes} isLoading={isLoading} />
          </div>
        </TabsContent>

        {/* Tab Content: World Map */}
        <TabsContent value="map" className="mt-0">
          <WorldMap
            nodes={nodes}
            isLoading={isLoading}
            onNodeClick={handleNodeClick}
          />
        </TabsContent>

        {/* Tab Content: Network Topology */}
        <TabsContent value="topology" className="mt-0">
          <TopologyGraph
            nodes={nodes}
            isLoading={isLoading}
            onNodeClick={handleNodeClick}
          />
        </TabsContent>
      </Tabs>

      {/* Info Section */}
      <div className="rounded-lg border border-border/50 bg-card/30 backdrop-blur p-6">
        <h2 className="text-lg font-semibold mb-3">About Xandeum pNodes</h2>
        <div className="grid md:grid-cols-3 gap-6 text-sm text-muted-foreground">
          <div>
            <h3 className="font-medium text-foreground mb-1">What are pNodes?</h3>
            <p>
              Provider Nodes (pNodes) form Xandeum&apos;s decentralized storage network,
              acting as the &quot;hard drive&quot; for Solana dApps. They store data securely
              with redundancy and erasure coding.
            </p>
          </div>
          <div>
            <h3 className="font-medium text-foreground mb-1">Storage Reliability Index</h3>
            <p>
              SRI is a weighted score based on RPC availability (40%), gossip
              visibility (30%), and version compliance (30%). Higher SRI indicates
              more reliable storage providers.
            </p>
          </div>
          <div>
            <h3 className="font-medium text-foreground mb-1">Deep South Era</h3>
            <p>
              The current DevNet phase with 300 incentivized pNodes. Operators earn
              rewards for maintaining high uptime and participating in network
              testing.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
