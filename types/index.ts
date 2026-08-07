export interface Block {
  number: number;
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
  totalDifficulty: string;
  extraData: string;
  size: number;
  gasLimit: bigint;
  gasUsed: bigint;
  timestamp: number;
  transactionCount: number;
  baseFeePerGas?: bigint;
}

export type TransactionStatus = 'Success' | 'Failed' | 'Pending' | 'Dropped' | 'Reverted';

export interface Transaction {
  hash: string;
  nonce: number;
  blockHash?: string;
  blockNumber?: number;
  transactionIndex?: number;
  from: string;
  to?: string;
  value: bigint;
  gas: bigint;
  gasPrice: bigint;
  input: string;
  timestamp: number;
  status: TransactionStatus;
  type: number; // 0: Legacy, 1: EIP-2930, 2: EIP-1559
  maxFeePerGas?: bigint;
  maxPriorityFeePerGas?: bigint;
  gasUsed?: bigint;
  cumulativeGasUsed?: bigint;
  contractAddress?: string;
  logs?: Log[];
}

export interface Log {
  address: string;
  topics: string[];
  data: string;
  blockNumber: number;
  transactionHash: string;
  transactionIndex: number;
  logIndex: number;
}

export interface AddressInfo {
  address: string;
  balance: bigint;
  tokenBalance: bigint; // Total value in USD of tokens or equivalent
  isContract: boolean;
  contractCreator?: string;
  creatorTxHash?: string;
  ensName?: string;
}

export interface TokenInfo {
  address: string;
  name: string;
  symbol: string;
  decimals: number;
  totalSupply: bigint;
  holderCount: number;
  type: 'ERC-20' | 'ERC-721' | 'ERC-1155';
}

export interface TokenTransfer {
  transactionHash: string;
  blockNumber: number;
  timestamp: number;
  tokenAddress: string;
  tokenName: string;
  tokenSymbol: string;
  tokenDecimals: number;
  from: string;
  to: string;
  value?: bigint; // For ERC-20
  tokenId?: string; // For ERC-721/1155
  type: 'ERC-20' | 'ERC-721' | 'ERC-1155';
}

export interface Validator {
  address: string;
  name: string;
  totalProposed: number;
  slashed: boolean;
  active: boolean;
}

export interface GasData {
  gasPrice: bigint;
  baseFee: bigint;
  priorityFee: bigint;
  gasLimit: bigint;
  gasUsed: bigint;
}

export type SearchType = 'address' | 'transaction' | 'block' | 'token' | 'unknown';

export interface SearchResult {
  type: SearchType;
  query: string;
  redirectUrl?: string;
  isValid: boolean;
}

export interface Pagination {
  currentPage: number;
  pageSize: number;
  totalItems: number;
  totalPages: number;
}

export interface ApiResponse<T> {
  data: T;
  pagination?: Pagination;
  error?: string;
}

export interface ChartPoint {
  label: string;
  value: number;
}
