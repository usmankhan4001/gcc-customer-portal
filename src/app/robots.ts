import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/admin/', '/api/', '/portal/', '/checkout'],
    },
    sitemap: 'https://gccstartup.com/sitemap.xml',
  };
}
