/**
 * Shorten an Ethereum-like hex address.
 * Output: e.g. "0x1234...abcd"
 */
export function shortenAddress(address: string, charsStart = 6, charsEnd = 4): string {
  if (!address) return "";
  if (address.length <= charsStart + charsEnd + 2) return address;
  return `${address.substring(0, charsStart)}...${address.substring(address.length - charsEnd)}`;
}

/**
 * Shorten a transaction hash, block hash, or any long hex string.
 */
export function shortenHash(hash: string, charsStart = 8, charsEnd = 6): string {
  if (!hash) return "";
  if (hash.length <= charsStart + charsEnd + 2) return hash;
  return `${hash.substring(0, charsStart)}...${hash.substring(hash.length - charsEnd)}`;
}

/**
 * Simple validation for Ethereum addresses (checks hex format, 0x prefix, length 42)
 */
export function isValidAddress(address: string): boolean {
  return /^0x[a-fA-F0-9]{40}$/.test(address);
}

/**
 * Simple validation for transaction or block hashes (checks hex format, 0x prefix, length 66)
 */
export function isValidHash(hash: string): boolean {
  return /^0x[a-fA-F0-9]{64}$/.test(hash);
}

/**
 * Check if the input is a valid decimal block number
 */
export function isValidBlockNumber(query: string): boolean {
  if (!/^\d+$/.test(query)) return false;
  const num = parseInt(query, 10);
  return num >= 0 && num < 1_000_000_000;
}

/**
 * Normalize an address to lower case or checksum format (standard lowercase for mock/basic check)
 */
export function normalizeAddress(address: string): string {
  return address.trim().toLowerCase();
}
