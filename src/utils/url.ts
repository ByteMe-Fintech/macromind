export const fixUrl = (_url: string | undefined, headline: string): string => {
  return `https://www.google.com/search?q=${encodeURIComponent(headline)}`;
};
