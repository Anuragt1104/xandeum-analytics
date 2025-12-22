'use client';

import { useMemo, useState } from 'react';
import dynamic from 'next/dynamic';
import { motion } from 'framer-motion';
import { LayoutGrid, List, Globe2, Network, Sparkles, Map as MapIcon } from 'lucide-react';
import { HeroSection } from '@/components/dashboard/hero-section';
import { StatsCards } from '@/components/dashboard/stats-cards';
import { SearchFilter } from '@/components/dashboard/search-filter';
import { NodeTable } from '@/components/dashboard/node-table';
import { NodeCardList } from '@/components/dashboard/node-card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { usePNodes } from '@/hooks/use-pnodes';
import { staggerContainer, fadeInUp } from '@/lib/animations';
import type { PNode } from '@/lib/types';

// Dynamic imports for heavy components
const WorldMap = dynamic(
  () => import('@/components/dashboard/world-map').then((mod) => mod.WorldMap),
  { 
    ssr: false, 
    loading: () => (
      <div className="h-[500px] bg-card/30 backdrop-blur rounded-xl border border-border/50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="relative">
            <div className="w-16 h-16 rounded-full border-4 border-xandeum-green/20 border-t-xandeum-green animate-spin" />
            <MapIcon className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-6 w-6 text-xandeum-green" />
          </div>
          <span className="text-sm text-muted-foreground">Loading Map...</span>
        </div>
      </div>
    )
  }
);

const Globe3D = dynamic(
  () => import('@/components/dashboard/globe-3d').then((mod) => mod.Globe3D),
  { 
    ssr: false, 
    loading: () => (
      <div className="h-[600px] bg-card/30 backdrop-blur rounded-xl border border-border/50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="relative">
            <div className="w-16 h-16 rounded-full border-4 border-primary/20 border-t-primary animate-spin" />
            <Globe2 className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-6 w-6 text-primary" />
          </div>
          <span className="text-sm text-muted-foreground">Initializing 3D Globe...</span>
        </div>
      </div>
    )
  }
);

const TopologyGraph = dynamic(
  () => import('@/components/charts/topology-graph').then((mod) => mod.TopologyGraph),
  { 
    ssr: false, 
    loading: () => (
      <div className="h-[500px] bg-card/30 backdrop-blur rounded-xl border border-border/50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-2 border-xandeum-purple/30 border-t-xandeum-purple rounded-full animate-spin" />
          <span className="text-sm text-muted-foreground">Loading topology...</span>
        </div>
      </div>
    )
  }
);

