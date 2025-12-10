'use client';

import { useEffect, useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Activity, Zap, Globe, Shield } from 'lucide-react';
import { staggerContainer, staggerItem, fadeInUp } from '@/lib/animations';
import type { NetworkStats } from '@/lib/types';
import Image from 'next/image';

interface HeroSectionProps {
  stats: NetworkStats | null;
  isLoading: boolean;
}

// Animated counter hook
function useAnimatedCounter(end: number, duration: number = 2000, start: number = 0) {
  const [count, setCount] = useState(start);

  useEffect(() => {
    if (end === 0) {
      setCount(0);
      return;
    }

    let startTime: number;
    let animationFrame: number;

    const animate = (timestamp: number) => {
      if (!startTime) startTime = timestamp;
      const progress = Math.min((timestamp - startTime) / duration, 1);
      
      // Easing function for smooth animation
      const easeOutQuart = 1 - Math.pow(1 - progress, 4);
      setCount(Math.floor(easeOutQuart * (end - start) + start));

      if (progress < 1) {
        animationFrame = requestAnimationFrame(animate);
      }
    };

    animationFrame = requestAnimationFrame(animate);

    return () => cancelAnimationFrame(animationFrame);
  }, [end, duration, start]);

  return count;
}

// Animated text component
function AnimatedTitle({ text }: { text: string }) {
  return (
    <motion.h1 
      className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight"
      variants={staggerContainer}
      initial="hidden"
      animate="visible"
    >
      {text.split(' ').map((word, wordIndex) => (
        <span key={wordIndex} className="inline-block mr-3">
          {word.split('').map((char, charIndex) => (
            <motion.span
              key={charIndex}
              className="inline-block"
              variants={{
                hidden: { opacity: 0, y: 50, rotateX: -90 },
                visible: {
                  opacity: 1,
                  y: 0,
                  rotateX: 0,
                  transition: {
                    duration: 0.5,
                    ease: [0.16, 1, 0.3, 1],
                  },
                },
              }}
            >
              {char}
            </motion.span>
          ))}
        </span>
      ))}
    </motion.h1>
  );
}

// Pre-calculated positions to avoid hydration mismatch
const PULSE_POSITIONS = [
  { left: 15, top: 20, size: 5, duration: 2.5 },
  { left: 35, top: 60, size: 6, duration: 3.0 },
  { left: 55, top: 30, size: 4, duration: 2.8 },
  { left: 75, top: 70, size: 5, duration: 3.2 },
  { left: 25, top: 80, size: 6, duration: 2.6 },
  { left: 65, top: 15, size: 4, duration: 3.4 },
  { left: 45, top: 45, size: 5, duration: 2.9 },
  { left: 85, top: 40, size: 6, duration: 3.1 },
];

// Live pulse animation showing network activity - with fixed positions
function NetworkPulse({ activeNodes }: { activeNodes: number }) {
  const pulseCount = Math.min(8, Math.max(3, Math.floor(activeNodes / 5)));
  
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {PULSE_POSITIONS.slice(0, pulseCount).map((pos, i) => (
        <motion.div
          key={i}
          className="absolute rounded-full bg-xandeum-green/30"
          style={{
            width: pos.size,
            height: pos.size,
            left: `${pos.left}%`,
            top: `${pos.top}%`,
          }}
          animate={{
            scale: [1, 2, 1],
            opacity: [0.5, 0.8, 0.5],
          }}
          transition={{
            duration: pos.duration,
            repeat: Infinity,
            delay: i * 0.3,
            ease: 'easeInOut',
          }}
        />
      ))}
      
      {/* Connection lines */}
      <svg className="absolute inset-0 w-full h-full">
        <defs>
          <linearGradient id="lineGradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="var(--xandeum-green)" stopOpacity="0" />
            <stop offset="50%" stopColor="var(--xandeum-green)" stopOpacity="0.3" />
            <stop offset="100%" stopColor="var(--xandeum-green)" stopOpacity="0" />
          </linearGradient>
        </defs>
        {[0, 1, 2].map((i) => (
          <motion.line
            key={i}
            x1={`${20 + i * 30}%`}
            y1="0%"
            x2={`${30 + i * 30}%`}
            y2="100%"
            stroke="url(#lineGradient)"
            strokeWidth="1"
            initial={{ pathLength: 0, opacity: 0 }}
            animate={{ pathLength: 1, opacity: 0.5 }}
            transition={{
              duration: 3,
              delay: i * 0.5,
              repeat: Infinity,
              repeatType: 'loop',
            }}
          />
        ))}
      </svg>
    </div>
  );
}

