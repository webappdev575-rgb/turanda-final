
const ALLOWED_TAGS = new Set([
  'svg', 'path', 'g', 'rect', 'circle', 'ellipse', 'line', 'polyline',
  'polygon', 'defs', 'use', 'clippath', 'mask', 'lineargradient',
  'radialgradient', 'stop', 'text', 'tspan', 'title', 'desc',
]);

const ALLOWED_ATTRS = new Set([
  'xmlns', 'viewbox', 'width', 'height', 'fill', 'stroke', 'stroke-width',
  'stroke-linecap', 'stroke-linejoin', 'stroke-dasharray', 'stroke-dashoffset',
  'opacity', 'd', 'transform', 'cx', 'cy', 'r', 'rx', 'ry', 'x', 'y',
  'x1', 'y1', 'x2', 'y2', 'points', 'id', 'href', 'xlink:href',
  'gradienttransform', 'gradientunits', 'offset', 'stop-color',
  'stop-opacity', 'text-anchor', 'font-size', 'font-family', 'font-weight',
  'clip-path', 'mask', 'fill-rule', 'fill-opacity', 'class',
]);

export function sanitizeSvg(input: string): string {
  let cleaned = input.trim();

  if (!cleaned.startsWith('<svg')) {
    const match = cleaned.match(/<svg[\s\S]*<\/svg>/i);
    if (match) {
      cleaned = match[0];
    } else {
      cleaned = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24" fill="currentColor"><path d="M12 2L2 22h20L12 2z"/></svg>`;
      return cleaned;
    }
  }

  cleaned = cleaned.replace(/<\?xml[\s\S]*?\?>/gi, '');
  cleaned = cleaned.replace(/<!--[\s\S]*?-->/g, '');
  cleaned = cleaned.replace(/<!DOCTYPE[\s\S]*?>/gi, '');
  cleaned = cleaned.replace(/\son\w+\s*=\s*"[^"]*"/gi, '');
  cleaned = cleaned.replace(/\son\w+\s*=\s*'[^']*'/gi, '');
  cleaned = cleaned.replace(/<script[\s\S]*?<\/script>/gi, '');
  cleaned = cleaned.replace(/<style[\s\S]*?<\/style>/gi, '');
  cleaned = cleaned.replace(/javascript:/gi, '');

  return cleaned;
}

export function isValidSvg(input: string): boolean {
  const trimmed = input.trim();
  if (!trimmed) return false;
  if (!trimmed.includes('<svg')) return false;
  if (/<script|on\w+\s*=/i.test(trimmed)) return false;
  try {
    const parsed = new DOMParser().parseFromString(trimmed, 'image/svg+xml');
    const svgEl = parsed.querySelector('svg');
    return !!svgEl;
  } catch {
    return false;
  }
}
