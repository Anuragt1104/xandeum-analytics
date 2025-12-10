'use client';

import { Search, Filter, X, RefreshCw } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { FilterConfig } from '@/lib/types';

// Add Select component to shadcn
// npx shadcn@latest add select

interface SearchFilterProps {
  filterConfig: FilterConfig;
  onFilterChange: (config: FilterConfig) => void;
  onRefresh: () => void;
  isLoading: boolean;
  versions: string[];
  totalCount: number;
  filteredCount: number;
}

export function SearchFilter({
  filterConfig,
  onFilterChange,
  onRefresh,
  isLoading,
  versions,
  totalCount,
  filteredCount,
}: SearchFilterProps) {
  const hasFilters =
    filterConfig.search ||
    filterConfig.status !== 'all' ||
    filterConfig.version !== 'all' ||
    filterConfig.minSri > 0 ||
    filterConfig.showIncentivizedOnly;

  const clearFilters = () => {
    onFilterChange({
      search: '',
      status: 'all',
      version: 'all',
      minSri: 0,
      showIncentivizedOnly: false,
    });
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-3">
        {/* Search Input */}
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by pubkey, name, or location..."
            value={filterConfig.search}
            onChange={(e) =>
              onFilterChange({ ...filterConfig, search: e.target.value })
            }
            className="pl-10 bg-background/50"
          />
        </div>

        {/* Status Filter */}
        <Select
          value={filterConfig.status}
          onValueChange={(value) =>
            onFilterChange({
              ...filterConfig,
              status: value as FilterConfig['status'],
            })
          }
        >
          <SelectTrigger className="w-full sm:w-[140px] bg-background/50">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="online">Online</SelectItem>
            <SelectItem value="offline">Offline</SelectItem>
            <SelectItem value="degraded">Degraded</SelectItem>
          </SelectContent>
        </Select>

        {/* Version Filter */}
        <Select
          value={filterConfig.version}
          onValueChange={(value) =>
            onFilterChange({ ...filterConfig, version: value })
          }
        >
          <SelectTrigger className="w-full sm:w-[180px] bg-background/50">
            <SelectValue placeholder="Version" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Versions</SelectItem>
            {versions.map((version) => (
              <SelectItem key={version} value={version}>
                {version}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Refresh Button */}
        <Button
          variant="outline"
          size="icon"
          onClick={onRefresh}
          disabled={isLoading}
          className="shrink-0"
        >
          <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
        </Button>
      </div>

      {/* Filter Info & Clear */}
      <div className="flex items-center justify-between text-sm">
        <div className="flex items-center gap-2 text-muted-foreground">
          <Filter className="h-4 w-4" />
          <span>
            Showing {filteredCount} of {totalCount} pNodes
          </span>
        </div>
        
        {hasFilters && (
          <Button
            variant="ghost"
            size="sm"
            onClick={clearFilters}
            className="h-8 text-muted-foreground hover:text-foreground"
          >
            <X className="h-4 w-4 mr-1" />
            Clear filters
          </Button>
        )}
      </div>
    </div>
  );
}
