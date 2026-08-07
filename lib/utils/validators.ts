import { isValidAddress, isValidHash, isValidBlockNumber } from "./addresses";
import { SearchResult } from "@/types";

/**
 * Validates a search query and determines what type of blockchain object it is.
 */
export function validateSearchQuery(query: string): SearchResult {
  const cleanQuery = query.trim();
  
  if (!cleanQuery) {
    return { type: "unknown", query, isValid: false };
  }

  // Check Address
  if (isValidAddress(cleanQuery)) {
    return {
      type: "address",
      query: cleanQuery,
      redirectUrl: `/addresses/${cleanQuery}`,
      isValid: true
    };
  }

  // Check Tx Hash or Block Hash
  if (isValidHash(cleanQuery)) {
    // Usually standard explorers check address vs transaction vs block.
    // In our service layer we check transaction hashes or redirect to a multi-search,
    // but by default, 0x66-char hex queries are transactions or blocks.
    // We default to transaction hashes unless it's known as a block hash.
    // Let's assume it's a transaction query.
    return {
      type: "transaction",
      query: cleanQuery,
      redirectUrl: `/transactions/${cleanQuery}`,
      isValid: true
    };
  }

  // Check Block Number
  if (isValidBlockNumber(cleanQuery)) {
    return {
      type: "block",
      query: cleanQuery,
      redirectUrl: `/blocks/${cleanQuery}`,
      isValid: true
    };
  }

  // Custom name/token name search fallback
  if (/^[a-zA-Z0-9.-]+$/.test(cleanQuery)) {
    return {
      type: "token",
      query: cleanQuery,
      redirectUrl: `/search?q=${encodeURIComponent(cleanQuery)}`,
      isValid: true
    };
  }

  return { type: "unknown", query, isValid: false };
}
