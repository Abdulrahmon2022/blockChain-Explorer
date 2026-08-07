import { JsonRpcProvider, type Provider } from "ethers";

function getRpcUrl(): string | null {
  const candidates = [
    process.env.NEXT_PUBLIC_RPC_URL,
    process.env.VITE_RPC_URL,
    process.env.NEXT_PUBLIC_ETHEREUM_RPC_URL,
    process.env.ETHEREUM_RPC_URL,
  ].filter((value): value is string => Boolean(value));

  return candidates[0] ?? null;
}

let cachedProvider: JsonRpcProvider | null = null;

export function getEthereumProvider(): JsonRpcProvider | null {
  if (cachedProvider) {
    return cachedProvider;
  }

  const rpcUrl = getRpcUrl();
  if (!rpcUrl) {
    return null;
  }

  try {
    cachedProvider = new JsonRpcProvider(rpcUrl);
    return cachedProvider;
  } catch {
    return null;
  }
}

export async function withEthereumProvider<T>(
  callback: (provider: Provider) => Promise<T>
): Promise<T | null> {
  const provider = getEthereumProvider();
  if (!provider) {
    return null;
  }

  try {
    return await callback(provider);
  } catch {
    return null;
  }
}
