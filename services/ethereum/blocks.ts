import type { ApiResponse, Block } from "@/types";
import type { Block as EthersBlock } from "ethers";
import { mockBlocks } from "../mockData";
import { getEthereumProvider } from "./provider";

function mapBlock(block: EthersBlock): Block {
  const rawBlock = block as unknown as Record<string, unknown>;
  const difficulty =
    typeof rawBlock.difficulty === "bigint"
      ? rawBlock.difficulty.toString()
      : typeof rawBlock.difficulty === "number"
        ? String(rawBlock.difficulty)
        : typeof rawBlock.difficulty === "string"
          ? rawBlock.difficulty
          : "0";

  const gasLimit = typeof rawBlock.gasLimit === "bigint" ? rawBlock.gasLimit : 0n;
  const gasUsed = typeof rawBlock.gasUsed === "bigint" ? rawBlock.gasUsed : 0n;
  const baseFeePerGas = typeof rawBlock.baseFeePerGas === "bigint" ? rawBlock.baseFeePerGas : undefined;
  const timestamp = typeof rawBlock.timestamp === "number" ? rawBlock.timestamp : Number(rawBlock.timestamp ?? 0);
  const transactionCount = Array.isArray(rawBlock.transactions) ? rawBlock.transactions.length : 0;

  return {
    number: block.number,
    hash: typeof rawBlock.hash === "string" ? rawBlock.hash : "",
    parentHash: typeof rawBlock.parentHash === "string" ? rawBlock.parentHash : "0x",
    nonce: typeof rawBlock.nonce === "string" ? rawBlock.nonce : "0x0",
    sha3Uncles: typeof rawBlock.sha3Uncles === "string" ? rawBlock.sha3Uncles : "0x",
    logsBloom: typeof rawBlock.logsBloom === "string" ? rawBlock.logsBloom : "0x",
    transactionsRoot: typeof rawBlock.transactionsRoot === "string" ? rawBlock.transactionsRoot : "0x",
    stateRoot: typeof rawBlock.stateRoot === "string" ? rawBlock.stateRoot : "0x",
    receiptsRoot: typeof rawBlock.receiptsRoot === "string" ? rawBlock.receiptsRoot : "0x",
    miner: typeof rawBlock.miner === "string" ? rawBlock.miner : "0x0000000000000000000000000000000000000000",
    difficulty,
    totalDifficulty: typeof rawBlock.totalDifficulty === "bigint" ? rawBlock.totalDifficulty.toString() : "0",
    extraData: typeof rawBlock.extraData === "string" ? rawBlock.extraData : "0x",
    size: typeof rawBlock.size === "number" ? rawBlock.size : 0,
    gasLimit,
    gasUsed,
    timestamp,
    transactionCount,
    baseFeePerGas,
  };
}

export async function getLatestBlocks(limit: number = 10): Promise<ApiResponse<Block[]>> {
  const provider = getEthereumProvider();

  if (!provider) {
    return { data: mockBlocks.slice(0, limit) };
  }

  try {
    const latestBlockNumber = await provider.getBlockNumber();
    const safeLimit = Math.max(1, Math.min(limit, 10));
    const blockNumbers = Array.from({ length: safeLimit }, (_, index) => latestBlockNumber - index);
    const blocks = await Promise.all(blockNumbers.map((number) => provider.getBlock(number)));
    const mappedBlocks = blocks.filter((block): block is EthersBlock => Boolean(block)).map(mapBlock);

    if (mappedBlocks.length > 0) {
      return { data: mappedBlocks };
    }
  } catch {
    // fall back to the bundled mock data when the provider is unavailable
  }

  return { data: mockBlocks.slice(0, limit) };
}

export async function getBlocks(page: number = 1, pageSize: number = 10): Promise<ApiResponse<Block[]>> {
  const provider = getEthereumProvider();

  if (!provider) {
    const startIndex = (page - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    return {
      data: mockBlocks.slice(startIndex, endIndex),
      pagination: {
        currentPage: page,
        pageSize,
        totalItems: mockBlocks.length,
        totalPages: Math.ceil(mockBlocks.length / pageSize),
      },
    };
  }

  try {
    const latestBlockNumber = await provider.getBlockNumber();
    const totalBlocks = Math.max(1, latestBlockNumber + 1);
    const startIndex = Math.max(0, totalBlocks - (page * pageSize));
    const blockNumbers = Array.from({ length: pageSize }, (_, index) => startIndex + index + 1).filter(
      (number) => number > 0 && number <= totalBlocks
    );
    const blocks = await Promise.all(blockNumbers.map((number) => provider.getBlock(number)));
    const mappedBlocks = blocks.filter((block): block is EthersBlock => Boolean(block)).map(mapBlock);

    if (mappedBlocks.length > 0) {
      return {
        data: mappedBlocks,
        pagination: {
          currentPage: page,
          pageSize,
          totalItems: totalBlocks,
          totalPages: Math.ceil(totalBlocks / pageSize),
        },
      };
    }
  } catch {
    // fall back to the bundled mock data when the provider is unavailable
  }

  const startIndex = (page - 1) * pageSize;
  const endIndex = startIndex + pageSize;

  return {
    data: mockBlocks.slice(startIndex, endIndex),
    pagination: {
      currentPage: page,
      pageSize,
      totalItems: mockBlocks.length,
      totalPages: Math.ceil(mockBlocks.length / pageSize),
    },
  };
}

export async function getBlock(id: string | number): Promise<ApiResponse<Block | null>> {
  const provider = getEthereumProvider();

  if (!provider) {
    const idStr = String(id).toLowerCase();
    const block = mockBlocks.find((candidate) => String(candidate.number) === idStr || candidate.hash.toLowerCase() === idStr);
    return { data: block || null };
  }

  try {
    const block = await provider.getBlock(id);
    return { data: block ? mapBlock(block) : null };
  } catch {
    const idStr = String(id).toLowerCase();
    const block = mockBlocks.find((candidate) => String(candidate.number) === idStr || candidate.hash.toLowerCase() === idStr);
    return { data: block || null };
  }
}
