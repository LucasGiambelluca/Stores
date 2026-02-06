import 'dotenv/config';
import { ProductsService } from './services/products.service.js';

async function debugLicenseCheck() {
  console.log('🚀 Debugging License Check...');

  const storeId = '7075ea25-d286-4d95-b4e6-22addb58cff6'; // Tienda Starter
  console.log(`Target Store ID: ${storeId}`);

  try {
    console.log('Attempting to create product...');
    await ProductsService.create(storeId, {
      name: 'Debug Product',
      price: 100,
      stock: 10,
    });
    console.log('✅ Product created successfully (Unexpected if limit reached)');
  } catch (error: any) {
    console.log('❌ Error caught:');
    console.log(error.message);
    if (error.message.includes('NO_LICENSE')) {
      console.log('⚠️ CONFIRMED: NO_LICENSE error triggered.');
    } else if (error.message.includes('PRODUCT_LIMIT_EXCEEDED')) {
      console.log('✅ CONFIRMED: PRODUCT_LIMIT_EXCEEDED error triggered (This is what we want).');
    }
  }

  process.exit(0);
}

debugLicenseCheck().catch(console.error);
