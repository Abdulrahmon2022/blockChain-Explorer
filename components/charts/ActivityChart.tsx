"use client";

import React, { useState } from "react";
import { ChartPoint } from "@/types";

interface ActivityChartProps {
  data: ChartPoint[];
  title?: string;
  valueSuffix?: string;
}

export function ActivityChart({ data, title, valueSuffix = "" }: ActivityChartProps) {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  if (!data || data.length === 0) return null;

  // Chart layout specs
  const width = 500;
  const height = 180;
  const paddingLeft = 40;
  const paddingRight = 15;
  const paddingTop = 15;
  const paddingBottom = 25;

  const chartWidth = width - paddingLeft - paddingRight;
  const chartHeight = height - paddingTop - paddingBottom;

  const values = data.map((d) => d.value);
  const maxValue = Math.max(...values, 10) * 1.1; // 10% breathing room
  const minValue = Math.min(...values, 0);

  // Helper to map index and value to SVG coordinates
  const getX = (index: number) => {
    return paddingLeft + (index / (data.length - 1)) * chartWidth;
  };

  const getY = (val: number) => {
    const range = maxValue - minValue;
    if (range === 0) return paddingTop + chartHeight / 2;
    return paddingTop + chartHeight - ((val - minValue) / range) * chartHeight;
  };

  // Build path
  let pathD = "";
  let areaD = "";

  data.forEach((point, i) => {
    const x = getX(i);
    const y = getY(point.value);
    
    if (i === 0) {
      pathD = `M ${x} ${y}`;
      areaD = `M ${x} ${paddingTop + chartHeight} L ${x} ${y}`;
    } else {
      pathD += ` L ${x} ${y}`;
      areaD += ` L ${x} ${y}`;
    }

    if (i === data.length - 1) {
      areaD += ` L ${x} ${paddingTop + chartHeight} Z`;
    }
  });

  return (
    <div className="flex flex-col gap-3 w-full bg-bg-tertiary p-5 rounded-lg border border-border-default shadow-sm relative">
      {title && (
        <div className="flex items-center justify-between">
          <h4 className="text-xs font-bold text-text-tertiary uppercase tracking-wider">{title}</h4>
          {hoveredIndex !== null && (
            <span className="text-xs font-bold text-text-primary transition-all duration-150">
              {data[hoveredIndex].label}: {data[hoveredIndex].value} {valueSuffix}
            </span>
          )}
        </div>
      )}

      <div className="w-full overflow-hidden">
        <svg
          viewBox={`0 0 ${width} ${height}`}
          className="w-full h-auto overflow-visible select-none"
        >
          <defs>
            <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="var(--brand-primary)" stopOpacity="0.15" />
              <stop offset="100%" stopColor="var(--brand-primary)" stopOpacity="0.0" />
            </linearGradient>
          </defs>

          {/* Grid lines */}
          {Array.from({ length: 4 }).map((_, idx) => {
            const ratio = idx / 3;
            const y = paddingTop + ratio * chartHeight;
            const gridVal = maxValue - ratio * (maxValue - minValue);
            return (
              <g key={idx} className="opacity-40">
                <line
                  x1={paddingLeft}
                  y1={y}
                  x2={width - paddingRight}
                  y2={y}
                  stroke="currentColor"
                  strokeWidth="0.5"
                  strokeDasharray="4 4"
                  className="text-border-default"
                />
                <text
                  x={paddingLeft - 8}
                  y={y + 3}
                  textAnchor="end"
                  className="fill-text-tertiary text-[8px] font-mono"
                >
                  {Math.round(gridVal)}
                </text>
              </g>
            );
          })}

          {/* Area under the line */}
          <path d={areaD} fill="url(#chartGradient)" />

          {/* Line path */}
          <path
            d={pathD}
            fill="none"
            stroke="var(--brand-primary)"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* X Axis Labels */}
          {data.map((point, i) => {
            const x = getX(i);
            const isHovered = hoveredIndex === i;
            return (
              <g key={i} className="group">
                {/* Tick mark */}
                <line
                  x1={x}
                  y1={paddingTop + chartHeight}
                  x2={x}
                  y2={paddingTop + chartHeight + 4}
                  stroke="currentColor"
                  strokeWidth="1"
                  className="text-border-default"
                />
                
                {/* Date label */}
                <text
                  x={x}
                  y={paddingTop + chartHeight + 14}
                  textAnchor="middle"
                  className={`text-[8px] font-semibold transition-all ${
                    isHovered 
                      ? "fill-text-primary" 
                      : "fill-text-tertiary"
                  }`}
                >
                  {point.label}
                </text>

                {/* Hotspot overlay for hover selection */}
                <rect
                  x={x - (chartWidth / (data.length - 1)) / 2}
                  y={paddingTop}
                  width={chartWidth / (data.length - 1)}
                  height={chartHeight}
                  fill="transparent"
                  className="cursor-pointer"
                  onMouseEnter={() => setHoveredIndex(i)}
                  onMouseLeave={() => setHoveredIndex(null)}
                />

                {/* Point dot on hover */}
                {isHovered && (
                  <g>
                    <line
                      x1={x}
                      y1={paddingTop}
                      x2={x}
                      y2={paddingTop + chartHeight}
                      stroke="currentColor"
                      strokeWidth="0.5"
                      strokeDasharray="2 2"
                      className="text-text-tertiary pointer-events-none"
                    />
                    <circle
                      cx={x}
                      cy={getY(point.value)}
                      r="4"
                      fill="var(--brand-primary)"
                      className="stroke-bg-tertiary pointer-events-none"
                      strokeWidth="1.5"
                    />
                  </g>
                )}
              </g>
            );
          })}
        </svg>
      </div>
    </div>
  );
}
