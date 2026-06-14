import { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL
  
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: [
        '/api/',
        '/admin/',
        '/manager/',
        '/profile/',
        '/profile/*',
        '/cart/',
        '/checkout/',
        '/login/',
        '/register/',
        '/_next/',
        '/static/',
      ],
    },
    sitemap: `${baseUrl}/sitemap.xml`,
    host: baseUrl,
  }
}