// Quick stat badge
function QuickStat({ 
  icon: Icon, 
  label, 
  value, 
  suffix = '',
  color = 'xandeum-green',
  delay = 0 
}: { 
  icon: React.ElementType; 
  label: string; 
  value: number;
  suffix?: string;
  color?: string;
  delay?: number;
}) {
  const animatedValue = useAnimatedCounter(value, 2000);
  
  return (
    <motion.div
      variants={staggerItem}
      className={`flex items-center gap-3 px-4 py-2 rounded-full bg-card/50 backdrop-blur border border-border/50 hover:border-${color}/30 transition-colors`}
      whileHover={{ scale: 1.02, y: -2 }}
    >
      <div className={`p-1.5 rounded-full bg-${color}/10`}>
        <Icon className={`h-4 w-4 text-${color}`} />
      </div>
      <div className="flex flex-col">
        <span className="text-xs text-muted-foreground">{label}</span>
        <span className="text-sm font-semibold font-mono">
          {animatedValue.toLocaleString()}{suffix}
        </span>
      </div>
    </motion.div>
  );
}

export function HeroSection({ stats, isLoading }: HeroSectionProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className="relative py-12 md:py-16">
        <div className="space-y-6">
          <div className="h-16 bg-muted/20 rounded-lg animate-pulse" />
          <div className="h-6 w-2/3 bg-muted/20 rounded-lg animate-pulse" />
        </div>
      </div>
    );
  }

  return (
    <div className="relative py-12 md:py-16 overflow-hidden">
      {/* Background effects */}
      <NetworkPulse activeNodes={stats?.activeNodes || 0} />
      
      {/* Gradient orb with Xandeum colors */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-gradient-radial from-xandeum-green/10 via-transparent to-transparent rounded-full blur-3xl pointer-events-none" />
      
      <motion.div
        className="relative z-10 space-y-8"
        initial="hidden"
        animate="visible"
        variants={staggerContainer}
      >
        {/* Logo and title */}
        <div className="space-y-4">
          <motion.div 
            variants={fadeInUp}
            className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-xandeum-green/10 border border-xandeum-green/20 text-sm text-xandeum-green"
          >
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-xandeum-green opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-xandeum-green"></span>
            </span>
            Live Network Monitoring
          </motion.div>
          
          {/* Xandeum Logo */}
          <motion.div 
            variants={fadeInUp}
            className="flex items-center gap-4 mb-4"
          >
            <Image
              src="/xandeum-logo.png"
              alt="Xandeum"
              width={180}
              height={40}
              className="h-10 w-auto"
              priority
            />
            <div className="h-8 w-px bg-border" />
            <span className="text-sm font-medium text-muted-foreground">pNode Analytics</span>
          </motion.div>
          
          <AnimatedTitle text="Network Dashboard" />
          
          <motion.p
            variants={fadeInUp}
            className="text-lg md:text-xl text-muted-foreground max-w-2xl"
          >
            Real-time analytics for the decentralized storage network. 
            Monitor node health, track performance, and explore the infrastructure powering <span className="text-xandeum-green font-medium">Solana dApps</span>.
          </motion.p>
        </div>

        {/* Quick stats row */}
        <motion.div
          variants={staggerContainer}
          className="flex flex-wrap gap-3"
        >
          <QuickStat
            icon={Globe}
            label="Active Nodes"
            value={stats?.activeNodes || 0}
            color="xandeum-green"
            delay={0}
          />
          <QuickStat
            icon={Activity}
            label="Avg. SRI"
            value={stats?.averageSri || 0}
            color="xandeum-orange"
            delay={0.1}
          />
          <QuickStat
            icon={Zap}
            label="Avg. Latency"
            value={stats?.averageLatency || 0}
            suffix="ms"
            color="xandeum-purple"
            delay={0.2}
          />
          <QuickStat
            icon={Shield}
            label="Uptime"
            value={Math.round(stats?.averageUptime || 0)}
            suffix="%"
            color="xandeum-green"
            delay={0.3}
          />
        </motion.div>
      </motion.div>
    </div>
  );
}
