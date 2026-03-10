export const getStableId = (prefix: string, str: string) => {
  if (!str) return `${prefix}-${Math.random().toString(36).substr(2, 9)}`;
  const normalized = (str ?? "").toLowerCase().trim().replace(/\s+/g, ' ');
  let hash = 0;
  for (let i = 0; i < normalized.length; i++) {
    const char = normalized.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return `${prefix}-${Math.abs(hash).toString(36)}`;
};
