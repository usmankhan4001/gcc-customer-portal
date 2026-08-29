import { MetadataRoute } from 'next';

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = 'https://gccstartup.com';

  const routes = [
    '',
    '/tools',
    '/setup',
  ];

  return routes.map((route) => ({
    url: `${baseUrl}${route}`,
    lastModified: new Date(),
    changeFrequency: route === '' || route === '/tools' ? 'daily' : 'weekly',
    priority: route === '' ? 1.0 : 0.9,
  }));
}
