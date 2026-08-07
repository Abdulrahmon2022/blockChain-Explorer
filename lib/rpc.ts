import { ethers } from "ethers";
import {
  Block,
  Transaction,
  TransactionStatus,
  Log,
  AddressInfo,
  TokenInfo,
  TokenTransfer,
  ChartPoint,
} from "@/types";

/**
 * Data layer. Everything here talks to a Sepolia JSON-RPC node and returns the
 * shapes declared in `types/index.ts`. Nothing above this file should know that
 * an RPC endpoint exists.
 */

export const RPC_URL =
  process.env.SEPOLIA_RPC_URL ?? "https://ethereum-sepolia-rpc.publicnode.com";

/** How far back we are willing to walk when building "recent" lists. */
const MAX_BLOCK_SCAN = 20;

// ---------------------------------------------------------------- raw JSON-RPC

let rpcId = 0;

async function rpc<T>(method: string, params: unknown[] = []): Promise<T> {
  const res = await fetch(RPC_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ jsonrpc: "2.0", id: ++rpcId, method, params }),
    cache: "no-store",
  });

  if (!res.ok) {
    throw new Error(`RPC ${method} failed: HTTP ${res.status}`);
  }

  const json = await res.json();
  if (json.error) {
    throw new Error(`RPC ${method} failed: ${json.error.message}`);
  }
  return json.result as T;
}

const toNum = (hex: string | null | undefined): number =>
  hex == null ? 0 : Number(BigInt(hex));

const toBig = (hex: string | null | undefined): bigint =>
  hex == null ? 0n : BigInt(hex);

const toHex = (n: number | string): string =>
  typeof n === "number" ? "0x" + n.toString(16) : n;

// ------------------------------------------------------------- tiny TTL cache

const cache = new Map<string, { value: unknown; expires: number }>();

async function cached<T>(key: string, ttlMs: number, fn: () => Promise<T>): Promise<T> {
  const hit = cache.get(key);
  if (hit && hit.expires > Date.now()) return hit.value as T;

  const value = await fn();
  cache.set(key, { value, expires: Date.now() + ttlMs });
  return value;
}

// -------------------------------------------------------------------- mapping

interface RawBlock {
  number: string;
  hash: string;
  parentHash: string;
  nonce: string;
  sha3Uncles: string;
  logsBloom: string;
  transactionsRoot: string;
  stateRoot: string;
  receiptsRoot: string;
  miner: string;
  difficulty: string;
  totalDifficulty?: string;
  extraData: string;
  size: string;
  gasLimit: string;
  gasUsed: string;
  timestamp: string;
  baseFeePerGas?: string;
  transactions: (string | RawTransaction)[];
}

interface RawTransaction {
  hash: string;
  nonce: string;
  blockHash: string | null;
  blockNumber: string | null;
  transactionIndex: string | null;
  from: string;
  to: string | null;
  value: string;
  gas: string;
  gasPrice: string;
  input: string;
  type?: string;
  maxFeePerGas?: string;
  maxPriorityFeePerGas?: string;
}

interface RawReceipt {
  status: string;
  gasUsed: string;
  cumulativeGasUsed: string;
  contractAddress: string | null;
  logs: {
    address: string;
    topics: string[];
    data: string;
    blockNumber: string;
    transactionHash: string;
    transactionIndex: string;
    logIndex: string;
  }[];
}

/**
 * Accepts null so the miss check lives here rather than at each call site —
 * Turbopack has been observed constant-folding `if (!raw) return null` guards
 * away when they sit directly on an awaited `T | null`, which silently turns a
 * "block not found" into a crash.
 */
function mapBlock(raw: RawBlock | null | undefined): Block | null {
  if (raw === null || raw === undefined) return null;

  return {
    number: toNum(raw.number),
    hash: raw.hash,
    parentHash: raw.parentHash,
    nonce: raw.nonce,
    sha3Uncles: raw.sha3Uncles,
    logsBloom: raw.logsBloom,
    transactionsRoot: raw.transactionsRoot,
    stateRoot: raw.stateRoot,
    receiptsRoot: raw.receiptsRoot,
    miner: raw.miner,
    difficulty: toBig(raw.difficulty).toString(),
    totalDifficulty: toBig(raw.totalDifficulty).toString(),
    extraData: raw.extraData,
    size: toNum(raw.size),
    gasLimit: toBig(raw.gasLimit),
    gasUsed: toBig(raw.gasUsed),
    timestamp: toNum(raw.timestamp),
    transactionCount: raw.transactions.length,
    baseFeePerGas: raw.baseFeePerGas ? toBig(raw.baseFeePerGas) : undefined,
  };
}

