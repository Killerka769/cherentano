import { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://chelentano05.ru'
  
  return {
    rules: {
      userAgent: '*',
      allow: ['/', '/_next/static/', '/sitemap.xml', '/yml.xml'],
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
        '/_next/data/',
      ],
    },
    sitemap: `${baseUrl}/sitemap.xml`,
    host: baseUrl,
  }
}