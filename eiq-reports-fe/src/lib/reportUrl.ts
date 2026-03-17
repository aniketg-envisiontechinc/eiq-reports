/**
 * Encode a report URL to URL-safe base64 for use in query params.
 * Replaces + → -, / → _, removes = padding.
 */
export function encodeReportParam(url: string): string {
  return btoa(url).replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
}

/**
 * Decode a URL-safe base64 report param back to the original URL.
 * Returns null if the input is falsy or decoding fails.
 */
export function decodeReportParam(r: string | null | undefined): string | null {
  if (!r) return null;
  try {
    // Restore standard base64 from URL-safe variant, add padding
    const std = r.replace(/-/g, '+').replace(/_/g, '/');
    const padded = std + '=='.slice(0, (4 - (std.length % 4)) % 4);
    return atob(padded);
  } catch {
    return null;
  }
}
