import type { ApiResponse, Transaction, TransactionStatus } from "@/types";
import type { TransactionReceipt, TransactionResponse, Block as EthersBlock } from "ethers";
import { mockTransactions } from "../mockData";
import { getEthereumProvider } from "./provider";

function mapTransaction(
  tx: TransactionResponse,
  receipt: TransactionReceipt | null,
  timestamp: number,
): Transaction {
  const status: TransactionStatus = receipt?.status === 1 ? "Success" : receipt?.status === 0 ? "Failed" : "Pending";

  return {
    hash: tx.hash,
    nonce: tx.nonce,
    blockHash: tx.blockHash ?? undefined,
    blockNumber: tx.blockNumber ?? undefined,
    transactionIndex: tx.index ?? undefined,
    from: tx.from,
    to: tx.to ?? undefined,
    value: tx.value,
    gas: tx.gasLimit,
    gasPrice: tx.gasPrice ?? 0n,
    input: tx.data,
    timestamp,
    status,
    type: tx.type ?? 0,
    maxFeePerGas: tx.maxFeePerGas ?? undefined,
    maxPriorityFeePerGas: tx.maxPriorityFeePerGas ?? undefined,
    gasUsed: receipt?.gasUsed ?? undefined,
    cumulativeGasUsed: receipt?.cumulativeGasUsed ?? undefined,
    contractAddress: receipt?.contractAddress ?? undefined,
  };
}

export async function getLatestTransactions(limit: number = 10): Promise<ApiResponse<Transaction[]>> {
  const provider = getEthereumProvider();

  if (!provider) {
    return { data: mockTransactions.slice(0, limit) };
  }

  try {
    const latestBlockNumber = await provider.getBlockNumber();
    const block = await provider.getBlock(latestBlockNumber, true);
    const transactions = Array.isArray(block?.transactions) ? block.transactions : [];
    const safeLimit = Math.max(1, Math.min(limit, 10));
    const mappedTransactions = await Promise.all(
      transactions.slice(0, safeLimit).map(async (transaction) => {
        const receipt = await provider.getTransactionReceipt(transaction.hash);
        const timestamp = block?.timestamp ? Number(block.timestamp) : Math.floor(Date.now() / 1000);
        return mapTransaction(transaction as TransactionResponse, receipt, timestamp);
      })
    );

    if (mappedTransactions.length > 0) {
      return { data: mappedTransactions };
    }
  } catch {
    // fall back to the bundled mock data when the provider is unavailable
  }

  return { data: mockTransactions.slice(0, limit) };
}

