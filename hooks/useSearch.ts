import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { validateSearchQuery } from "@/lib/utils/validators";
import { useToastStore } from "@/stores/toastStore";

const RECENT_SEARCHES_KEY = "Tenski_scan_recent_searches";

export function useSearch() {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const addToast = useToastStore((state: any) => state.addToast);

 
  useEffect(() => {
    try {
      const saved = localStorage.getItem(RECENT_SEARCHES_KEY);
      if (saved) {
        setRecentSearches(JSON.parse(saved));
      }
    } catch (e) {
      console.error("Failed to read recent searches from localStorage", e);
    }
  }, []);

  const addRecentSearch = useCallback((searchQuery: string) => {
    const trimmed = searchQuery.trim();
    if (!trimmed) return;
    
    setRecentSearches((prev) => {
      const filtered = prev.filter((item) => item.toLowerCase() !== trimmed.toLowerCase());
      const next = [trimmed, ...filtered].slice(0, 5); // Keep last 5
      try {
        localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(next));
      } catch (e) {
        console.error("Failed to save recent searches", e);
      }
      return next;
    });
  }, []);

  const clearRecentSearches = useCallback(() => {
    setRecentSearches([]);
    try {
      localStorage.removeItem(RECENT_SEARCHES_KEY);
    } catch (e) {
      console.error("Failed to clear recent searches", e);
    }
  }, []);

  const handleSearchSubmit = useCallback((searchQuery: string) => {
    const trimmed = searchQuery.trim();
    if (!trimmed) return false;

    const validation = validateSearchQuery(trimmed);

    if (validation.isValid && validation.redirectUrl) {
      addRecentSearch(trimmed);
      router.push(validation.redirectUrl);
      return true;
    } else {
      addToast({
        type: "error",
        title: "Search Error",
        description: "Invalid format. Enter an address, transaction hash, block number, or token name.",
      });
      return false;
    }
  }, [addRecentSearch, router, addToast]);

  return {
    query,
    setQuery,
    recentSearches,
    addRecentSearch,
    clearRecentSearches,
    handleSearchSubmit,
  };
}
