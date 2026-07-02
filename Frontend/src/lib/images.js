const API_ORIGIN = (import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api').replace(/\/api\/?$/, '');

/** Resolve bannerUrl / img to a browser-loadable URL */
export function getEventImageUrl(eventOrUrl) {
  const url = typeof eventOrUrl === 'string'
    ? eventOrUrl
    : (eventOrUrl?.bannerUrl || eventOrUrl?.img || null);
  if (!url) return null;
  if (url.startsWith('http://') || url.startsWith('https://') || url.startsWith('data:')) return url;
  if (url.startsWith('/')) return `${API_ORIGIN}${url}`;
  return `${API_ORIGIN}/${url}`;
}
