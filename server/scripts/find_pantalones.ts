
import { db } from '../src/db/drizzle.js';
import { stores, products, categories, banners } from '../src/db/schema.js';
import { ilike, or } from 'drizzle-orm';

async function findPantalones() {
  try {
    console.log('Searching for "pantalones" in database...');
    // Search Stores
    const foundStores = await db.select().from(stores);
    console.log(`Total stores in DB: ${foundStores.length}`);
    const matchingStores = foundStores.filter(s => 
      (s.name && s.name.toLowerCase().includes('pantalones')) ||
      (s.domain && s.domain.toLowerCase().includes('pantalones')) ||
      (s.slogan && s.slogan.toLowerCase().includes('pantalones'))
    );
    console.log(`Found ${matchingStores.length} stores matching "pantalones":`);
    matchingStores.forEach(s => console.log(` - ID: ${s.id}, Name: ${s.name}, Domain: ${s.domain}`));

    // Search Categories
    const foundCategories = await db.select().from(categories).where(
      ilike(categories.name, '%pantalones%')
    );
    console.log(`Found ${foundCategories.length} categories matching "pantalones":`);
    foundCategories.forEach(c => console.log(` - ID: ${c.id}, Name: ${c.name}, StoreID: ${c.storeId}`));

    // Search Products
    const foundProducts = await db.select().from(products).where(
      or(
        ilike(products.name, '%pantalones%'),
        ilike(products.description, '%pantalones%')
      )
    );
    console.log(`Found ${foundProducts.length} products matching "pantalones":`);
    foundProducts.forEach(p => console.log(` - ID: ${p.id}, Name: ${p.name}, StoreID: ${p.storeId}`));

    process.exit(0);
  } catch (error) {
    console.error('Error searching:', error);
    process.exit(1);
  }
}

findPantalones();
