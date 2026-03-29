export const dynamic = 'force-static';
import type { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: '*', allow: '/', disallow: ['/auth/', '/dashboard', '/settings'] },
    sitemap: 'https://leadpulse.pages.dev/sitemap.xml',
  }
}
