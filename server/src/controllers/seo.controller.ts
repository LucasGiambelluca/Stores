// Sitemap and SEO Controller - Auto-generated sitemap.xml (PostgreSQL version)
import { Request, Response } from 'express';
import { eq } from 'drizzle-orm';
import { db, products, categories } from '../db/drizzle.js';

// Generate dynamic sitemap.xml with all products and pages
export async function getSitemap(req: Request, res: Response) {
  try {
  const baseUrl = process.env.STORE_URL || 'https://limestore.com';
    
    // Get all products using Drizzle
    const allProducts = await db.select({
      id: products.id,
      updatedAt: products.updatedAt
    }).from(products);
    
    // Get all active categories using Drizzle
    const activeCategories = await db.select({
      slug: categories.slug
    })
    .from(categories)
    .where(eq(categories.isActive, true));

    const today = new Date().toISOString().split('T')[0];

    const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <!-- Static Pages -->
  <url>
    <loc>${baseUrl}/</loc>
    <lastmod>${today}</lastmod>
    <changefreq>daily</changefreq>
    <priority>1.0</priority>
  </url>
  <url>
    <loc>${baseUrl}/#/catalogo</loc>
    <lastmod>${today}</lastmod>
    <changefreq>daily</changefreq>
    <priority>0.9</priority>
  </url>
  <url>
    <loc>${baseUrl}/#/preguntas-frecuentes</loc>
    <lastmod>${today}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.5</priority>
  </url>
  <url>
    <loc>${baseUrl}/#/politicas-devolucion</loc>
    <lastmod>${today}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.3</priority>
  </url>
  <url>
    <loc>${baseUrl}/#/terminos-condiciones</loc>
    <lastmod>${today}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.3</priority>
  </url>
  
  <!-- Products -->
  ${allProducts.map(p => `
  <url>
    <loc>${baseUrl}/#/producto/${p.id}</loc>
    <lastmod>${p.updatedAt ? new Date(p.updatedAt).toISOString().split('T')[0] : today}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>`).join('')}
</urlset>`;

    res.set('Content-Type', 'application/xml');
    res.send(sitemap);
  } catch (error) {
    console.error('Sitemap error:', error);
    res.status(500).send('Error generating sitemap');
  }
}

// Generate robots.txt
export async function getRobots(req: Request, res: Response) {
  const baseUrl = process.env.STORE_URL || 'https://xmenosprendas.com';
  
  const robots = `User-agent: *
Allow: /
Disallow: /admin
Disallow: /checkout
Disallow: /api/

Sitemap: ${baseUrl}/sitemap.xml
`;

  res.set('Content-Type', 'text/plain');
  res.send(robots);
}
