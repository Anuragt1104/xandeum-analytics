// Framer Motion Animation Variants and Utilities
// ================================================

import type { Variants, Transition } from 'framer-motion';

// Default spring configuration for smooth, natural motion
export const springConfig: Transition = {
  type: 'spring',
  stiffness: 300,
  damping: 30,
};

export const springBouncy: Transition = {
  type: 'spring',
  stiffness: 400,
  damping: 25,
};

export const springGentle: Transition = {
  type: 'spring',
  stiffness: 200,
  damping: 20,
};

// Easing presets (cubic bezier values)
export const easeOut: [number, number, number, number] = [0.16, 1, 0.3, 1];
export const easeInOut: [number, number, number, number] = [0.4, 0, 0.2, 1];

// ================================
// FADE VARIANTS
// ================================

export const fadeIn: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { duration: 0.4, ease: easeOut },
  },
  exit: {
    opacity: 0,
    transition: { duration: 0.2, ease: easeInOut },
  },
};

export const fadeInUp: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: easeOut },
  },
  exit: {
    opacity: 0,
    y: -10,
    transition: { duration: 0.2 },
  },
};

export const fadeInDown: Variants = {
  hidden: { opacity: 0, y: -20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: easeOut },
  },
};

export const fadeInLeft: Variants = {
  hidden: { opacity: 0, x: -20 },
  visible: {
    opacity: 1,
    x: 0,
    transition: { duration: 0.4, ease: easeOut },
  },
};

export const fadeInRight: Variants = {
  hidden: { opacity: 0, x: 20 },
  visible: {
    opacity: 1,
    x: 0,
    transition: { duration: 0.4, ease: easeOut },
  },
};

// ================================
// SCALE VARIANTS
// ================================

export const scaleIn: Variants = {
  hidden: { opacity: 0, scale: 0.9 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: springConfig,
  },
  exit: {
    opacity: 0,
    scale: 0.95,
    transition: { duration: 0.15 },
  },
};

export const scaleInBouncy: Variants = {
  hidden: { opacity: 0, scale: 0.8 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: springBouncy,
  },
};

export const popIn: Variants = {
  hidden: { opacity: 0, scale: 0.5 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: {
      type: 'spring',
      stiffness: 500,
      damping: 25,
    },
  },
};

// ================================
// STAGGER VARIANTS
// ================================

export const staggerContainer: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.08,
      delayChildren: 0.1,
    },
  },
};

export const staggerContainerFast: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.05,
      delayChildren: 0.05,
    },
  },
};

export const staggerContainerSlow: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.12,
      delayChildren: 0.2,
    },
  },
};

export const staggerItem: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.4, ease: easeOut },
  },
};

export const staggerItemScale: Variants = {
  hidden: { opacity: 0, scale: 0.9, y: 10 },
  visible: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: springConfig,
  },
};

// ================================
// SLIDE VARIANTS
// ================================

export const slideInLeft: Variants = {
  hidden: { x: '-100%', opacity: 0 },
  visible: {
    x: 0,
    opacity: 1,
    transition: { duration: 0.4, ease: easeOut },
  },
  exit: {
    x: '-100%',
    opacity: 0,
    transition: { duration: 0.3, ease: easeInOut },
  },
};

export const slideInRight: Variants = {
  hidden: { x: '100%', opacity: 0 },
  visible: {
    x: 0,
    opacity: 1,
    transition: { duration: 0.4, ease: easeOut },
  },
  exit: {
    x: '100%',
    opacity: 0,
    transition: { duration: 0.3, ease: easeInOut },
  },
};

export const slideInBottom: Variants = {
  hidden: { y: '100%', opacity: 0 },
  visible: {
    y: 0,
    opacity: 1,
    transition: { duration: 0.4, ease: easeOut },
  },
  exit: {
    y: '100%',
    opacity: 0,
    transition: { duration: 0.3, ease: easeInOut },
  },
};

// ================================
// HOVER & TAP VARIANTS
// ================================

export const hoverScale = {
  scale: 1.02,
  transition: { duration: 0.2 },
};

export const hoverLift = {
  y: -4,
  transition: { duration: 0.2 },
};

export const tapScale = {
  scale: 0.98,
};

export const hoverGlow = {
  boxShadow: '0 0 20px rgba(0, 217, 255, 0.3)',
  transition: { duration: 0.2 },
};

// ================================
// SPECIAL EFFECTS
// ================================

export const pulseGlow: Variants = {
  animate: {
    boxShadow: [
      '0 0 10px rgba(0, 217, 255, 0.3)',
      '0 0 30px rgba(0, 217, 255, 0.5)',
      '0 0 10px rgba(0, 217, 255, 0.3)',
    ],
    transition: {
      duration: 2,
      repeat: Infinity,
      ease: 'easeInOut',
    },
  },
};

export const floatAnimation: Variants = {
  animate: {
    y: [0, -10, 0],
    transition: {
      duration: 4,
      repeat: Infinity,
      ease: 'easeInOut',
    },
  },
};

export const rotateAnimation: Variants = {
  animate: {
    rotate: 360,
    transition: {
      duration: 20,
      repeat: Infinity,
      ease: 'linear',
    },
  },
};

// ================================
// TEXT REVEAL
// ================================

export const textReveal: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.03,
    },
  },
};

export const letterReveal: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.3, ease: easeOut },
  },
};

export const wordReveal: Variants = {
  hidden: { opacity: 0, y: 30, rotateX: -90 },
  visible: {
    opacity: 1,
    y: 0,
    rotateX: 0,
    transition: { duration: 0.5, ease: easeOut },
  },
};

// ================================
// PAGE TRANSITIONS
// ================================

export const pageTransition: Variants = {
  initial: { opacity: 0, y: 20 },
  animate: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.4, ease: easeOut },
  },
  exit: {
    opacity: 0,
    y: -10,
    transition: { duration: 0.2, ease: easeInOut },
  },
};

// ================================
// TABLE ROW VARIANTS
// ================================

export const tableRow: Variants = {
  hidden: { opacity: 0, x: -20 },
  visible: (i: number) => ({
    opacity: 1,
    x: 0,
    transition: {
      delay: i * 0.03,
      duration: 0.3,
      ease: easeOut,
    },
  }),
  exit: {
    opacity: 0,
    x: 20,
    transition: { duration: 0.2 },
  },
};

// ================================
// CARD VARIANTS
// ================================

export const cardVariants: Variants = {
  hidden: { opacity: 0, y: 20, scale: 0.95 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: springConfig,
  },
  hover: {
    y: -4,
    scale: 1.01,
    boxShadow: '0 20px 40px rgba(0, 0, 0, 0.2)',
    transition: { duration: 0.2 },
  },
  tap: {
    scale: 0.99,
  },
};

// ================================
// UTILITY FUNCTIONS
// ================================

export function createStaggerDelay(index: number, baseDelay = 0.05): number {
  return index * baseDelay;
}

export function createSpringTransition(
  stiffness = 300,
  damping = 30
): Transition {
  return {
    type: 'spring',
    stiffness,
    damping,
  };
}

