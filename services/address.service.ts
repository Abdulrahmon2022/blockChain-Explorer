import { AddressInfo, ApiResponse } from "@/types";
import { mockAddresses } from "./mockData";
import { isValidAddress } from "@/lib/utils/addresses";

export async function getAddress(address: string): Promise<ApiResponse<AddressInfo | null>> {
  await new Promise(resolve => setTimeout(resolve, 300));
  
  if (!isValidAddress(address)) {
    return { data: null, error: "Invalid Ethereum address format" };
  }

  const addrLower = address.toLowerCase();
  
  // Custom mock configuration for specific addresses
  const isContract = address.toLowerCase() === "0x2810c876e100053c3775b14429e2f9c1ccfb487a" || 
                     address.toLowerCase() === "0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2" || 
                     address.toLowerCase() === "0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48" ||
                     address.toLowerCase() === "0xdac17f958d2ee523a2206206994597c13d831ec7" ||
                     address.toLowerCase() === "0x7a250d5630b4cf539739df2c5dacb4c659f2488d" ||
                     address.toLowerCase() === "0xbc4caeda7647a8ab7c2061c2e118a18a936f13d";

  // Let's create a deterministic mock balance
  let sum = 0n;
  for (let i = 0; i < address.length; i++) {
    sum += BigInt(address.charCodeAt(i));
  }
  const balance = sum * 10n ** 14n; // e.g. ~1-10 ETH
  const tokenBalance = sum * 150n; // mock token valuation USD

  const info: AddressInfo = {
    address,
    balance,
    tokenBalance,
    isContract,
    contractCreator: isContract ? mockAddresses[0] : undefined,
    creatorTxHash: isContract ? "0xcc00000000000000000000000000000000000000000000000000000000000000" : undefined,
    ensName: address.toLowerCase() === mockAddresses[0].toLowerCase() ? "tenksi.eth" : undefined,
  };

  return { data: info };
}
