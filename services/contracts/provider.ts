import { type Provider } from "ethers";
import { getEthereumProvider } from "@/services/ethereum/provider";

export function getContractProvider(): Provider | null {
  return getEthereumProvider();
}
