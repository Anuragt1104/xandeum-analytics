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
  sm: { icon: 28, text: 'text-sm' },
  md: { icon: 36, text: 'text-lg' },
  lg: { icon: 48, text: 'text-2xl' },
  xl: { icon: 64, text: 'text-3xl' },
};

export function XandeumLogo({ 
  size = 'md', 
  animated = true, 
  className = '',
  showText = true 
}: XandeumLogoProps) {
  const { icon, text } = sizes[size];

  return (
    <div className={`flex items-center gap-2.5 ${className}`}>
      <motion.div
        className="relative"
        whileHover={animated ? { scale: 1.05 } : {}}
        whileTap={animated ? { scale: 0.95 } : {}}
      >
        {/* Glow effect */}
        {animated && (
          <motion.div
            className="absolute inset-0 rounded-xl blur-xl opacity-40"
            style={{
              background: 'linear-gradient(135deg, #F5A623, #00C9A7, #9B59B6)',
            }}
            animate={{
              scale: [1, 1.3, 1],
              opacity: [0.3, 0.5, 0.3],
            }}
            transition={{
              duration: 3,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
          />
        )}
        
        {/* Xandeum X Logo - Three triangular shapes forming X */}
        <svg
          width={icon}
          height={icon}
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
            <linearGradient id="tealGrad" x1="0%" y1="100%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#00C9A7" />
              <stop offset="100%" stopColor="#00B396" />
            </linearGradient>
            <linearGradient id="purpleGrad" x1="100%" y1="100%" x2="0%" y2="0%">
              <stop offset="0%" stopColor="#9B59B6" />
              <stop offset="100%" stopColor="#8E44AD" />
            </linearGradient>
            <filter id="glow">
              <feGaussianBlur stdDeviation="1.5" result="coloredBlur"/>
              <feMerge>
                <feMergeNode in="coloredBlur"/>
                <feMergeNode in="SourceGraphic"/>
              </feMerge>
            </filter>
          </defs>
          
          {/* Orange top-left triangle pointing down-right */}
          <motion.path
            d="M8 8 L32 32 L8 32 Z"
            fill="url(#orangeGrad)"
            filter="url(#glow)"
            initial={animated ? { opacity: 0, scale: 0.8 } : {}}
            animate={animated ? { opacity: 1, scale: 1 } : {}}
            transition={{ duration: 0.5, delay: 0 }}
          />
          <motion.path
            d="M8 8 L32 8 L32 32 Z"
            fill="url(#orangeGrad)"
            filter="url(#glow)"
            initial={animated ? { opacity: 0, scale: 0.8 } : {}}
            animate={animated ? { opacity: 1, scale: 1 } : {}}
            transition={{ duration: 0.5, delay: 0.1 }}
          />
          
          {/* Teal top-right triangle pointing down-left */}
          <motion.path
            d="M56 8 L32 32 L56 32 Z"
            fill="url(#tealGrad)"
            filter="url(#glow)"
            initial={animated ? { opacity: 0, scale: 0.8 } : {}}
            animate={animated ? { opacity: 1, scale: 1 } : {}}
            transition={{ duration: 0.5, delay: 0.15 }}
          />
          <motion.path
            d="M56 8 L32 8 L32 32 Z"
            fill="url(#tealGrad)"
            filter="url(#glow)"
            initial={animated ? { opacity: 0, scale: 0.8 } : {}}
            animate={animated ? { opacity: 1, scale: 1 } : {}}
            transition={{ duration: 0.5, delay: 0.2 }}
          />
          
          {/* Purple bottom triangle */}
          <motion.path
            d="M8 56 L32 32 L56 56 Z"
            fill="url(#purpleGrad)"
            filter="url(#glow)"
            initial={animated ? { opacity: 0, scale: 0.8 } : {}}
            animate={animated ? { opacity: 1, scale: 1 } : {}}
            transition={{ duration: 0.5, delay: 0.25 }}
          />
        </svg>
      </motion.div>
      
      {showText && (
        <motion.div
          className="flex flex-col"
          initial={animated ? { opacity: 0, x: -10 } : {}}
          animate={animated ? { opacity: 1, x: 0 } : {}}
          transition={{ duration: 0.5, delay: 0.3 }}
        >
          <span className={`font-bold ${text} tracking-tight bg-gradient-to-r from-xandeum-orange via-xandeum-teal to-xandeum-purple bg-clip-text text-transparent`}>
            Xandeum
          </span>
          <span className="text-[10px] text-muted-foreground leading-none -mt-0.5">
            pNode Analytics
          </span>
        </motion.div>
      )}
    </div>
  );
}

// Animated background logo for hero sections
export function XandeumLogoBackground({ className = '' }: { className?: string }) {
  return (
    <div className={`absolute pointer-events-none opacity-5 ${className}`}>
      <motion.svg
        width="400"
        height="400"
        viewBox="0 0 64 64"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        animate={{ rotate: 360 }}
        transition={{ duration: 120, repeat: Infinity, ease: 'linear' }}
      >
        <path d="M8 8 L32 32 L8 32 Z" fill="currentColor" />
        <path d="M8 8 L32 8 L32 32 Z" fill="currentColor" />
        <path d="M56 8 L32 32 L56 32 Z" fill="currentColor" />
        <path d="M56 8 L32 8 L32 32 Z" fill="currentColor" />
        <path d="M8 56 L32 32 L56 56 Z" fill="currentColor" />
      </motion.svg>
    </div>
  );
}
