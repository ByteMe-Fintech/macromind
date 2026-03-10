/**
 * Generates a stable ID from a string that is safe for Unicode characters.
 * Replaces the problematic btoa() which fails on non-Latin1 characters.
 */
export const getStableId = (prefix: string, str: string): string => {
  const normalized = str.toLowerCase().trim().replace(/\s+/g, ' ');
  let hash = 0;
  for (let i = 0; i < normalized.length; i++) {
    const char = normalized.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash |= 0; // Convert to 32bit integer
  }
  // Use base 36 for a compact, alphanumeric ID
  return `${prefix}-${Math.abs(hash).toString(36)}`;
};
