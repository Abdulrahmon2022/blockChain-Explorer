import { type Contract as EthersContract, type ContractTransactionResponse, type Signer, type Provider } from "ethers";
import { createContract } from "./abi";
import { formatAbiValue } from "./parser";

export interface ContractCallResult {
  name: string;
  kind: "read" | "write";
  value: string;
  txHash?: string;
}

export async function executeReadMethod(contract: EthersContract | null, methodName: string, args: unknown[] = []): Promise<ContractCallResult> {
  if (!contract || typeof (contract as Record<string, unknown>)[methodName] !== "function") {
    throw new Error("Contract method is unavailable.");
  }

  const method = (contract as Record<string, unknown>)[methodName] as (...args: unknown[]) => Promise<unknown>;
  const value = await method(...args);

  return {
    name: methodName,
    kind: "read",
    value: formatAbiValue(value),
  };
}

export async function executeWriteMethod(contract: EthersContract | null, methodName: string, args: unknown[] = []): Promise<ContractCallResult> {
  if (!contract || typeof (contract as Record<string, unknown>)[methodName] !== "function") {
    throw new Error("Contract method is unavailable.");
  }

  const method = (contract as Record<string, unknown>)[methodName] as (...args: unknown[]) => Promise<ContractTransactionResponse>;
  const tx = await method(...args);

  return {
    name: methodName,
    kind: "write",
    value: "Broadcasted",
    txHash: tx.hash,
  };
}

export function createContractInstance(address: string, abi: unknown, signerOrProvider?: Signer | Provider | null) {
  return createContract(address, abi, signerOrProvider);
}
