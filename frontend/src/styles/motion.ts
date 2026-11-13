import { Variants } from 'framer-motion';

/**
 * RoadGuard AI Motion Design Tokens
 * Recreated from aloud.sh reference inspection:
 * - Ease Swift: [0.16, 1, 0.3, 1] (Apple-style deceleration curve)
 * - Ease Spring: [0.34, 1.4, 0.64, 1] (Subtle damped spring)
 */

export const EASE_SWIFT = [0.16, 1, 0.3, 1] as const;
export const EASE_SPRING = [0.34, 1.4, 0.64, 1] as const;

// Micro-interaction button physics
export const buttonMotion = {
  whileHover: { scale: 1.02 },
  whileTap: { scale: 0.98 },
  transition: { duration: 0.18, ease: EASE_SWIFT },
};

// Section Header Entrance Variants
export const headerMotionVariants: Variants = {
  hidden: { opacity: 0, y: 22 },
  visible: (delay = 0) => ({
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.65,
      delay,
      ease: EASE_SWIFT,
    },
  }),
};

// Staggered Container
export const staggerContainer: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.08,
      delayChildren: 0.12,
    },
  },
};

// Staggered Card Item
export const staggerItem: Variants = {
  hidden: { opacity: 0, y: 18 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.55,
      ease: EASE_SWIFT,
    },
  },
};

// Main Studio / Window Showcase Reveal
export const windowReveal: Variants = {
  hidden: { opacity: 0, y: 32, scale: 0.98 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      duration: 0.75,
      delay: 0.15,
      ease: EASE_SWIFT,
    },
  },
};

// Modal Dialog Backdrop & Frame
export const modalBackdrop: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.25, ease: EASE_SWIFT } },
  exit: { opacity: 0, transition: { duration: 0.2, ease: EASE_SWIFT } },
};

export const modalFrame: Variants = {
  hidden: { opacity: 0, scale: 0.95, y: 16 },
  visible: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: { duration: 0.35, ease: EASE_SWIFT },
  },
  exit: {
    opacity: 0,
    scale: 0.95,
    y: 12,
    transition: { duration: 0.22, ease: EASE_SWIFT },
  },
};
