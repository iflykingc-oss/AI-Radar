'use client';

import { motion, stagger, useAnimate } from 'framer-motion';
import { useEffect, useRef, useState, type ReactNode } from 'react';

interface StaggeredListProps {
  children: ReactNode[];
  staggerDelay?: number;
  initialDelay?: number;
  direction?: 'up' | 'down' | 'left' | 'right' | 'none';
  className?: string;
  as?: keyof JSX.IntrinsicElements;
  threshold?: number;
}

const directionOffsets: Record<string, { x: number; y: number }> = {
  up: { x: 0, y: 16 },
  down: { x: 0, y: -16 },
  left: { x: 16, y: 0 },
  right: { x: -16, y: 0 },
  none: { x: 0, y: 0 },
};

/**
 * StaggeredList animates child items with a staggered entrance effect.
 * Items fade in one by one with configurable delay between each.
 * Uses IntersectionObserver to trigger animation when the list enters the viewport.
 */
export function StaggeredList({
  children,
  staggerDelay = 0.05,
  initialDelay = 0,
  direction = 'up',
  className = '',
  as: Component = 'div',
  threshold = 0.1,
}: StaggeredListProps) {
  const [isVisible, setIsVisible] = useState(false);
  const containerRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      { threshold },
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [threshold]);

  const offset = directionOffsets[direction] || directionOffsets.up;

  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: staggerDelay,
        delayChildren: initialDelay,
      },
    },
  };

  const item = {
    hidden: { opacity: 0, x: offset.x, y: offset.y },
    show: {
      opacity: 1,
      x: 0,
      y: 0,
      transition: { duration: 0.4, ease: [0.25, 0.1, 0.25, 1] as const },
    },
  };

  return (
    <motion.div
      ref={containerRef as React.RefObject<HTMLDivElement>}
      variants={container}
      initial="hidden"
      animate={isVisible ? 'show' : 'hidden'}
      className={className}
    >
      {children.map((child, index) => (
        <motion.div key={index} variants={item}>
          {child}
        </motion.div>
      ))}
    </motion.div>
  );
}
