/**
 * Convert a Unix timestamp (seconds) to a standard Date object.
 */
export function fromUnixTimestamp(timestamp: number): Date {
  return new Date(timestamp * 1000);
}

/**
 * Format a Unix timestamp to a human-readable date.
 * Output: e.g., "Aug 07, 2026"
 */
export function formatDate(timestamp: number): string {
  const date = fromUnixTimestamp(timestamp);
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "2-digit",
    timeZone: "UTC",
  });
}

/**
 * Format a Unix timestamp to a UTC time.
 * Output: e.g., "09:17:15 AM +UTC"
 */
export function formatTime(timestamp: number): string {
  const date = fromUnixTimestamp(timestamp);
  return date.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
    timeZone: "UTC",
  }) + " +UTC";
}

/**
 * Format a Unix timestamp to full Date and Time in UTC.
 * Output: e.g., "Aug 07, 2026, 09:17:15 AM +UTC"
 */
export function formatDateTime(timestamp: number): string {
  return `${formatDate(timestamp)}, ${formatTime(timestamp)}`;
}

/**
 * Return relative time since a Unix timestamp (seconds).
 * Output: e.g. "just now", "12s ago", "3m ago", "2h ago", "5d ago"
 */
export function formatRelativeTime(timestamp: number): string {
  const now = Math.floor(Date.now() / 1000);
  const diff = now - timestamp;

  if (diff < 5) {
    return "just now";
  }
  if (diff < 60) {
    return `${diff} secs ago`;
  }

  const minutes = Math.floor(diff / 60);
  if (minutes < 60) {
    return `${minutes} min${minutes > 1 ? 's' : ''} ago`;
  }

  const hours = Math.floor(minutes / 60);
  if (hours < 24) {
    return `${hours} hr${hours > 1 ? 's' : ''} ago`;
  }

  const days = Math.floor(hours / 24);
  if (days < 30) {
    return `${days} day${days > 1 ? 's' : ''} ago`;
  }

  // Fallback to standard short format
  return formatDate(timestamp);
}

/**
 * Format a Unix timestamp as ISO-8601 string.
 */
export function formatISO(timestamp: number): string {
  return fromUnixTimestamp(timestamp).toISOString();
}
