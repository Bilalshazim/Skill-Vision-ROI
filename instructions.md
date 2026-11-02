# Animation & Transition Standard Operating Procedures (ROI Engine)

This document defines the strict animation standards, Framer Motion presets, and performance rules for smooth, high-speed UI transitions across the Human Capital ROI Engine module.

---

## 1. Animation Core Presets

Use these exact animation configurations for consistent, snappy feedback across all UI components.

```typescript
import { Variants, Transition } from 'framer-motion';

/**
 * Ultra-Fast Tab Slider Spring Preset
 * Used for sliding background pill indicators on navigation/tab switches.
 */
export const SNAPPY_TAB_SPRING: Transition = {
  type: 'spring',
  stiffness: 600,
  damping: 35,
  mass: 0.5,
};

/**
 * Rapid Page/View Switch Motion Variants
 */
export const FAST_PAGE_VARIANTS: Variants = {
  initial: {
    opacity: 0,
    scale: 0.985,
    y: 4,
  },
  animate: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: {
      duration: 0.16,
      ease: [0.2, 0, 0, 1],
    },
  },
  exit: {
    opacity: 0,
    scale: 0.985,
    y: -4,
    transition: {
      duration: 0.12,
      ease: [0.4, 0, 1, 1],
    },
  },
};
```

---

## 2. Performance & Technical Rules

1. **GPU-Only Animation:**
   - **Allowed:** `transform` (`scale`, `translateX`, `translateY`, `rotate`) and `opacity`.
   - **Prohibited:** Direct animation of `width`, `height`, `margin`, `padding`, `top`, or `left`.
2. **Layout Shift (CLS) Prevention:**
   - Containers must maintain fixed or minimum heights during tab transitions.
3. **Accessibility:**
   - Always honor reduced motion preferences via CSS media queries:
     ```css
     @media (prefers-reduced-motion: reduce) {
       * {
         animation-duration: 0.01ms !important;
         transition-duration: 0.01ms !important;
       }
     }
     ```