function mapLogs(receipt: RawReceipt): Log[] {
  return receipt.logs.map((l) => ({
    address: l.address,
    topics: l.topics,
    data: l.data,
    blockNumber: toNum(l.blockNumber),
    transactionHash: l.transactionHash,
    transactionIndex: toNum(l.transactionIndex),
    logIndex: toNum(l.logIndex),
  }));
}

function mapTransaction(
  raw: RawTransaction,
  receipt: RawReceipt | null,
  timestamp: number,
): Transaction {
  let status: TransactionStatus = "Pending";
  if (receipt) status = toNum(receipt.status) === 1 ? "Success" : "Reverted";

  return {
    hash: raw.hash,
    nonce: toNum(raw.nonce),
    blockHash: raw.blockHash ?? undefined,
    blockNumber: raw.blockNumber ? toNum(raw.blockNumber) : undefined,
    transactionIndex: raw.transactionIndex ? toNum(raw.transactionIndex) : undefined,
    from: raw.from,
    to: raw.to ?? undefined,
    value: toBig(raw.value),
    gas: toBig(raw.gas),
    gasPrice: toBig(raw.gasPrice),
    input: raw.input,
    timestamp,
    status,
    type: toNum(raw.type),
    maxFeePerGas: raw.maxFeePerGas ? toBig(raw.maxFeePerGas) : undefined,
    maxPriorityFeePerGas: raw.maxPriorityFeePerGas
      ? toBig(raw.maxPriorityFeePerGas)
      : undefined,
    gasUsed: receipt ? toBig(receipt.gasUsed) : undefined,
    cumulativeGasUsed: receipt ? toBig(receipt.cumulativeGasUsed) : undefined,
    contractAddress: receipt?.contractAddress ?? undefined,
    logs: receipt ? mapLogs(receipt) : undefined,
  };
}

// --------------------------------------------------------------------- blocks

export async function getLatestBlockNumber(): Promise<number> {
  return cached("latestBlockNumber", 5_000, async () =>
    toNum(await rpc<string>("eth_blockNumber")),
  );
}

async function fetchRawBlock(
  id: string | number,
  includeTxs: boolean,
): Promise<RawBlock | null> {
  const isHash = typeof id === "string" && id.startsWith("0x") && id.length === 66;
  const method = isHash ? "eth_getBlockByHash" : "eth_getBlockByNumber";
  const param = isHash ? id : toHex(Number(id));
  return rpc<RawBlock | null>(method, [param, includeTxs]);
}

export async function getBlock(id: string | number): Promise<Block | null> {
  return cached(`block:${id}`, 30_000, async () => {
    return mapBlock(await fetchRawBlock(id, false));
  });
}

/**
 * Blocks descend from the chain head, so page 1 is the newest `pageSize` blocks.
 * `totalItems` is the head block number — close enough to a block count.
 */
export async function getBlocks(
  page: number,
  pageSize: number,
): Promise<{ blocks: Block[]; totalItems: number }> {
  const head = await getLatestBlockNumber();
  const start = head - (page - 1) * pageSize;

  const numbers: number[] = [];
  for (let n = start; n > start - pageSize && n >= 0; n--) numbers.push(n);

  const raws = await Promise.all(numbers.map((n) => fetchRawBlock(n, false)));
  return {
    blocks: raws.map((r) => mapBlock(r)).filter((b): b is Block => b !== null),
    totalItems: head,
  };
}

export async function getLatestBlocks(limit: number): Promise<Block[]> {
  const { blocks } = await getBlocks(1, limit);
  return blocks;
}

// --------------------------------------------------------------- transactions

