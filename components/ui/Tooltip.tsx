"use client";

import React, { useState } from "react";

interface TooltipProps {
  content: React.ReactNode;
  children: React.ReactNode;
  position?: "top" | "bottom" | "left" | "right";
}

export function Tooltip({ content, children, position = "top" }: TooltipProps) {
  const [isVisible, setIsVisible] = useState(false);

  const positionStyles = {
    top: "bottom-full left-1/2 -translate-x-1/2 mb-2",
    bottom: "top-full left-1/2 -translate-x-1/2 mt-2",
    left: "right-full top-1/2 -translate-y-1/2 mr-2",
    right: "left-full top-1/2 -translate-y-1/2 ml-2",
  };

  const arrowStyles = {
    top: "top-full left-1/2 -translate-x-1/2 -mt-1 border-t-zinc-900 dark:border-t-zinc-950",
    bottom: "bottom-full left-1/2 -translate-x-1/2 -mb-1 border-b-zinc-900 dark:border-b-zinc-950",
    left: "left-full top-1/2 -translate-y-1/2 -ml-1 border-l-zinc-900 dark:border-l-zinc-950",
    right: "right-full top-1/2 -translate-y-1/2 -mr-1 border-r-zinc-900 dark:border-r-zinc-950",
  };

  return (
    <div
      className="relative inline-flex"
      onMouseEnter={() => setIsVisible(true)}
      onMouseLeave={() => setIsVisible(false)}
      onFocus={() => setIsVisible(true)}
      onBlur={() => setIsVisible(false)}
    >
      {children}
      {isVisible && (
        <div
          role="tooltip"
          className={`absolute z-50 whitespace-nowrap rounded bg-zinc-900 px-2 py-1 text-xs text-white dark:bg-zinc-950 border border-zinc-800 shadow-md transition-opacity duration-150 ${positionStyles[position]}`}
        >
          {content}
          <div className={`absolute border-4 border-transparent ${arrowStyles[position]}`} />
        </div>
      )}
    </div>
  );
}
