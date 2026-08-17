/**
 * ETH/USD market data. Sepolia ETH itself is worthless, so this intentionally
 * reports the real mainnet ETH price as a market reference, sourced from
 * CoinGecko's free public API (no key required).
 */

export interface EthPrice {
  usd: number;
  usdMarketCap: number;
  usd24hChange: number;
}

const COINGECKO_URL =
  "https://api.coingecko.com/api/v3/simple/price" +
  "?ids=ethereum&vs_currencies=usd&include_market_cap=true&include_24hr_change=true";

const EMPTY_PRICE: EthPrice = { usd: 0, usdMarketCap: 0, usd24hChange: 0 };

// ------------------------------------------------------------- tiny TTL cache

let cachedPrice: { value: EthPrice; expires: number } | null = null;

export async function getEthPrice(): Promise<EthPrice> {
  if (cachedPrice && cachedPrice.expires > Date.now()) return cachedPrice.value;

  try {
    const res = await fetch(COINGECKO_URL, { cache: "no-store" });
    if (!res.ok) throw new Error(`CoinGecko HTTP ${res.status}`);

    const json = await res.json();
    const eth = json?.ethereum ?? {};

    const value: EthPrice = {
      usd: eth.usd ?? 0,
      usdMarketCap: eth.usd_market_cap ?? 0,
      usd24hChange: eth.usd_24h_change ?? 0,
    };

    cachedPrice = { value, expires: Date.now() + 60_000 };
    return value;
  } catch (error) {
    console.error("[price] CoinGecko fetch failed:", error);
    // Serve a stale value rather than nothing if we have one, so a transient
    // rate limit doesn't flash the UI back to zero.
    return cachedPrice?.value ?? EMPTY_PRICE;
  }
}
