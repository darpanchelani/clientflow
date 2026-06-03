export const extractCursor = (url: string | null | undefined) => {
  if (!url) return null;

  try {
    return new URL(url).searchParams.get('cursor');
  } catch {
    return null;
  }
};

