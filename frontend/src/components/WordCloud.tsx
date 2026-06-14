'use client';

import { useMemo } from 'react';

interface WordCloudProps {
  words: Array<{ text: string; value: number }>;
  width?: number;
  height?: number;
  colors?: string[];
}

const DEFAULT_COLORS = [
  '#0ea5e9', // sky-500
  '#06b6d4', // cyan-500
  '#8b5cf6', // violet-500
  '#ec4899', // pink-500
  '#f59e0b', // amber-500
  '#10b981', // emerald-500
  '#6366f1', // indigo-500
  '#f97316', // orange-500
  '#14b8a6', // teal-500
  '#a855f7', // purple-500
];

interface PositionedWord {
  text: string;
  value: number;
  x: number;
  y: number;
  size: number;
  color: string;
  rotation: number;
}

function generateLayout(
  words: Array<{ text: string; value: number }>,
  width: number,
  height: number
): PositionedWord[] {
  if (words.length === 0) return [];

  const maxValue = Math.max(...words.map(w => w.value));
  const minValue = Math.min(...words.map(w => w.value));
  const range = maxValue - minValue || 1;

  // Sort by value descending
  const sorted = [...words].sort((a, b) => b.value - a.value);

  // Calculate font sizes (12px to 48px)
  const minSize = 12;
  const maxSize = Math.min(48, width / 8);

  const positioned: PositionedWord[] = [];
  const occupied: Array<{ x: number; y: number; width: number; height: number }> = [];

  // Simple spiral placement
  const centerX = width / 2;
  const centerY = height / 2;

  sorted.forEach((word, index) => {
    const normalizedValue = (word.value - minValue) / range;
    const size = minSize + normalizedValue * (maxSize - minSize);

    // Estimate text width
    const textWidth = word.text.length * size * 0.6;
    const textHeight = size * 1.4;

    // Spiral outward to find position
    let angle = 0;
    let radius = 0;
    let x = centerX;
    let y = centerY;
    let placed = false;
    const maxAttempts = 200;

    for (let i = 0; i < maxAttempts && !placed; i++) {
      x = centerX + radius * Math.cos(angle);
      y = centerY + radius * Math.sin(angle);

      // Check bounds
      const halfWidth = textWidth / 2;
      const halfHeight = textHeight / 2;

      if (
        x - halfWidth >= 0 &&
        x + halfWidth <= width &&
        y - halfHeight >= 0 &&
        y + halfHeight <= height
      ) {
        // Check overlap with existing words
        const overlaps = occupied.some(occ => {
          return (
            Math.abs(x - occ.x) < (halfWidth + occ.width / 2 + 4) &&
            Math.abs(y - occ.y) < (halfHeight + occ.height / 2 + 4)
          );
        });

        if (!overlaps) {
          placed = true;
        }
      }

      // Spiral outward
      angle += 0.5;
      radius += 2;
    }

    if (placed) {
      positioned.push({
        text: word.text,
        value: word.value,
        x,
        y,
        size,
        color: DEFAULT_COLORS[index % DEFAULT_COLORS.length],
        rotation: Math.random() > 0.7 ? -90 : 0,
      });

      occupied.push({
        x,
        y,
        width: textWidth,
        height: textHeight,
      });
    }
  });

  return positioned;
}

export default function WordCloud({ words, width = 600, height = 400, colors }: WordCloudProps) {
  const positionedWords = useMemo(
    () => generateLayout(words, width, height),
    [words, width, height]
  );

  if (words.length === 0) {
    return (
      <div
        style={{ width, height }}
        className="flex items-center justify-center text-muted-foreground"
      >
        No data available
      </div>
    );
  }

  return (
    <svg width={width} height={height} className="overflow-visible">
      {positionedWords.map((word, index) => (
        <text
          key={`${word.text}-${index}`}
          x={word.x}
          y={word.y}
          fontSize={word.size}
          fill={word.color}
          textAnchor="middle"
          dominantBaseline="middle"
          transform={`rotate(${word.rotation}, ${word.x}, ${word.y})`}
          className="cursor-pointer transition-opacity hover:opacity-80 select-none"
          style={{ fontFamily: 'Inter, system-ui, sans-serif', fontWeight: word.size > 24 ? 600 : 400 }}
        >
          {word.text}
        </text>
      ))}
    </svg>
  );
}
