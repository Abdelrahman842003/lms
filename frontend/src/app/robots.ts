import { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/admin/', '/api/', '/student/', '/teacher/'],
    },
    sitemap: 'https://neetaq.com/sitemap.xml',
  }
}
