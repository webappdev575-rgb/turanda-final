import type { MetadataRoute } from 'next';

export const dynamic = 'force-static';

// Canonical domain comes from NEXT_PUBLIC_SITE_URL (see DEPLOYMENT_GUIDE.md).
export const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL ?? 'https://www.turanda.com').replace(/\/+$/, '');

const STATIC_ROUTES = [
  '',
  '/jobs',
  '/piyasalar',
  '/commodities',
  '/akademi',
  '/hizmetler',
  '/haberler',
  '/dashboard',
  '/employer',
  '/contact',
  '/advertise',
  '/login',
  '/signup',
];

export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = new Date();
  return STATIC_ROUTES.map((route) => ({
    url: `${SITE_URL}${route}`,
    lastModified,
    changeFrequency: route === '' ? 'daily' : 'weekly',
    priority: route === '' ? 1 : route === '/jobs' || route === '/piyasalar' ? 0.9 : 0.7,
  }));
}
