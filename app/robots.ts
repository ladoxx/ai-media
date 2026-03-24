import { MetadataRoute } from 'next'

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://cyba.com.tr'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/superadmin/', '/editor/', '/api/', '/login'],
      },
    ],
    sitemap: `${BASE_URL}/sitemap.xml`,
  }
}
