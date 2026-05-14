import { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/api/', '/dashboard/recepcao', '/dashboard/consultas', '/dashboard/horarios'],
    },
    sitemap: 'https://portaldasaude.vercel.app/sitemap.xml',
  }
}
