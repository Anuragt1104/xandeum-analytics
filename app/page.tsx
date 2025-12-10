'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import { motion } from 'framer-motion';
import { LayoutGrid, List, Globe2, Network, Sparkles, BarChart3 } from 'lucide-react';
import { HeroSection } from '@/components/dashboard/hero-section';
import { StatsCards } from '@/components/dashboard/stats-cards';
import { SearchFilter } from '@/components/dashboard/search-filter';
import { NodeTable } from '@/components/dashboard/node-table';
import { NodeCardList } from '@/components/dashboard/node-card';
import { AnalyticsCharts } from '@/components/charts/analytics-charts';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { usePNodes } from '@/hooks/use-pnodes';
import { staggerContainer, fadeInUp } from '@/lib/animations';
import type { PNode } from '@/lib/types';

// Dynamic imports for heavy components
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
          <span className="text-sm text-muted-foreground">Loading 3D Globe...</span>
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
          <div className="w-10 h-10 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
          <span className="text-sm text-muted-foreground">Loading topology...</span>
        </div>
      </div>
    )
  }
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
  const [activeTab, setActiveTab] = useState<'list' | 'globe' | 'topology' | 'analytics'>('list');

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
                className="gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground transition-all"
              >
                <List className="h-4 w-4" />
                <span className="hidden sm:inline">Node List</span>
              </TabsTrigger>
              <TabsTrigger 
                value="globe" 
                className="gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground transition-all"
              >
                <Globe2 className="h-4 w-4" />
                <span className="hidden sm:inline">3D Globe</span>
              </TabsTrigger>
              <TabsTrigger 
                value="topology" 
                className="gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground transition-all"
              >
                <Network className="h-4 w-4" />
                <span className="hidden sm:inline">Topology</span>
              </TabsTrigger>
              <TabsTrigger 
                value="analytics" 
                className="gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground transition-all"
              >
                <BarChart3 className="h-4 w-4" />
                <span className="hidden sm:inline">Analytics</span>
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

          {/* Tab Content: Analytics */}
          <TabsContent value="analytics" className="mt-0">
            <AnalyticsCharts
              nodes={nodes}
              stats={stats}
              isLoading={isLoading}
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
          <Sparkles className="h-5 w-5 text-primary" />
          <h2 className="text-lg font-semibold">About Xandeum pNodes</h2>
        </div>
        <div className="grid md:grid-cols-3 gap-6 text-sm text-muted-foreground">
          <motion.div 
            className="space-y-2"
            whileHover={{ y: -2 }}
            transition={{ duration: 0.2 }}
          >
            <h3 className="font-medium text-foreground">What are pNodes?</h3>
            <p>
              Provider Nodes (pNodes) form Xandeum&apos;s decentralized storage network,
              acting as the &quot;hard drive&quot; for Solana dApps. They store data securely
              with redundancy and erasure coding.
            </p>
          </motion.div>
          <motion.div 
            className="space-y-2"
            whileHover={{ y: -2 }}
            transition={{ duration: 0.2 }}
          >
            <h3 className="font-medium text-foreground">Storage Reliability Index</h3>
            <p>
              SRI is a weighted score based on RPC availability (40%), gossip
              visibility (30%), and version compliance (30%). Higher SRI indicates
              more reliable storage providers.
            </p>
          </motion.div>
          <motion.div 
            className="space-y-2"
            whileHover={{ y: -2 }}
            transition={{ duration: 0.2 }}
          >
            <h3 className="font-medium text-foreground">Deep South Era</h3>
            <p>
              The current DevNet phase with 300 incentivized pNodes. Operators earn
              rewards for maintaining high uptime and participating in network
              testing.
            </p>
          </motion.div>
        </div>
      </motion.div>
    </motion.div>
  );
}
