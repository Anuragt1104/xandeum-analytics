'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Activity, Zap, Globe, Shield } from 'lucide-react';
import { staggerContainer, staggerItem, fadeInUp } from '@/lib/animations';
import type { NetworkStats } from '@/lib/types';
import { BackgroundParticles } from '@/components/ui/background-particles';

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
      className={`flex items-center gap-3 px-4 py-2 rounded-full bg-card/40 backdrop-blur-md border border-white/5 hover:border-${color}/30 transition-all duration-300 hover:bg-card/60`}
      whileHover={{ scale: 1.05, y: -2 }}
    >
      <div className={`p-1.5 rounded-full bg-${color}/10 ring-1 ring-${color}/20`}>
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
      <div className="relative py-12 md:py-24">
        <div className="space-y-6">
          <div className="h-16 bg-muted/20 rounded-lg animate-pulse" />
          <div className="h-6 w-2/3 bg-muted/20 rounded-lg animate-pulse" />
        </div>
      </div>
    );
  }

  return (
    <div className="relative py-12 md:py-24 overflow-hidden rounded-3xl border border-white/5 bg-gradient-to-b from-[#0A1628]/50 to-[#0A1628]">
      {/* Dynamic Background */}
      <div className="absolute inset-0 z-0">
        <BackgroundParticles />
        {/* Gradient overlays for better text readability */}
        <div className="absolute inset-0 bg-gradient-to-r from-[#0A1628] via-[#0A1628]/80 to-transparent" />
        <div className="absolute bottom-0 left-0 w-full h-1/2 bg-gradient-to-t from-[#0A1628] to-transparent" />
      </div>
      
      {/* Glowing orb effect */}
      <div className="absolute -top-[200px] -right-[200px] w-[600px] h-[600px] bg-xandeum-green/20 rounded-full blur-[120px] pointer-events-none opacity-50 mix-blend-screen animate-pulse" />
      <div className="absolute -bottom-[200px] -left-[200px] w-[500px] h-[500px] bg-xandeum-purple/10 rounded-full blur-[100px] pointer-events-none opacity-40 mix-blend-screen" />

      <motion.div
        className="relative z-10 px-6 md:px-10"
        initial="hidden"
        animate="visible"
        variants={staggerContainer}
      >
        <div className="space-y-6 max-w-4xl">
          {/* Status Badge */}
          <motion.div 
            variants={fadeInUp}
            className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-xandeum-green/10 border border-xandeum-green/20 text-sm text-xandeum-green backdrop-blur-md"
          >
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-xandeum-green opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-xandeum-green"></span>
            </span>
            Live Network Monitoring
          </motion.div>
          
          {/* Main Title */}
          <AnimatedTitle text="Network Dashboard" />
          
          {/* Description */}
          <motion.p
            variants={fadeInUp}
            className="text-lg md:text-xl text-muted-foreground/90 max-w-2xl leading-relaxed"
          >
            Real-time analytics for the decentralized storage network. 
            Monitor node health, track performance, and explore the infrastructure powering <span className="text-xandeum-green font-medium glow-green">Solana dApps</span>.
          </motion.p>

          {/* Stats Grid */}
          <motion.div
            variants={staggerContainer}
            className="flex flex-wrap gap-4 pt-4"
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
        </div>
      </motion.div>
    </div>
  );
}