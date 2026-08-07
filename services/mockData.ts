import {
  Block,
  Transaction,
  // AddressInfo,
  TokenInfo,
  TokenTransfer,
  Validator,
} from "@/types";

// Helper to generate mock hex hashes
function generateMockHash(prefix: string, index: number): string {
  const hex = "abcdef0123456789";
  let hash = prefix;
  for (let i = 0; i < 64 - prefix.length; i++) {
    const charIndex = (index + i * 7) % hex.length;
    hash += hex[charIndex];
  }
  return hash;
}

// Generate deterministic addresses
export const mockAddresses = [
  "0x71C7656EC7ab88b098defB751B7401B5f6d8976F", // Dev User
  "0x2810c876E100053C3775b14429E2F9c1cCFB487A", // Smart Contract 1
  "0xDECAF9CD2367cdbb726E904cD6397eDFcAe6068D", // Uniswap Router
  "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2", // WETH Contract
  "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48", // USDC Contract
  "0xdAC17F958D2ee523a2206206994597C13D831ec7", // USDT Contract
  "0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D", // Uniswap V2
  "0x0000000000000000000000000000000000000000", // Null address
  "0xe83Cdf9C46d7BE5dB8b456C65A162B172CE8B41e", // Validator 1
  "0x89D91eC8f6B58F72cfC38bC25DE83e29fD5c6975", // Validator 2
];

// Reusable tokens list
export const mockTokens: TokenInfo[] = [
  {
    address: "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2",
    name: "Wrapped Ether",
    symbol: "WETH",
    decimals: 18,
    totalSupply: 3200000000000000000000000n, // 3.2M WETH
    holderCount: 1245000,
    type: "ERC-20",
  },
  {
    address: "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",
    name: "USD Coin",
    symbol: "USDC",
    decimals: 6,
    totalSupply: 28500000000000000n, // 28.5B USDC
    holderCount: 2130000,
    type: "ERC-20",
  },
  {
    address: "0xdAC17F958D2ee523a2206206994597C13D831ec7",
    name: "Tether USD",
    symbol: "USDT",
    decimals: 6,
    totalSupply: 54000000000000000n, // 54B USDT
    holderCount: 4500000,
    type: "ERC-20",
  },
  {
    address: "0xBC4CA0EdA7647A8aB7C2061c2E118A18a936f13D",
    name: "Bored Ape Yacht Club",
    symbol: "BAYC",
    decimals: 0,
    totalSupply: 10000n,
    holderCount: 6400,
    type: "ERC-721",
  },
];

// Generate blocks and transactions
export const mockBlocks: Block[] = [];
export const mockTransactions: Transaction[] = [];
export const mockTokenTransfers: TokenTransfer[] = [];

const startBlock = 18472900;
const startTimestamp = Math.floor(Date.now() / 1000) - 1200; // ~20 minutes ago