export default function HomePage() {
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
  const [activeTab, setActiveTab] = useState<'list' | 'map' | 'globe' | 'topology'>('list');

  // Extract unique versions for filter
  const versions = useMemo(() => {
    const versionSet = new Set(nodes.map((n) => n.version));
    return Array.from(versionSet).sort().reverse();
  }, [nodes]);

  // Handle node click from map or graph - selection is handled internally
  // Navigation to node details happens via "View Full Analytics" button in info panel
  const handleNodeClick = (node: PNode) => {
    // Node selection is handled by the map/globe components internally
    // This callback is kept for potential analytics or other purposes
  };

  return (
    <motion.div 
      className="container mx-auto px-4 py-6 space-y-8"
      initial="hidden"
      animate="visible"
      variants={staggerContainer}
    >
      {/* Animated Hero Section */}
      <HeroSection stats={stats} isLoading={isLoading} />

      {/* Stats Cards with animations */}
      <motion.div variants={fadeInUp}>
        <StatsCards stats={stats} isLoading={isLoading} />
      </motion.div>

      {/* Main Content Tabs */}
      <motion.div variants={fadeInUp}>
        <Tabs 
          value={activeTab} 
          onValueChange={(v) => setActiveTab(v as typeof activeTab)} 
          className="space-y-6"
        >
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
            <TabsList className="bg-card/50 backdrop-blur border border-border/50 p-1 h-auto flex-wrap">
              <TabsTrigger 
                value="list" 
                className="gap-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-xandeum-green data-[state=active]:to-xandeum-green/80 data-[state=active]:text-white transition-all"
              >
                <List className="h-4 w-4" />
                <span className="hidden sm:inline">Node List</span>
              </TabsTrigger>
              <TabsTrigger 
                value="map" 
                className="gap-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-xandeum-orange data-[state=active]:to-xandeum-orange/80 data-[state=active]:text-white transition-all"
              >
                <MapIcon className="h-4 w-4" />
                <span className="hidden sm:inline">2D Map</span>
              </TabsTrigger>
              <TabsTrigger 
                value="globe" 
                className="gap-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-blue-600 data-[state=active]:text-white transition-all"
              >
                <Globe2 className="h-4 w-4" />
                <span className="hidden sm:inline">3D Globe</span>
              </TabsTrigger>
              <TabsTrigger 
                value="topology" 
                className="gap-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-xandeum-purple data-[state=active]:to-xandeum-purple/80 data-[state=active]:text-white transition-all"
              >
                <Network className="h-4 w-4" />
                <span className="hidden sm:inline">Topology</span>
              </TabsTrigger>
            </TabsList>

            {/* View Toggle (only for list view) */}
            {activeTab === 'list' && (
              <motion.div 
                className="flex items-center gap-1 p-1 rounded-lg bg-card/50 backdrop-blur border border-border/50 shrink-0"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3 }}
              >
                <Button
                  variant={viewMode === 'table' ? 'secondary' : 'ghost'}
                  size="sm"
                  onClick={() => setViewMode('table')}
                  className="h-8 transition-all"
                >
                  <List className="h-4 w-4 mr-1" />
                  <span className="hidden sm:inline">Table</span>
                </Button>
                <Button
                  variant={viewMode === 'cards' ? 'secondary' : 'ghost'}
                  size="sm"
                  onClick={() => setViewMode('cards')}
                  className="h-8 transition-all"
                >
                  <LayoutGrid className="h-4 w-4 mr-1" />
                  <span className="hidden sm:inline">Cards</span>
                </Button>
              </motion.div>
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

          {/* Tab Content: World Map (2D) */}
          <TabsContent value="map" className="mt-0">
            <WorldMap
              nodes={nodes}
              isLoading={isLoading}
              onNodeClick={handleNodeClick}
            />
          </TabsContent>

          {/* Tab Content: 3D Globe */}
          <TabsContent value="globe" className="mt-0">
            <Globe3D
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
      </motion.div>

      {/* Info Section with glass effect */}
      <motion.div 
        variants={fadeInUp}
        className="rounded-xl border border-border/50 bg-card/30 backdrop-blur p-6 md:p-8"
      >
        <div className="flex items-center gap-2 mb-4">
          <Sparkles className="h-5 w-5 text-xandeum-orange" />
          <h2 className="text-lg font-semibold">About Xandeum pNodes</h2>
        </div>
        <div className="grid md:grid-cols-3 gap-6 text-sm text-muted-foreground">
          <motion.div 
            className="space-y-2 p-4 rounded-lg bg-xandeum-orange/5 border border-xandeum-orange/10"
            whileHover={{ y: -2, borderColor: 'rgba(245, 166, 35, 0.3)' }}
            transition={{ duration: 0.2 }}
          >
            <h3 className="font-medium text-foreground flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-xandeum-orange" />
              Smart Contract Native
            </h3>
            <p>
              Xandeum integrates directly with Solana&apos;s smart contract platform,
              enabling seamless and efficient data interaction for dApps.
            </p>
          </motion.div>
          <motion.div 
            className="space-y-2 p-4 rounded-lg bg-xandeum-green/5 border border-xandeum-green/10"
            whileHover={{ y: -2, borderColor: 'rgba(0, 201, 167, 0.3)' }}
            transition={{ duration: 0.2 }}
          >
            <h3 className="font-medium text-foreground flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-xandeum-green" />
              Scalable to Exabytes+
            </h3>
            <p>
              The solution for massive storage capacity needed for data-intensive
              applications to become a reality on Solana.
            </p>
          </motion.div>
          <motion.div 
            className="space-y-2 p-4 rounded-lg bg-xandeum-purple/5 border border-xandeum-purple/10"
            whileHover={{ y: -2, borderColor: 'rgba(155, 89, 182, 0.3)' }}
            transition={{ duration: 0.2 }}
          >
            <h3 className="font-medium text-foreground flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-xandeum-purple" />
              Random Access
            </h3>
            <p>
              Quick and efficient retrieval of specific data, unlike solutions
              that only offer file-level access.
            </p>
          </motion.div>
        </div>
      </motion.div>
    </motion.div>
  );
}