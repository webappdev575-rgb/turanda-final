/** Only allow navigation within this application after authentication. */
export function safeRedirectPath(value: string | null, fallback: string): string {
  if (!value || !value.startsWith('/') || value.startsWith('//') || /[\\\u0000-\u0020]/.test(value)) {
    return fallback;
  }
  return value;
}
