/**
 * Safely converts a Wei amount (as BigInt or string representation) to ETH as a string.
 * Retains high precision and handles fractional parts correctly.
 */
export function weiToEth(wei: bigint | string | number): string {
  const weiBig = BigInt(wei.toString());
  const negative = weiBig < 0n;
  const absoluteWei = negative ? -weiBig : weiBig;

  const decimals = 18n;
  const divisor = 10n ** decimals;

  const integerPart = absoluteWei / divisor;
  const fractionalPart = absoluteWei % divisor;

  let fractionalStr = fractionalPart.toString().padStart(18, '0');
  // Trim trailing zeros
  fractionalStr = fractionalStr.replace(/0+$/, '');

  const result = fractionalStr.length > 0 
    ? `${integerPart}.${fractionalStr}` 
    : integerPart.toString();

  return negative ? `-${result}` : result;
}

/**
 * Safely converts an ETH amount (string) to Wei as a BigInt.
 */
export function ethToWei(eth: string | number): bigint {
  const ethStr = eth.toString().trim();
  if (!ethStr || ethStr === ".") return 0n;

  const parts = ethStr.split(".");
  const integerPart = parts[0] || "0";
  let fractionalPart = parts[1] || "";

  // Truncate to 18 decimals if longer
  if (fractionalPart.length > 18) {
    fractionalPart = fractionalPart.substring(0, 18);
  } else {
    fractionalPart = fractionalPart.padEnd(18, '0');
  }

  const integerWei = BigInt(integerPart) * 10n ** 18n;
  const fractionalWei = BigInt(fractionalPart);

  return integerWei + fractionalWei;
}

/**
 * Converts Wei to Gwei.
 */
export function weiToGwei(wei: bigint | string | number): string {
  const weiBig = BigInt(wei.toString());
  const divisor = 10n ** 9n;
  const integerPart = weiBig / divisor;
  const fractionalPart = weiBig % divisor;

  let fractionalStr = fractionalPart.toString().padStart(9, '0');
  fractionalStr = fractionalStr.replace(/0+$/, '');

  return fractionalStr.length > 0 
    ? `${integerPart}.${fractionalStr}` 
    : integerPart.toString();
}

/**
 * Converts Gwei to Wei.
 */
export function gweiToWei(gwei: string | number): bigint {
  const gweiStr = gwei.toString().trim();
  if (!gweiStr || gweiStr === ".") return 0n;

  const parts = gweiStr.split(".");
  const integerPart = parts[0] || "0";
  let fractionalPart = parts[1] || "";

  if (fractionalPart.length > 9) {
    fractionalPart = fractionalPart.substring(0, 9);
  } else {
    fractionalPart = fractionalPart.padEnd(9, '0');
  }

  const integerWei = BigInt(integerPart) * 10n ** 9n;
  const fractionalWei = BigInt(fractionalPart);

  return integerWei + fractionalWei;
}

/**
 * Standard number formatting with thousands separators and optional maximum fraction digits.
 */
export function formatNumber(num: number | string | bigint, maximumFractionDigits: number = 4): string {
  const parsed = typeof num === 'bigint' ? Number(num) : Number(num);
  if (isNaN(parsed)) return '0';
  
  return new Intl.NumberFormat('en-US', {
    maximumFractionDigits,
  }).format(parsed);
}

/**
 * Format numbers in a compact human-readable way (e.g. 1.2M, 45K)
 */
export function formatCompactNumber(num: number | string | bigint): string {
  const parsed = typeof num === 'bigint' ? Number(num) : Number(num);
  if (isNaN(parsed)) return '0';

  return new Intl.NumberFormat('en-US', {
    notation: 'compact',
    compactDisplay: 'short',
    maximumFractionDigits: 2,
  }).format(parsed);
}

/**
 * Format token amount based on decimals.
 */
export function formatTokenAmount(amount: bigint | string | number, decimals: number = 18, maximumFractionDigits: number = 4): string {
  const amtBig = BigInt(amount.toString());
  const divisor = 10n ** BigInt(decimals);

  const integerPart = amtBig / divisor;
  const fractionalPart = amtBig % divisor;

  let fractionalStr = fractionalPart.toString().padStart(decimals, '0');
  // Trim trailing zeros
  fractionalStr = fractionalStr.replace(/0+$/, '');

  if (fractionalStr.length > maximumFractionDigits) {
    fractionalStr = fractionalStr.substring(0, maximumFractionDigits);
    // Trim trailing zeros again
    fractionalStr = fractionalStr.replace(/0+$/, '');
  }

  if (fractionalStr.length > 0) {
    return `${formatNumber(integerPart, 0)}.${fractionalStr}`;
  }
  return formatNumber(integerPart, 0);
}

/**
 * Format native currency values (adds symbol and handles precision nicely)
 */
export function formatNativeCurrency(wei: bigint | string | number, symbol: string = "ETH"): string {
  const eth = weiToEth(wei);
  const parsed = parseFloat(eth);
  if (parsed === 0) return `0 ${symbol}`;
  
  // Choose format based on magnitude
  if (parsed < 0.0001) {
    return `< 0.0001 ${symbol}`;
  }
  
  const formatted = formatNumber(parsed, 6);
  return `${formatted} ${symbol}`;
}
