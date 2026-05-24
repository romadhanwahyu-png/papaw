'use client';

import { useMemo, useState } from 'react';

interface TopicBubble {
  topic: string;
  count: number;
}

interface TopicMapProps {
  topics: TopicBubble[];
}

// Color palette for the bubble chart
const bubbleColors = [
  { bg: 'rgba(251,191,36,0.25)', border: 'rgba(251,191,36,0.5)', text: '#fde68a' },
  { bg: 'rgba(123,140,222,0.25)', border: 'rgba(123,140,222,0.5)', text: '#c7d2fe' },
  { bg: 'rgba(133,200,138,0.25)', border: 'rgba(133,200,138,0.5)', text: '#bbf7d0' },
  { bg: 'rgba(232,168,124,0.25)', border: 'rgba(232,168,124,0.5)', text: '#fed7aa' },
  { bg: 'rgba(246,185,59,0.25)', border: 'rgba(246,185,59,0.5)', text: '#fef08a' },
  { bg: 'rgba(167,139,250,0.25)', border: 'rgba(167,139,250,0.5)', text: '#ddd6fe' },
  { bg: 'rgba(251,146,60,0.25)', border: 'rgba(251,146,60,0.5)', text: '#fed7aa' },
  { bg: 'rgba(96,165,250,0.25)', border: 'rgba(96,165,250,0.5)', text: '#bfdbfe' },
];

// Simple circle-packing layout
function packCircles(
  topics: TopicBubble[],
  width: number,
  height: number
): { x: number; y: number; r: number; topic: string; count: number; colorIdx: number }[] {
  if (topics.length === 0) return [];

  const maxCount = Math.max(...topics.map((t) => t.count));
  const minCount = Math.min(...topics.map((t) => t.count));
  const range = maxCount - minCount || 1;

  const minR = 28;
  const maxR = 60;

  // Sort by count desc so largest circles are placed first
  const sorted = [...topics]
    .map((t, i) => ({ ...t, origIdx: i }))
    .sort((a, b) => b.count - a.count);

  const placed: { x: number; y: number; r: number; topic: string; count: number; colorIdx: number }[] = [];

  for (const item of sorted) {
    const normalized = (item.count - minCount) / range;
    const r = minR + normalized * (maxR - minR);
    const colorIdx = item.origIdx % bubbleColors.length;

    // Try to place without overlap
    let bestX = width / 2;
    let bestY = height / 2;
    let found = false;

    // Spiral outward from center
    for (let angle = 0; angle < 360 * 5; angle += 15) {
      const rad = (angle * Math.PI) / 180;
      const dist = 5 + angle * 0.35;
      const cx = width / 2 + Math.cos(rad) * dist;
      const cy = height / 2 + Math.sin(rad) * dist;

      // Check bounds
      if (cx - r < 0 || cx + r > width || cy - r < 0 || cy + r > height) continue;

      // Check overlaps
      let overlaps = false;
      for (const p of placed) {
        const dx = p.x - cx;
        const dy = p.y - cy;
        const minDist = p.r + r + 6; // 6px gap
        if (dx * dx + dy * dy < minDist * minDist) {
          overlaps = true;
          break;
        }
      }

      if (!overlaps) {
        bestX = cx;
        bestY = cy;
        found = true;
        break;
      }
    }

    if (!found) {
      // Fallback: random position
      bestX = r + Math.random() * (width - 2 * r);
      bestY = r + Math.random() * (height - 2 * r);
    }

    placed.push({ x: bestX, y: bestY, r, topic: item.topic, count: item.count, colorIdx });
  }

  return placed;
}

export function TopicMap({ topics }: TopicMapProps) {
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);

  const width = 480;
  const height = 320;

  const bubbles = useMemo(() => packCircles(topics, width, height), [topics]);

  if (topics.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 text-amber-200/30 text-sm">
        Belum ada topik yang dibicarakan
      </div>
    );
  }

  return (
    <div className="relative w-full overflow-hidden rounded-3xl bg-white/3 border border-white/5 p-2">
      <svg
        viewBox={`0 0 ${width} ${height}`}
        className="w-full h-auto"
        style={{ maxHeight: 360 }}
      >
        {bubbles.map((b, i) => {
          const color = bubbleColors[b.colorIdx];
          const isHovered = hoveredIdx === i;

          return (
            <g
              key={i}
              onMouseEnter={() => setHoveredIdx(i)}
              onMouseLeave={() => setHoveredIdx(null)}
              onTouchStart={() => setHoveredIdx(i)}
              onTouchEnd={() => setHoveredIdx(null)}
              style={{ cursor: 'pointer' }}
            >
              {/* Glow */}
              {isHovered && (
                <circle
                  cx={b.x}
                  cy={b.y}
                  r={b.r + 6}
                  fill={color.bg}
                  opacity={0.4}
                  className="transition-all duration-300"
                />
              )}

              {/* Circle */}
              <circle
                cx={b.x}
                cy={b.y}
                r={b.r}
                fill={color.bg}
                stroke={color.border}
                strokeWidth={isHovered ? 2 : 1}
                className="transition-all duration-300"
                style={{
                  transform: isHovered ? `scale(1.08)` : 'scale(1)',
                  transformOrigin: `${b.x}px ${b.y}px`,
                }}
              />

              {/* Topic text */}
              <text
                x={b.x}
                y={b.y - (isHovered ? 4 : 0)}
                textAnchor="middle"
                dominantBaseline="central"
                fill={color.text}
                fontSize={Math.max(9, Math.min(13, b.r * 0.35))}
                fontWeight="600"
                className="select-none pointer-events-none transition-all duration-300"
              >
                {b.topic.length > 12 ? b.topic.slice(0, 10) + '…' : b.topic}
              </text>

              {/* Count on hover */}
              {isHovered && (
                <text
                  x={b.x}
                  y={b.y + 14}
                  textAnchor="middle"
                  dominantBaseline="central"
                  fill={color.text}
                  fontSize="10"
                  fontWeight="500"
                  opacity={0.7}
                  className="select-none pointer-events-none"
                >
                  {b.count}× dibahas
                </text>
              )}
            </g>
          );
        })}
      </svg>
    </div>
  );
}
