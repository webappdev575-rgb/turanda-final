import DOMPurify from 'dompurify';

const FALLBACK_SVG = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24" fill="currentColor"><path d="M12 2L2 22h20L12 2z"/></svg>';

export function sanitizeSvg(input: string): string {
  // Custom icons are downloaded after mount. Fail closed if called without a DOM.
  if (typeof window === 'undefined') return FALLBACK_SVG;

  const cleaned = DOMPurify.sanitize(input, {
    USE_PROFILES: { svg: true, svgFilters: true },
    FORBID_TAGS: ['style', 'foreignObject', 'image', 'a'],
    FORBID_ATTR: ['style'],
  });
  const parsed = new DOMParser().parseFromString(cleaned, 'image/svg+xml');
  const root = parsed.documentElement;
  if (root.localName !== 'svg' || parsed.querySelector('parsererror')) return FALLBACK_SVG;

  // CSS presentation attributes can also load resources via url(...).
  for (const element of [root, ...Array.from(root.querySelectorAll('*'))]) {
    for (const attribute of Array.from(element.attributes)) {
      if ((attribute.localName === 'href' && !/^#[\w:.-]+$/.test(attribute.value)) ||
          /url\s*\(/i.test(attribute.value) && !/^url\(\s*['"]?#[\w:.-]+['"]?\s*\)$/i.test(attribute.value)) {
        element.removeAttribute(attribute.name);
      }
    }
  }
  return new XMLSerializer().serializeToString(root);
}

export function isValidSvg(input: string): boolean {
  if (!input.trim() || typeof DOMParser === 'undefined') return false;
  const parsed = new DOMParser().parseFromString(input.trim(), 'image/svg+xml');
  return parsed.documentElement.localName === 'svg' && !parsed.querySelector('parsererror');
}
