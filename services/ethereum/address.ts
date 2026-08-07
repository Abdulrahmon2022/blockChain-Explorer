import type { ApiResponse, AddressInfo } from "@/types";
import { isValidAddress } from "@/lib/utils/addresses";
import { mockAddresses } from "../mockData";
import { getEthereumProvider } from "./provider";

function createFallbackAddressInfo(address: string): AddressInfo {
  const isContract = [
    "0x2810c876e100053c3775b14429e2f9c1ccfb487a",
    "0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2",
    "0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48",
    "0xdac17f958d2ee523a2206206994597c13d831ec7",
    "0x7a250d5630b4cf539739df2c5dacb4c659f2488d",
    "0xbc4caeda7647a8ab7c2061c2e118a18a936f13d",
  ].includes(address.toLowerCase());

  let sum = 0n;
  for (let index = 0; index < address.length; index += 1) {
    sum += BigInt(address.charCodeAt(index));
  }

  const balance = sum * 10n ** 14n;
  const tokenBalance = sum * 150n;

  return {
    address,
    balance,
    tokenBalance,
    isContract,
    contractCreator: isContract ? mockAddresses[0] : undefined,
    creatorTxHash: isContract ? "0xcc00000000000000000000000000000000000000000000000000000000000000" : undefined,
    ensName: address.toLowerCase() === mockAddresses[0].toLowerCase() ? "tenksi.eth" : undefined,
  };
}

export async function getAddressInfo(address: string): Promise<ApiResponse<AddressInfo | null>> {
  if (!isValidAddress(address)) {
    return { data: null, error: "Invalid Ethereum address format" };
  }

  const provider = getEthereumProvider();

  if (!provider) {
    return { data: createFallbackAddressInfo(address) };
  }

  try {
    const [balance, code] = await Promise.all([provider.getBalance(address), provider.getCode(address)]);
    const isContract = code !== "0x";
    const tokenBalance = balance / 10n ** 12n + 1_000_000n;

    return {
      data: {
        address,
        balance,
        tokenBalance,
        isContract,
        contractCreator: isContract ? mockAddresses[0] : undefined,
        creatorTxHash: isContract ? "0xcc00000000000000000000000000000000000000000000000000000000000000" : undefined,
      },
    };
  } catch {
    return { data: createFallbackAddressInfo(address) };
  }
}
