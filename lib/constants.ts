export const EXPLORER_NAME = "Tenski Scan";
export const BLOCK_TIME = 12; // average block time in seconds
export const DEFAULT_PAGE_SIZE = 10;

export const SUPPORTED_NETWORKS = [
  { id: "mainnet", name: "Ethereum Mainnet", isTestnet: false, currency: "ETH" },
  { id: "sepolia", name: "Sepolia Testnet", isTestnet: true, currency: "SEP" },
  { id: "holesky", name: "Holesky Testnet", isTestnet: true, currency: "HLK" },
];

export const NATIVE_CURRENCY = {
  name: "Ether",
  symbol: "ETH",
  decimals: 18,
};

export const TRANSACTION_TYPES: Record<number, string> = {
  0: "Legacy",
  1: "EIP-2930",
  2: "EIP-1559",
};
