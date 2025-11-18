/**
 * Format distance in meters to a human-readable string
 */
export function formatDistance(meters: number): string {
  if (meters < 1000) {
    return `${meters.toFixed(0)} m`;
  }
  return `${(meters / 1000).toFixed(2)} km`;
}

/**
 * Format timestamp to a human-readable string in local time
 * Handles both seconds and milliseconds timestamps
 * Shows relative time (e.g., "5 mins ago")
 */
export function formatTimestamp(timestamp: number): string {
  // Convert to milliseconds if timestamp is in seconds (< year 2100 in seconds)
  const timestampMs = timestamp < 10000000000 ? timestamp * 1000 : timestamp;
  
  const date = new Date(timestampMs);
  const now = Date.now();
  const diff = now - timestampMs;
  
  // Less than 1 minute
  if (diff < 60000) {
    return 'Just now';
  }
  
  // Less than 1 hour
  if (diff < 3600000) {
    const minutes = Math.floor(diff / 60000);
    return `${minutes} min${minutes !== 1 ? 's' : ''} ago`;
  }
  
  // Less than 24 hours
  if (diff < 86400000) {
    const hours = Math.floor(diff / 3600000);
    return `${hours} hour${hours !== 1 ? 's' : ''} ago`;
  }
  
  // Format as date and time in local timezone
  return date.toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
}

/**
 * Format timestamp to absolute time in local timezone
 * Handles both seconds and milliseconds timestamps
 * Always shows the actual date/time (e.g., "Nov 18, 2025 at 2:12 PM")
 */
export function formatAbsoluteTimestamp(timestamp: number): string {
  // Convert to milliseconds if timestamp is in seconds (< year 2100 in seconds)
  const timestampMs = timestamp < 10000000000 ? timestamp * 1000 : timestamp;
  
  const date = new Date(timestampMs);
  
  return date.toLocaleString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    second: '2-digit',
    hour12: true,
  });
}