export async function getTransactions(page: number = 1, pageSize: number = 10): Promise<ApiResponse<Transaction[]>> {
  const provider = getEthereumProvider();

  if (!provider) {
    const startIndex = (page - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    return {
      data: mockTransactions.slice(startIndex, endIndex),
      pagination: {
        currentPage: page,
        pageSize,
        totalItems: mockTransactions.length,
        totalPages: Math.ceil(mockTransactions.length / pageSize),
      },
    };
  }

  try {
    const latestBlockNumber = await provider.getBlockNumber();
    const block = await provider.getBlock(latestBlockNumber, true);
    const transactions = Array.isArray(block?.transactions) ? block.transactions : [];
    const startIndex = (page - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    const mappedTransactions = await Promise.all(
      transactions.slice(startIndex, endIndex).map(async (transaction) => {
        const receipt = await provider.getTransactionReceipt(transaction.hash);
        const timestamp = block?.timestamp ? Number(block.timestamp) : Math.floor(Date.now() / 1000);
        return mapTransaction(transaction as TransactionResponse, receipt, timestamp);
      })
    );

    if (mappedTransactions.length > 0) {
      return {
        data: mappedTransactions,
        pagination: {
          currentPage: page,
          pageSize,
          totalItems: transactions.length,
          totalPages: Math.ceil(transactions.length / pageSize),
        },
      };
    }
  } catch {
    // fall back to the bundled mock data when the provider is unavailable
  }

  const startIndex = (page - 1) * pageSize;
  const endIndex = startIndex + pageSize;

  return {
    data: mockTransactions.slice(startIndex, endIndex),
    pagination: {
      currentPage: page,
      pageSize,
      totalItems: mockTransactions.length,
      totalPages: Math.ceil(mockTransactions.length / pageSize),
    },
  };
}

export async function getTransaction(hash: string): Promise<ApiResponse<Transaction | null>> {
  const provider = getEthereumProvider();

  if (!provider) {
    const tx = mockTransactions.find((candidate) => candidate.hash.toLowerCase() === hash.toLowerCase());
    return { data: tx || null };
  }

  try {
    const tx = await provider.getTransaction(hash);
    if (!tx) {
      const mockTx = mockTransactions.find((candidate) => candidate.hash.toLowerCase() === hash.toLowerCase());
      return { data: mockTx || null };
    }

    const receipt = await provider.getTransactionReceipt(hash);
    const block = tx.blockNumber ? await provider.getBlock(tx.blockNumber) : null;
    return {
      data: mapTransaction(tx, receipt, block?.timestamp ? Number(block.timestamp) : Math.floor(Date.now() / 1000)),
    };
  } catch {
    const tx = mockTransactions.find((candidate) => candidate.hash.toLowerCase() === hash.toLowerCase());
    return { data: tx || null };
  }
}

export async function getTransactionsByAddress(
  address: string,
  page: number = 1,
  pageSize: number = 10,
): Promise<ApiResponse<Transaction[]>> {
  const provider = getEthereumProvider();

  if (!provider) {
    const addrLower = address.toLowerCase();
    const filtered = mockTransactions.filter((transaction) => transaction.from.toLowerCase() === addrLower || transaction.to?.toLowerCase() === addrLower);
    const startIndex = (page - 1) * pageSize;
    const endIndex = startIndex + pageSize;

    return {
      data: filtered.slice(startIndex, endIndex),
      pagination: {
        currentPage: page,
        pageSize,
        totalItems: filtered.length,
        totalPages: Math.ceil(filtered.length / pageSize),
      },
    };
  }

  try {
    const latestBlockNumber = await provider.getBlockNumber();
    const block = await provider.getBlock(latestBlockNumber, true);
    const transactions = Array.isArray(block?.transactions) ? block.transactions : [];
    const addrLower = address.toLowerCase();
    const filteredTransactions = transactions.filter((transaction) => {
      const from = transaction.from.toLowerCase();
      const to = transaction.to?.toLowerCase();
      return from === addrLower || to === addrLower;
    });

    const startIndex = (page - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    const mappedTransactions = await Promise.all(
      filteredTransactions.slice(startIndex, endIndex).map(async (transaction) => {
        const receipt = await provider.getTransactionReceipt(transaction.hash);
        const timestamp = block?.timestamp ? Number(block.timestamp) : Math.floor(Date.now() / 1000);
        return mapTransaction(transaction as TransactionResponse, receipt, timestamp);
      })
    );

    if (mappedTransactions.length > 0 || filteredTransactions.length > 0) {
      return {
        data: mappedTransactions,
        pagination: {
          currentPage: page,
          pageSize,
          totalItems: filteredTransactions.length,
          totalPages: Math.ceil(filteredTransactions.length / pageSize),
        },
      };
    }
  } catch {
    // fall back to the bundled mock data when the provider is unavailable
  }

  const addrLower = address.toLowerCase();
  const filtered = mockTransactions.filter((transaction) => transaction.from.toLowerCase() === addrLower || transaction.to?.toLowerCase() === addrLower);
  const startIndex = (page - 1) * pageSize;
  const endIndex = startIndex + pageSize;

  return {
    data: filtered.slice(startIndex, endIndex),
    pagination: {
      currentPage: page,
      pageSize,
      totalItems: filtered.length,
      totalPages: Math.ceil(filtered.length / pageSize),
    },
  };
}
