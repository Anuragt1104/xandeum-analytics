'use client';

import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface AnimatedSkeletonProps {
  className?: string;
  variant?: 'default' | 'shimmer' | 'pulse';
}

export function AnimatedSkeleton({ 
  className, 
  variant = 'shimmer' 
}: AnimatedSkeletonProps) {
  if (variant === 'shimmer') {
    return (
      <div
        className={cn(
          'relative overflow-hidden rounded-md bg-muted/50',
          className
        )}
      >
        <motion.div
          className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/10 to-transparent"
          animate={{ x: ['0%', '200%'] }}
          transition={{
            duration: 1.5,
            repeat: Infinity,
            ease: 'linear',
          }}
        />
      </div>
    );
  }

  if (variant === 'pulse') {
    return (
      <motion.div
        className={cn('rounded-md bg-muted/50', className)}
        animate={{ opacity: [0.5, 1, 0.5] }}
        transition={{
          duration: 2,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
      />
    );
  }

  return <div className={cn('rounded-md bg-muted/50 animate-pulse', className)} />;
}

// Card skeleton for loading states
export function CardSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn('rounded-xl border border-border/50 bg-card/30 p-4 space-y-3', className)}>
      <div className="flex items-center justify-between">
        <AnimatedSkeleton className="h-4 w-24" />
        <AnimatedSkeleton className="h-8 w-8 rounded-lg" />
      </div>
      <AnimatedSkeleton className="h-8 w-32" />
      <AnimatedSkeleton className="h-3 w-20" />
    </div>
  );
}

// Table row skeleton
export function TableRowSkeleton({ columns = 9 }: { columns?: number }) {
  return (
    <tr className="border-b border-border/30">
      {Array.from({ length: columns }).map((_, i) => (
        <td key={i} className="p-4">
          <AnimatedSkeleton className="h-4 w-full max-w-[100px]" />
        </td>
      ))}
    </tr>
  );
}

// Map skeleton
export function MapSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn('relative rounded-xl overflow-hidden', className)}>
      <AnimatedSkeleton className="h-full w-full" variant="pulse" />
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <motion.div
            className="w-10 h-10 border-2 border-primary/30 border-t-primary rounded-full"
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
          />
          <span className="text-sm text-muted-foreground">Loading map...</span>
        </div>
      </div>
    </div>
  );
}

// Stats card skeleton
export function StatsSkeleton({ count = 6 }: { count?: number }) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 md:gap-4">
      {Array.from({ length: count }).map((_, i) => (
        <motion.div
          key={i}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.05 }}
        >
          <CardSkeleton />
        </motion.div>
      ))}
    </div>
  );
}

// Hero skeleton
export function HeroSkeleton() {
  return (
    <div className="py-12 md:py-16 space-y-6">
      <AnimatedSkeleton className="h-4 w-40 rounded-full" />
      <AnimatedSkeleton className="h-12 w-3/4 max-w-xl" />
      <AnimatedSkeleton className="h-6 w-full max-w-2xl" />
      <div className="flex flex-wrap gap-3 pt-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <AnimatedSkeleton key={i} className="h-10 w-32 rounded-full" />
        ))}
      </div>
    </div>
  );
}