export async function getTransaction(hash: string): Promise<Transaction | null> {
  return cached(`tx:${hash}`, 30_000, async () => {
    const raw = await rpc<RawTransaction | null>("eth_getTransactionByHash", [hash]);
    if (!raw) return null;

    const [receipt, block] = await Promise.all([
      rpc<RawReceipt | null>("eth_getTransactionReceipt", [hash]),
      raw.blockNumber ? fetchRawBlock(toNum(raw.blockNumber), false) : null,
    ]);

    return mapTransaction(raw, receipt, block ? toNum(block.timestamp) : 0);
  });
}

/**
 * Walks back from the chain head collecting transactions. There is no RPC method
 * for "all transactions", so deep pages are bounded by MAX_BLOCK_SCAN.
 */
async function collectRecentTransactions(needed: number): Promise<Transaction[]> {
  const head = await getLatestBlockNumber();
  const out: Transaction[] = [];

  for (let i = 0; i < MAX_BLOCK_SCAN && out.length < needed; i++) {
    const raw = await fetchRawBlock(head - i, true);
    if (!raw) continue;

    const timestamp = toNum(raw.timestamp);
    const txs = raw.transactions.filter(
      (t): t is RawTransaction => typeof t !== "string",
    );

    for (const tx of txs) {
      out.push(mapTransaction(tx, null, timestamp));
      if (out.length >= needed) break;
    }
  }

  return out;
}

/**
 * Attaches receipts to a small slice of transactions so status is accurate.
 * Without this a mined transaction reports "Pending", because status only
 * exists on the receipt and never on the transaction itself.
 */
export async function withReceipts(txs: Transaction[]): Promise<Transaction[]> {
  const receipts = await Promise.all(
    txs.map((t) =>
      rpc<RawReceipt | null>("eth_getTransactionReceipt", [t.hash]).catch(() => null),
    ),
  );

  return txs.map((t, i) => {
    const r = receipts[i];
    if (!r) return t;
    return {
      ...t,
      status: (toNum(r.status) === 1 ? "Success" : "Reverted") as TransactionStatus,
      gasUsed: toBig(r.gasUsed),
      cumulativeGasUsed: toBig(r.cumulativeGasUsed),
      contractAddress: r.contractAddress ?? undefined,
    };
  });
}

export async function getLatestTransactions(limit: number): Promise<Transaction[]> {
  return cached(`latestTxs:${limit}`, 10_000, async () =>
    withReceipts(await collectRecentTransactions(limit)),
  );
}

export async function getTransactions(
  page: number,
  pageSize: number,
): Promise<{ transactions: Transaction[]; totalItems: number }> {
  return cached(`txs:${page}:${pageSize}`, 10_000, async () => {
    const all = await collectRecentTransactions(page * pageSize);
    const slice = all.slice((page - 1) * pageSize, page * pageSize);
    return { transactions: await withReceipts(slice), totalItems: all.length };
  });
}

export async function getBlockTransactions(id: string | number): Promise<Transaction[]> {
  const raw = await fetchRawBlock(id, true);
  if (!raw) return [];

  const timestamp = toNum(raw.timestamp);
  const txs = raw.transactions.filter((t): t is RawTransaction => typeof t !== "string");
  return txs.map((t) => mapTransaction(t, null, timestamp));
}

// ------------------------------------------------------------------ addresses

export async function getAddressInfo(address: string): Promise<AddressInfo> {
  return cached(`addr:${address.toLowerCase()}`, 15_000, async () => {
    const [balance, code] = await Promise.all([
      rpc<string>("eth_getBalance", [address, "latest"]),
      rpc<string>("eth_getCode", [address, "latest"]),
    ]);

    return {
      address,
      balance: toBig(balance),
      // No pricing oracle on a testnet, so token valuation is not available.
      tokenBalance: 0n,
      isContract: code !== "0x" && code !== "0x0",
    };
  });
}

export async function getTransactionCount(address: string): Promise<number> {
  return toNum(await rpc<string>("eth_getTransactionCount", [address, "latest"]));
}

// --------------------------------------------------------------------- tokens

const ERC20_ABI = [
  "function name() view returns (string)",
  "function symbol() view returns (string)",
  "function decimals() view returns (uint8)",
  "function totalSupply() view returns (uint256)",
];

function provider() {
  return new ethers.JsonRpcProvider(RPC_URL, ethers.Network.from(11155111), {
    staticNetwork: true,
  });
}

