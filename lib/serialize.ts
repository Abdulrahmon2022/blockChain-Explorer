/**
 * JSON has no bigint. `JSON.stringify` throws on one and `JSON.parse` can never
 * produce one, but `types/index.ts` declares wei and gas fields as bigint — so
 * every value crossing the API boundary is a string on the wire and a bigint on
 * both ends.
 *
 * `toJson` runs in route handlers, `reviveBigInts` runs in the services.
 */

/** Every bigint-typed field name in `types/index.ts`. */
const BIGINT_FIELDS = new Set([
  "gasLimit",
  "gasUsed",
  "baseFeePerGas",
  "baseFee",
  "priorityFee",
  "value",
  "gas",
  "gasPrice",
  "gasPriceWei",
  "maxFeePerGas",
  "maxPriorityFeePerGas",
  "cumulativeGasUsed",
  "balance",
  "tokenBalance",
  "totalSupply",
]);

/** Recursively replaces bigints with strings so a value can be JSON-encoded. */
export function toJson<T>(value: T): unknown {
  if (typeof value === "bigint") return value.toString();
  if (Array.isArray(value)) return value.map(toJson);

  if (value !== null && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>).map(([k, v]) => [k, toJson(v)]),
    );
  }

  return value;
}

/**
 * Restores bigints after `JSON.parse`, keyed on field name.
 *
 * The `typeof === "string"` guard matters: `ChartPoint.value` is a number, and
 * without it that field would be corrupted by sharing a name with `Transaction.value`.
 */
export function reviveBigInts<T>(value: unknown): T {
  if (Array.isArray(value)) return value.map((v) => reviveBigInts(v)) as T;

  if (value !== null && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>).map(([k, v]) => {
        if (BIGINT_FIELDS.has(k) && typeof v === "string") return [k, BigInt(v)];
        return [k, reviveBigInts(v)];
      }),
    ) as T;
  }

  return value as T;
}