for (let i = 0; i < 50; i++) {
  const blockNumber = startBlock + i;
  const blockHash = generateMockHash("0xbb", blockNumber);
  const parentHash =
    i === 0
      ? generateMockHash("0xbb", blockNumber - 1)
      : mockBlocks[i - 1].hash;
  const timestamp = startTimestamp + i * 12; // 12 second blocks
  const miner = mockAddresses[8 + (i % 2)]; // alternates validators

  const txCount = 5 + ((i * 7) % 25); // 5 to 29 txs per block
  const gasLimit = 30000000n;
  let totalGasUsed = 0n;

  // Create transactions for this block
  for (let t = 0; t < txCount; t++) {
    const txIndex = mockTransactions.length;
    const txHash = generateMockHash("0xcc", txIndex);
    const from = mockAddresses[txIndex % mockAddresses.length];

    // Choose a distinct to address
    let to: string | undefined =
      mockAddresses[(txIndex + 2) % mockAddresses.length];
    if (txIndex % 7 === 0) {
      // Contract creation
      to = undefined;
    }

    const value = BigInt((txIndex * 123456789) % 5000000000000000000); // 0 to 5 ETH
    const gas = 21000n + BigInt((txIndex * 1500) % 150000);
    const gasUsed = to === undefined ? (gas * 80n) / 100n : gas; // contract creations use slightly less than gas limit
    totalGasUsed += gasUsed;

    const baseFee = 25000000000n + BigInt((blockNumber % 20) * 1000000000); // ~25-45 Gwei
    const priorityFee =
      1500000000n + BigInt((txIndex * 100000000) % 3000000000); // ~1.5-4.5 Gwei
    const gasPrice = baseFee + priorityFee;

    const txStatus = txIndex % 19 === 0 ? "Failed" : "Success";

    const tx: Transaction = {
      hash: txHash,
      nonce: t,
      blockHash,
      blockNumber,
      transactionIndex: t,
      from,
      to,
      value,
      gas,
      gasPrice,
      input:
        to === undefined
          ? "0x608060405234801561001057600080fd5b50610c14806100206000396000f3fe608060405234801561001057600080fd5b506004361061002b57600035"
          : txIndex % 3 === 0
            ? "0xa9059cbb000000000000000000000000" +
              mockAddresses[(txIndex + 1) % mockAddresses.length]
                .substring(2)
                .padStart(64, "0")
            : "0x",
      timestamp,
      status: txStatus,
      type: txIndex % 3 === 0 ? 2 : txIndex % 5 === 0 ? 1 : 0,
      maxFeePerGas: baseFee * 2n + priorityFee,
      maxPriorityFeePerGas: priorityFee,
      gasUsed,
      cumulativeGasUsed: totalGasUsed,
      contractAddress: to === undefined ? mockAddresses[1] : undefined,
    };

    // If it's a ERC-20 transfer, create a Log & TokenTransfer
    if (txIndex % 3 === 0 && to !== undefined) {
      const token = mockTokens[txIndex % mockTokens.length];
      const transferValue = BigInt((txIndex * 987654) % 10000000);

      tx.logs = [
        {
          address: token.address,
          topics: [
            "0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef", // Transfer signature
            "0x" + from.substring(2).padStart(64, "0"),
            "0x" + to.substring(2).padStart(64, "0"),
          ],
          data: "0x" + transferValue.toString(16).padStart(64, "0"),
          blockNumber,
          transactionHash: txHash,
          transactionIndex: t,
          logIndex: 0,
        },
      ];

      mockTokenTransfers.push({
        transactionHash: txHash,
        blockNumber,
        timestamp,
        tokenAddress: token.address,
        tokenName: token.name,
        tokenSymbol: token.symbol,
        tokenDecimals: token.decimals,
        from,
        to,
        value:
          token.type === "ERC-20"
            ? transferValue *
              10n ** BigInt(token.decimals === 0 ? 1 : token.decimals - 2)
            : undefined,
        tokenId: token.type === "ERC-721" ? String(txIndex * 13) : undefined,
        type: token.type,
      });
    }

    mockTransactions.push(tx);
  }

  mockBlocks.push({
    number: blockNumber,
    hash: blockHash,
    parentHash,
    nonce: "0x0000000000000000",
    sha3Uncles:
      "0x1dcc4de8dec75d7aab85b567b6ccd41ad312451b948a7413f0a142fd40d49347",
    logsBloom: "0x000000000000...",
    transactionsRoot: generateMockHash("0xdd", blockNumber),
    stateRoot: generateMockHash("0xee", blockNumber),
    receiptsRoot: generateMockHash("0xff", blockNumber),
    miner,
    difficulty: "0",
    totalDifficulty: "58750003716598352816469",
    extraData:
      "0x476574682f76312e31302e31352d737461626c652f6c696e75782f676f312e31372e35",
    size: 45000 + ((blockNumber * 123) % 25000),
    gasLimit,
    gasUsed: totalGasUsed,
    timestamp,
    transactionCount: txCount,
    baseFeePerGas: 25000000000n + BigInt((blockNumber % 20) * 1000000000),
  });
}

// Reverse list so newest are first
mockBlocks.reverse();
mockTransactions.reverse();
mockTokenTransfers.reverse();

export const mockValidators: Validator[] = [
  {
    address: mockAddresses[8],
    name: "Lido: Validator 1",
    totalProposed: 12054,
    slashed: false,
    active: true,
  },
  {
    address: mockAddresses[9],
    name: "Coinbase: Validator 2",
    totalProposed: 9845,
    slashed: false,
    active: true,
  },
  {
    address: "0x002c918f1aef20092ab7168d1847bc18cc489e21",
    name: "Binance Pool 3",
    totalProposed: 4321,
    slashed: false,
    active: true,
  },
  {
    address: "0x981628172cde3281907cb3ccb83cc987bbcb3cc7",
    name: "Kiln 1",
    totalProposed: 2314,
    slashed: false,
    active: true,
  },
  {
    address: "0xbcda0c293cfeb38cc8fbc2e11894d8961726a117",
    name: "Solo Staker: 0xbcda",
    totalProposed: 450,
    slashed: false,
    active: true,
  },
];