export async function getToken(address: string): Promise<TokenInfo | null> {
  return cached(`token:${address.toLowerCase()}`, 60_000, async () => {
    try {
      const contract = new ethers.Contract(address, ERC20_ABI, provider());
      const [name, symbol, decimals, totalSupply] = await Promise.all([
        contract.name(),
        contract.symbol(),
        contract.decimals(),
        contract.totalSupply(),
      ]);

      return {
        address,
        name,
        symbol,
        decimals: Number(decimals),
        totalSupply: BigInt(totalSupply),
        // Holder counts require an index of transfer events, which we do not keep.
        holderCount: 0,
        type: "ERC-20" as const,
      };
    } catch {
      // Not an ERC-20, or the contract does not implement the metadata methods.
      return null;
    }
  });
}

// ----------------------------------------------------------- address activity

/**
 * There is no RPC method for "every transaction touching this address" — that
 * needs an index. We scan the most recent blocks and filter, so an address with
 * no activity in that window legitimately returns nothing.
 */
export async function getTransactionsForAddress(
  address: string,
  limit: number,
): Promise<Transaction[]> {
  return cached(`addrTxs:${address.toLowerCase()}:${limit}`, 15_000, async () => {
    const target = address.toLowerCase();
    const head = await getLatestBlockNumber();
    const out: Transaction[] = [];

    for (let i = 0; i < MAX_BLOCK_SCAN && out.length < limit; i++) {
      const raw = await fetchRawBlock(head - i, true);
      if (!raw) continue;

      const timestamp = toNum(raw.timestamp);
      const txs = raw.transactions.filter(
        (t): t is RawTransaction => typeof t !== "string",
      );

      for (const tx of txs) {
        if (tx.from.toLowerCase() === target || tx.to?.toLowerCase() === target) {
          out.push(mapTransaction(tx, null, timestamp));
          if (out.length >= limit) break;
        }
      }
    }

    return withReceipts(out);
  });
}

/** keccak256("Transfer(address,address,uint256)") */
const TRANSFER_TOPIC =
  "0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef";

/** How many blocks back to search for Transfer events. Public nodes cap ranges. */
const LOG_SCAN_RANGE = 1_000;

const padAddress = (address: string): string =>
  "0x" + address.slice(2).toLowerCase().padStart(64, "0");

const unpadAddress = (topic: string): string => "0x" + topic.slice(26);

interface RawLog {
  address: string;
  topics: string[];
  data: string;
  blockNumber: string;
  transactionHash: string;
}

/**
 * ERC-20 and ERC-721 share the Transfer signature. They differ by topic count:
 * a 721 indexes tokenId as a fourth topic, a 20 puts the amount in `data`.
 */
