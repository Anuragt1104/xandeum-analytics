'use client';

import { useMemo } from 'react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface AvailabilityHeatmapProps {
  data?: boolean[]; // 24 * 60 = 1440 data points (per minute for 24h)
  isLoading?: boolean;
}

function generateMockAvailability(): boolean[] {
  // Generate 1440 data points (24 hours * 60 minutes)
  const data: boolean[] = [];
  for (let i = 0; i < 1440; i++) {
    // 95% chance of being online
    data.push(Math.random() > 0.05);
  }
  return data;
}

export function AvailabilityHeatmap({ data, isLoading }: AvailabilityHeatmapProps) {
  const heatmapData = useMemo(() => {
    const availability = data || generateMockAvailability();
    
    // Group into hours (24 rows) and minutes (60 columns)
    const grid: { online: boolean; hour: number; minute: number }[][] = [];
    
    for (let hour = 0; hour < 24; hour++) {
      const row: { online: boolean; hour: number; minute: number }[] = [];
      for (let minute = 0; minute < 60; minute++) {
        const index = hour * 60 + minute;
        row.push({
          online: availability[index] ?? true,
          hour,
          minute,
        });
      }
      grid.push(row);
    }
    
    return grid;
  }, [data]);

  // Calculate uptime percentage
  const uptimePercent = useMemo(() => {
    const flat = heatmapData.flat();
    const online = flat.filter((d) => d.online).length;
    return ((online / flat.length) * 100).toFixed(2);
  }, [heatmapData]);

  if (isLoading) {
    return (
      <Card className="bg-card/50 backdrop-blur">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium">24h Availability Heatmap</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[200px] flex items-center justify-center text-muted-foreground">
            Loading...
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-card/50 backdrop-blur">
      <CardHeader className="pb-2 flex flex-row items-center justify-between">
        <CardTitle className="text-sm font-medium">24h Availability Heatmap</CardTitle>
        <span className="text-sm text-muted-foreground">
          {uptimePercent}% uptime
        </span>
      </CardHeader>
      <CardContent>
        <TooltipProvider>
          <div className="overflow-x-auto">
            <div className="min-w-[600px]">
              {/* Hour labels */}
              <div className="flex mb-1 pl-8">
                {[0, 6, 12, 18, 23].map((hour) => (
                  <span
                    key={hour}
                    className="text-[10px] text-muted-foreground"
                    style={{
                      position: 'relative',
                      left: `${(hour / 60) * 100}%`,
                      width: 0,
                    }}
                  >
                    {hour}:00
                  </span>
                ))}
              </div>
              
              {/* Heatmap grid */}
              <div className="flex flex-col gap-[1px]">
                {heatmapData.map((row, hourIndex) => (
                  <div key={hourIndex} className="flex items-center gap-[1px]">
                    <span className="text-[10px] text-muted-foreground w-7 text-right pr-1">
                      {String(hourIndex).padStart(2, '0')}h
                    </span>
                    {row.map((cell, minuteIndex) => (
                      <Tooltip key={`${hourIndex}-${minuteIndex}`}>
                        <TooltipTrigger>
                          <div
                            className={`w-1.5 h-2.5 rounded-[1px] transition-colors ${
                              cell.online
                                ? 'bg-green-500/70 hover:bg-green-500'
                                : 'bg-red-500/70 hover:bg-red-500'
                            }`}
                          />
                        </TooltipTrigger>
                        <TooltipContent>
                          <p className="text-xs">
                            {String(cell.hour).padStart(2, '0')}:
                            {String(cell.minute).padStart(2, '0')} -{' '}
                            {cell.online ? 'Online' : 'Offline'}
                          </p>
                        </TooltipContent>
                      </Tooltip>
                    ))}
                  </div>
                ))}
              </div>
              
              {/* Legend */}
              <div className="flex items-center gap-4 mt-3 text-xs text-muted-foreground">
                <div className="flex items-center gap-1">
                  <div className="w-3 h-3 rounded-sm bg-green-500/70" />
                  <span>Online</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-3 h-3 rounded-sm bg-red-500/70" />
                  <span>Offline</span>
                </div>
              </div>
            </div>
          </div>
        </TooltipProvider>
      </CardContent>
    </Card>
  );
}
