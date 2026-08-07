import { formatNumber, weiToEth } from "./numbers";

/**
 * Calculates the percentage of gas used.
 */
export function getGasUsedPercentage(gasUsed: bigint | number, gasLimit: bigint | number): number {
  const used = typeof gasUsed === 'bigint' ? Number(gasUsed) : gasUsed;
  const limit = typeof gasLimit === 'bigint' ? Number(gasLimit) : gasLimit;
  if (!limit) return 0;
  return Math.round((used / limit) * 100);
}

/**
 * Formats a gas value.
 * Output: e.g. "21,000"
 */
export function formatGas(gas: bigint | number): string {
  return formatNumber(gas, 0);
}

/**
 * Formats gas fee estimate in ETH.
 */
export function formatGasFee(gasUsed: bigint, gasPrice: bigint): string {
  const feeWei = gasUsed * gasPrice;
  const ethValue = weiToEth(feeWei);
  return `${parseFloat(ethValue).toFixed(8)} ETH`;
}