export async function getTokenTransfersForAddress(
  address: string,
  limit: number,
): Promise<TokenTransfer[]> {
  return cached(`transfers:${address.toLowerCase()}:${limit}`, 30_000, async () => {
    const head = await getLatestBlockNumber();
    const fromBlock = toHex(Math.max(0, head - LOG_SCAN_RANGE));
    const padded = padAddress(address);

    let logs: RawLog[];
    try {
      // One query for outgoing (indexed `from`), one for incoming (indexed `to`).
      const [sent, received] = await Promise.all([
        rpc<RawLog[]>("eth_getLogs", [
          { fromBlock, toBlock: "latest", topics: [TRANSFER_TOPIC, padded] },
        ]),
        rpc<RawLog[]>("eth_getLogs", [
          { fromBlock, toBlock: "latest", topics: [TRANSFER_TOPIC, null, padded] },
        ]),
      ]);
      logs = [...sent, ...received];
    } catch (error) {
      // Rate-limited public nodes commonly refuse address-less log filters or
      // wide ranges. Surface that instead of returning an empty list, which
      // would be indistinguishable from "this address has no transfers".
      const detail = error instanceof Error ? error.message : String(error);
      throw new Error(
        `Token transfers unavailable from this RPC endpoint (${detail}). ` +
          `Set SEPOLIA_RPC_URL to a provider that allows eth_getLogs, such as Alchemy or Infura.`,
      );
    }

    logs.sort((a, b) => toNum(b.blockNumber) - toNum(a.blockNumber));
    const slice = logs.slice(0, limit);

    // Block timestamps and token metadata are both heavily repeated — dedupe.
    const blockNumbers = [...new Set(slice.map((l) => toNum(l.blockNumber)))];
    const tokenAddresses = [...new Set(slice.map((l) => l.address.toLowerCase()))];

    const [blocks, tokens] = await Promise.all([
      Promise.all(blockNumbers.map((n) => fetchRawBlock(n, false))),
      Promise.all(tokenAddresses.map((a) => getToken(a).catch(() => null))),
    ]);

    const timestamps = new Map(
      blockNumbers.map((n, i) => [n, blocks[i] ? toNum(blocks[i]!.timestamp) : 0]),
    );
    const metadata = new Map(tokenAddresses.map((a, i) => [a, tokens[i]]));

    return slice.map((log): TokenTransfer => {
      const isErc721 = log.topics.length === 4;
      const token = metadata.get(log.address.toLowerCase());

      return {
        transactionHash: log.transactionHash,
        blockNumber: toNum(log.blockNumber),
        timestamp: timestamps.get(toNum(log.blockNumber)) ?? 0,
        tokenAddress: log.address,
        tokenName: token?.name ?? "Unknown Token",
        tokenSymbol: token?.symbol ?? "???",
        tokenDecimals: token?.decimals ?? 18,
        from: unpadAddress(log.topics[1]),
        to: unpadAddress(log.topics[2]),
        value: isErc721 ? undefined : toBig(log.data),
        tokenId: isErc721 ? toBig(log.topics[3]).toString() : undefined,
        type: isErc721 ? "ERC-721" : "ERC-20",
      };
    });
  });
}

// ---------------------------------------------------------------------- stats

export interface ChainStats {
  latestBlockNumber: number;
  gasPriceWei: bigint;
  blockTimeSec: number;
  tps: number;
  totalTransactions: number;
}

/**
 * A real series over the last N blocks. Daily aggregates would need an indexer,
 * so the x-axis is block numbers rather than dates.
 */
export async function getChartSeries(
  metric: "tps" | "gas" | "volume",
  points = 12,
): Promise<ChartPoint[]> {
  return cached(`chart:${metric}:${points}`, 30_000, async () => {
    const head = await getLatestBlockNumber();
    const raws = await Promise.all(
      Array.from({ length: points }, (_, i) => fetchRawBlock(head - i, false)),
    );

    const blocks = raws.filter((b): b is RawBlock => b !== null).reverse();

    return blocks.map((b, i): ChartPoint => {
      const label = `#${toNum(b.number)}`;

      if (metric === "gas") {
        const gwei = Number(toBig(b.baseFeePerGas)) / 1e9;
        return { label, value: Number(gwei.toFixed(4)) };
      }

      if (metric === "volume") {
        return { label, value: b.transactions.length };
      }

      // tps: transactions divided by the gap to the previous block
      const prev = blocks[i - 1];
      const gap = prev ? toNum(b.timestamp) - toNum(prev.timestamp) : 12;
      return {
        label,
        value: Number((b.transactions.length / (gap || 12)).toFixed(2)),
      };
    });
  });
}

export async function getChainStats(): Promise<ChainStats> {
  return cached("chainStats", 15_000, async () => {
    const head = await getLatestBlockNumber();

    const [gasPrice, ...recent] = await Promise.all([
      rpc<string>("eth_gasPrice"),
      ...[0, 1, 2, 3, 4].map((i) => fetchRawBlock(head - i, false)),
    ]);

    const blocks = recent.filter((b): b is RawBlock => b !== null);
    const txCount = blocks.reduce((sum, b) => sum + b.transactions.length, 0);

    let blockTimeSec = 12;
    if (blocks.length >= 2) {
      const newest = toNum(blocks[0].timestamp);
      const oldest = toNum(blocks[blocks.length - 1].timestamp);
      const span = newest - oldest;
      if (span > 0) blockTimeSec = span / (blocks.length - 1);
    }

    return {
      latestBlockNumber: head,
      gasPriceWei: toBig(gasPrice),
      blockTimeSec: Number(blockTimeSec.toFixed(1)),
      tps: Number((txCount / (blockTimeSec * blocks.length || 1)).toFixed(2)),
      totalTransactions: txCount,
    };
  });
}
