import DOMPurify from 'dompurify';

/** Sanitize at upload and render time; existing storage objects may be untrusted. */
export function sanitizeSvg(input: string): string {
  if (typeof window === 'undefined') return '';
  return DOMPurify.sanitize(input, {
    USE_PROFILES: { svg: true, svgFilters: true },
    FORBID_TAGS: ['style', 'foreignObject', 'a', 'image', 'use', 'animate', 'set'],
    FORBID_ATTR: ['style', 'href', 'xlink:href'],
  });
}

export function isValidSvg(input: string): boolean {
  if (typeof DOMParser === 'undefined' || !input.trim()) return false;
  const document = new DOMParser().parseFromString(input, 'image/svg+xml');
  return document.documentElement.localName === 'svg' && !document.querySelector('parsererror');
}
