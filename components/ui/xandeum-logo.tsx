'use client';

import { motion } from 'framer-motion';

interface XandeumLogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  animated?: boolean;
  className?: string;
  showText?: boolean;
}

const sizes = {
  sm: { icon: 24, text: 'text-sm' },
  md: { icon: 32, text: 'text-lg' },
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
    <div className={`flex items-center gap-2 ${className}`}>
      <motion.div
        className="relative"
        whileHover={animated ? { scale: 1.05 } : {}}
        whileTap={animated ? { scale: 0.95 } : {}}
      >
        {/* Glow effect */}
        {animated && (
          <motion.div
            className="absolute inset-0 rounded-xl blur-xl opacity-60"
            style={{
              background: 'linear-gradient(135deg, #00d9ff, #8b5cf6)',
            }}
            animate={{
              scale: [1, 1.2, 1],
              opacity: [0.4, 0.6, 0.4],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
          />
        )}
        
        {/* Logo SVG - Xandeum style */}
        <svg
          width={icon}
          height={icon}
          viewBox="0 0 64 64"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="relative z-10"
        >
          <defs>
            <linearGradient id="xandeumGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#00d9ff" />
              <stop offset="50%" stopColor="#8b5cf6" />
              <stop offset="100%" stopColor="#00d9ff" />
            </linearGradient>
            <linearGradient id="xandeumGlow" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#00d9ff" stopOpacity="0.8" />
              <stop offset="100%" stopColor="#8b5cf6" stopOpacity="0.8" />
            </linearGradient>
            <filter id="glow">
              <feGaussianBlur stdDeviation="2" result="coloredBlur"/>
              <feMerge>
                <feMergeNode in="coloredBlur"/>
                <feMergeNode in="SourceGraphic"/>
              </feMerge>
            </filter>
          </defs>
          
          {/* Outer ring */}
          <motion.circle
            cx="32"
            cy="32"
            r="28"
            stroke="url(#xandeumGradient)"
            strokeWidth="2"
            fill="none"
            filter="url(#glow)"
            initial={animated ? { pathLength: 0, opacity: 0 } : {}}
            animate={animated ? { pathLength: 1, opacity: 1 } : {}}
            transition={{ duration: 1.5, ease: 'easeOut' }}
          />
          
          {/* Inner hexagon shape */}
          <motion.path
            d="M32 8L52 20V44L32 56L12 44V20L32 8Z"
            stroke="url(#xandeumGradient)"
            strokeWidth="2"
            fill="none"
            filter="url(#glow)"
            initial={animated ? { pathLength: 0, opacity: 0 } : {}}
            animate={animated ? { pathLength: 1, opacity: 1 } : {}}
            transition={{ duration: 1.2, delay: 0.3, ease: 'easeOut' }}
          />
          
          {/* X letter in center */}
          <motion.path
            d="M24 22L32 32L24 42M40 22L32 32L40 42"
            stroke="url(#xandeumGradient)"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="none"
            filter="url(#glow)"
            initial={animated ? { pathLength: 0, opacity: 0 } : {}}
            animate={animated ? { pathLength: 1, opacity: 1 } : {}}
            transition={{ duration: 0.8, delay: 0.6, ease: 'easeOut' }}
          />
          
          {/* Data nodes */}
          {[
            { cx: 32, cy: 8 },
            { cx: 52, cy: 20 },
            { cx: 52, cy: 44 },
            { cx: 32, cy: 56 },
            { cx: 12, cy: 44 },
            { cx: 12, cy: 20 },
          ].map((pos, i) => (
            <motion.circle
              key={i}
              cx={pos.cx}
              cy={pos.cy}
              r="3"
              fill="url(#xandeumGlow)"
              filter="url(#glow)"
              initial={animated ? { scale: 0, opacity: 0 } : {}}
              animate={animated ? { scale: 1, opacity: 1 } : {}}
              transition={{ 
                duration: 0.3, 
                delay: 0.8 + i * 0.1,
                ease: 'backOut'
              }}
            />
          ))}
        </svg>
      </motion.div>
      
      {showText && (
        <motion.div
          className="flex flex-col"
          initial={animated ? { opacity: 0, x: -10 } : {}}
          animate={animated ? { opacity: 1, x: 0 } : {}}
          transition={{ duration: 0.5, delay: 0.3 }}
        >
          <span className={`font-bold ${text} tracking-tight bg-gradient-to-r from-primary via-cyan-400 to-purple-500 bg-clip-text text-transparent`}>
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
        transition={{ duration: 60, repeat: Infinity, ease: 'linear' }}
      >
        <circle
          cx="32"
          cy="32"
          r="28"
          stroke="currentColor"
          strokeWidth="0.5"
          fill="none"
        />
        <path
          d="M32 8L52 20V44L32 56L12 44V20L32 8Z"
          stroke="currentColor"
          strokeWidth="0.5"
          fill="none"
        />
        <path
          d="M24 22L32 32L24 42M40 22L32 32L40 42"
          stroke="currentColor"
          strokeWidth="1"
          strokeLinecap="round"
          fill="none"
        />
      </motion.svg>
    </div>
  );
}

