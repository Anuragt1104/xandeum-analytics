'use client';

import { motion } from 'framer-motion';
import Image from 'next/image';

interface XandeumLogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  animated?: boolean;
  className?: string;
  showText?: boolean;
}

const sizes = {
  sm: { width: 100, height: 22 },
  md: { width: 140, height: 31 },
  lg: { width: 180, height: 40 },
  xl: { width: 220, height: 48 },
};

export function XandeumLogo({ 
  size = 'md', 
  animated = true, 
  className = '',
  showText = false 
}: XandeumLogoProps) {
  const { width, height } = sizes[size];

  return (
    <motion.div
      className={`relative flex items-center gap-2.5 ${className}`}
      initial={animated ? { opacity: 0, scale: 0.9 } : {}}
      animate={animated ? { opacity: 1, scale: 1 } : {}}
      transition={{ duration: 0.5, type: 'spring', stiffness: 150 }}
      whileHover={animated ? { scale: 1.02 } : {}}
    >
      {/* Glow effect */}
      {animated && (
        <motion.div
          className="absolute inset-0 rounded-lg blur-xl opacity-30"
          style={{
            background: 'linear-gradient(135deg, #F5A623, #00B39B, #9B59B6)',
          }}
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.2, 0.4, 0.2],
          }}
          transition={{
            duration: 3,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        />
      )}
      
      {/* Actual Xandeum Logo from website */}
      <Image
        src="/xandeum-logo.png"
        alt="Xandeum"
        width={width}
        height={height}
        className="relative z-10 h-auto"
        priority
      />
      
      {showText && (
        <motion.span
          className="text-xs text-muted-foreground font-medium"
          initial={animated ? { opacity: 0, x: -10 } : {}}
          animate={animated ? { opacity: 1, x: 0 } : {}}
          transition={{ duration: 0.5, delay: 0.3 }}
        >
          pNode Analytics
        </motion.span>
      )}
    </motion.div>
  );
}

// Icon-only version using the trilemma X shape
export function XandeumIcon({ 
  size = 32, 
  animated = true,
  className = '' 
}: { 
  size?: number;
  animated?: boolean;
  className?: string;
}) {
  return (
    <motion.div
      className={`relative ${className}`}
      initial={animated ? { opacity: 0, scale: 0.8 } : {}}
      animate={animated ? { opacity: 1, scale: 1 } : {}}
      whileHover={animated ? { scale: 1.05 } : {}}
    >
      {/* Glow */}
      {animated && (
        <motion.div
          className="absolute inset-0 rounded-full blur-lg"
          style={{
            background: 'linear-gradient(135deg, #F5A623, #00B39B, #9B59B6)',
          }}
          animate={{
            opacity: [0.3, 0.5, 0.3],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        />
      )}
      
      <svg
        width={size}
        height={size}
        viewBox="0 0 64 64"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="relative z-10"
      >
        <defs>
          <linearGradient id="orangeGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#F5A623" />
            <stop offset="100%" stopColor="#E09612" />
          </linearGradient>
          <linearGradient id="greenGrad" x1="0%" y1="100%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#00B39B" />
            <stop offset="100%" stopColor="#009E89" />
          </linearGradient>
          <linearGradient id="purpleGrad" x1="100%" y1="100%" x2="0%" y2="0%">
            <stop offset="0%" stopColor="#9B59B6" />
            <stop offset="100%" stopColor="#8E44AD" />
          </linearGradient>
          <filter id="iconGlow">
            <feGaussianBlur stdDeviation="1.5" result="coloredBlur"/>
            <feMerge>
              <feMergeNode in="coloredBlur"/>
              <feMergeNode in="SourceGraphic"/>
            </feMerge>
          </filter>
        </defs>
        
        {/* Orange top-left shape */}
        <motion.path
          d="M8 8 L32 32 L8 32 Z"
          fill="url(#orangeGrad)"
          filter="url(#iconGlow)"
          initial={animated ? { opacity: 0, scale: 0.8 } : {}}
          animate={animated ? { opacity: 1, scale: 1 } : {}}
          transition={{ duration: 0.5, delay: 0 }}
        />
        <motion.path
          d="M8 8 L32 8 L32 32 Z"
          fill="url(#orangeGrad)"
          filter="url(#iconGlow)"
          initial={animated ? { opacity: 0, scale: 0.8 } : {}}
          animate={animated ? { opacity: 1, scale: 1 } : {}}
          transition={{ duration: 0.5, delay: 0.1 }}
        />
        
        {/* Green top-right shape */}
        <motion.path
          d="M56 8 L32 32 L56 32 Z"
          fill="url(#greenGrad)"
          filter="url(#iconGlow)"
          initial={animated ? { opacity: 0, scale: 0.8 } : {}}
          animate={animated ? { opacity: 1, scale: 1 } : {}}
          transition={{ duration: 0.5, delay: 0.15 }}
        />
        <motion.path
          d="M56 8 L32 8 L32 32 Z"
          fill="url(#greenGrad)"
          filter="url(#iconGlow)"
          initial={animated ? { opacity: 0, scale: 0.8 } : {}}
          animate={animated ? { opacity: 1, scale: 1 } : {}}
          transition={{ duration: 0.5, delay: 0.2 }}
        />
        
        {/* Purple bottom shape */}
        <motion.path
          d="M8 56 L32 32 L56 56 Z"
          fill="url(#purpleGrad)"
          filter="url(#iconGlow)"
          initial={animated ? { opacity: 0, scale: 0.8 } : {}}
          animate={animated ? { opacity: 1, scale: 1 } : {}}
          transition={{ duration: 0.5, delay: 0.25 }}
        />
      </svg>
    </motion.div>
  );
}
