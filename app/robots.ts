import type { MetadataRoute } from 'next';

export const dynamic = 'force-static';

// Canonical domain comes from NEXT_PUBLIC_SITE_URL (see DEPLOYMENT_GUIDE.md).
const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL ?? 'https://www.turanda.com').replace(/\/+$/, '');

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/admin', '/dev', '/onboarding', '/messages', '/dashboard', '/auth/callback'],
      },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  };
}
