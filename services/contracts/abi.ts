import { Contract, Interface, type Fragment, type Provider, type Signer } from "ethers";
import { getContractProvider } from "./provider";

export class AbiFetchError extends Error {
  constructor(message: string, public readonly cause?: unknown) {
    super(message);
    this.name = "AbiFetchError";
  }
}

export class AbiNotVerifiedError extends AbiFetchError {
  constructor(message = "This contract has not been verified. Its interface cannot be generated.") {
    super(message);
    this.name = "AbiNotVerifiedError";
  }
}

export class InvalidAbiError extends AbiFetchError {
  constructor(message = "The ABI returned by the provider is invalid.", cause?: unknown) {
    super(message, cause);
    this.name = "InvalidAbiError";
  }
}

export class AbiNetworkError extends AbiFetchError {
  constructor(message = "Unable to reach the ABI provider right now.", cause?: unknown) {
    super(message, cause);
    this.name = "AbiNetworkError";
  }
}

const abiCache = new Map<string, Array<unknown>>();

function normalizeAbiPayload(payload: unknown): Array<unknown> {
  if (Array.isArray(payload)) {
    return payload;
  }

  if (typeof payload === "string") {
    try {
      const parsed = JSON.parse(payload);
      return Array.isArray(parsed) ? parsed : [];
    } catch (cause) {
      throw new InvalidAbiError("ABI payload is not valid JSON.", cause);
    }
  }

  if (payload && typeof payload === "object") {
    const maybeAbi = (payload as { abi?: unknown }).abi;
    if (Array.isArray(maybeAbi)) {
      return maybeAbi;
    }
  }

  return [];
}

function pickAbiFromPayload(payload: unknown): Array<unknown> {
  if (Array.isArray(payload)) {
    return payload;
  }

  if (payload && typeof payload === "object") {
    const maybeAbi = (payload as { abi?: unknown }).abi;
    if (Array.isArray(maybeAbi)) {
      return maybeAbi;
    }

    const maybeMetadata = (payload as { metadata?: { output?: { abi?: unknown } } }).metadata;
    const metadataAbi = maybeMetadata?.output?.abi;
    if (Array.isArray(metadataAbi)) {
      return metadataAbi;
    }

    const nestedResult = (payload as { result?: unknown }).result;
    if (Array.isArray(nestedResult)) {
      return nestedResult;
    }

    if (nestedResult && typeof nestedResult === "object") {
      const nestedAbi = (nestedResult as { abi?: unknown }).abi;
      if (Array.isArray(nestedAbi)) {
        return nestedAbi;
      }
    }
  }

  return [];
}

async function fetchJson(url: string): Promise<unknown> {
  let response: Response;
  try {
    response = await fetch(url, { cache: "no-store" });
  } catch (cause) {
    throw new AbiNetworkError("Unable to reach the ABI provider.", cause);
  }

  if (!response.ok) {
    throw new AbiNetworkError(`ABI provider returned HTTP ${response.status}.`);
  }

  try {
    return await response.json();
  } catch (cause) {
    throw new InvalidAbiError("ABI provider returned invalid JSON.", cause);
  }
}

function getEtherscanApiUrl(chainId: number): string {
  const envUrl = process.env.NEXT_PUBLIC_ETHERSCAN_API_URL || process.env.ETHERSCAN_API_URL;

  if (typeof envUrl === "string" && envUrl.trim().length > 0) {
    return envUrl.replace(/\/$/, "");
  }

  const map: Record<number, string> = {
    1: "https://api.etherscan.io",
    5: "https://api-goerli.etherscan.io",
    11155111: "https://api-sepolia.etherscan.io",
    137: "https://api.polygonscan.com",
    80001: "https://api-testnet.polygonscan.com",
    10: "https://api-optimistic.etherscan.io",
    420: "https://api-goerli-optimistic.etherscan.io",
    42161: "https://api.arbiscan.io",
    421613: "https://api-testnet.arbiscan.io",
  };

  return map[chainId] ?? "https://api.etherscan.io";
}

async function trySourcify(address: string, chainId: number): Promise<Array<unknown>> {
  const response = await fetchJson(`https://sourcify.dev/server/contractsv2/lookup?address=${address}&chainId=${chainId}`);
  const abi = pickAbiFromPayload(response);

  if (!Array.isArray(abi) || abi.length === 0) {
    throw new AbiNotVerifiedError();
  }

  return abi;
}

async function tryEtherscan(address: string, chainId: number): Promise<Array<unknown>> {
  const apiKey = process.env.NEXT_PUBLIC_ETHERSCAN_API_KEY || process.env.ETHERSCAN_API_KEY || "YourApiKeyToken";
  const apiUrl = getEtherscanApiUrl(chainId);
  const response = await fetchJson(`${apiUrl}/api?module=contract&action=getabi&address=${address}&apikey=${apiKey}`);

  if (!response || typeof response !== "object") {
    throw new InvalidAbiError("Etherscan returned an unexpected response format.");
  }

  const status = String((response as { status?: unknown }).status ?? "");
  const result = (response as { result?: unknown }).result;

  if (status === "0") {
    const message = typeof result === "string" ? result : JSON.stringify(result);
    if (message.includes("Contract source code not verified")) {
      throw new AbiNotVerifiedError();
    }
    throw new InvalidAbiError(`Etherscan reported an ABI error: ${message}`);
  }

  const abi = normalizeAbiPayload(result);
  if (!Array.isArray(abi) || abi.length === 0) {
    throw new AbiNotVerifiedError();
  }

  return abi;
}

export async function fetchContractAbi(address: string): Promise<Array<unknown>> {
  const normalizedAddress = address.toLowerCase();
  const cached = abiCache.get(normalizedAddress);
  if (cached) {
    return cached;
  }

  const provider = getContractProvider();
  if (!provider) {
    throw new AbiNetworkError("No RPC provider is configured for ABI loading.");
  }

  const network = await provider.getNetwork();
  const chainId = Number(network.chainId ?? 1n);

  try {
    const abi = await trySourcify(address, chainId);
    abiCache.set(normalizedAddress, abi);
    return abi;
  } catch (error) {
    if (error instanceof AbiNotVerifiedError) {
      throw error;
    }

    try {
      const abi = await tryEtherscan(address, chainId);
      abiCache.set(normalizedAddress, abi);
      return abi;
    } catch (fallbackError) {
      if (fallbackError instanceof AbiNotVerifiedError) {
        throw fallbackError;
      }
      if (fallbackError instanceof AbiFetchError) {
        throw fallbackError;
      }
      throw new AbiNetworkError("Unable to reach the ABI provider right now.", fallbackError);
    }
  }
}

export function createContract(address: string, abi: unknown, signerOrProvider?: Signer | Provider | null) {
  const target = signerOrProvider ?? getContractProvider();
  if (!target) {
    return null;
  }

  try {
    return new Contract(address, abi as Interface | Array<string | Fragment>, target);
  } catch {
    return null;
  }
}

export function createContractInstance(address: string, abi: unknown, signerOrProvider?: Signer | Provider | null) {
  return createContract(address, abi, signerOrProvider);
}
