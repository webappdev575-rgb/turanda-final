/** Only allow paths on this site, including when the browser normalizes slashes. */
export function safeRedirect(value: string | null, fallback: string): string {
  if (!value || !value.startsWith('/') || /[\\\u0000-\u0020\u007f]/.test(value)) return fallback;
  try {
    const base = 'https://redirect.invalid';
    const url = new URL(value, base);
    return url.origin === base ? `${url.pathname}${url.search}${url.hash}` : fallback;
  } catch {
    return fallback;
  }
}
