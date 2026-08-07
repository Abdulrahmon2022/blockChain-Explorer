"use client";

import React, { useRef, useEffect, useState } from "react";
import { Search, X, CornerDownLeft, Clock, SearchIcon } from "lucide-react";
import { useSearch } from "@/hooks/useSearch";
import { Input } from "@/components/ui/Input";

export function GlobalSearch() {
  const { query, setQuery, recentSearches, clearRecentSearches, handleSearchSubmit } = useSearch();
  const [isFocused, setIsFocused] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Keyboard shortcut listener (⌘K or /)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        inputRef.current?.focus();
      } else if (e.key === "/" && document.activeElement !== inputRef.current && document.activeElement?.tagName !== "INPUT" && document.activeElement?.tagName !== "TEXTAREA") {
        e.preventDefault();
        inputRef.current?.focus();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Handle click outside dropdown to close it
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node) &&
        inputRef.current &&
        !inputRef.current.contains(e.target as Node)
      ) {
        setIsFocused(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (handleSearchSubmit(query)) {
      setIsFocused(false);
    }
  };

  const handleRecentClick = (val: string) => {
    setQuery(val);
    handleSearchSubmit(val);
    setIsFocused(false);
  };

  return (
    <div className="relative w-full max-w-lg">
      <form onSubmit={handleSubmit}>
        <Input
          ref={inputRef}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => setIsFocused(true)}
          placeholder="Search by Address / Txn Hash / Block"
          icon={<Search className="h-4 w-4 text-text-tertiary" />}
          className="border-border-strong"
          rightElement={
            <div className="flex items-center gap-1 shrink-0">
              {query && (
                <button
                  type="button"
                  onClick={() => setQuery("")}
                  className="p-0.5 text-text-tertiary hover:text-text-primary transition-colors"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
              <kbd className="hidden sm:inline-flex h-5 select-none items-center gap-0.5 rounded border border-border-default bg-bg-secondary px-1.5 font-mono text-[9px] font-bold text-text-tertiary">
                <span className="text-[10px]">⌘</span>K
              </kbd>
            </div>
          }
        />
      </form>

      {/* Suggestion / Recent search dropdown */}
      {isFocused && (recentSearches.length > 0 || query.trim().length > 0) && (
        <div
          ref={dropdownRef}
          className="absolute top-full left-0 right-0 z-50 mt-1.5 w-full rounded-lg border border-border-strong bg-bg-elevated p-2 shadow-lg animate-in fade-in slide-in-from-top-1 duration-150"
        >
          {query.trim().length > 0 && (
            <div className="p-2 border-b border-border-default/50">
              <button
                onClick={handleSubmit}
                className="flex items-center justify-between w-full text-left text-xs font-semibold text-text-primary p-1.5 rounded hover:bg-bg-secondary transition-all"
              >
                <div className="flex items-center gap-2">
                  <SearchIcon className="h-3.5 w-3.5 text-text-tertiary" />
                  <span>Search for &quot;{query}&quot;</span>
                </div>
                <CornerDownLeft className="h-3 w-3 text-text-tertiary" />
              </button>
            </div>
          )}

          {recentSearches.length > 0 && (
            <div className="p-2">
              <div className="flex items-center justify-between px-1 mb-1">
                <span className="text-[10px] font-bold text-text-tertiary uppercase tracking-wider">
                  Recent Searches
                </span>
                <button
                  type="button"
                  onClick={clearRecentSearches}
                  className="text-[10px] text-state-error hover:text-state-error/80 font-bold"
                >
                  Clear
                </button>
              </div>
              <div className="flex flex-col gap-0.5">
                {recentSearches.map((search, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handleRecentClick(search)}
                    className="flex items-center gap-2 w-full text-left text-xs text-text-secondary hover:text-text-primary p-1.5 rounded hover:bg-bg-secondary transition-all font-mono truncate"
                  >
                    <Clock className="h-3.5 w-3.5 text-text-tertiary shrink-0" />
                    <span className="truncate">{search}</span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
export default GlobalSearch;
