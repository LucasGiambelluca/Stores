import { ProductPageBlock } from '../types';

/**
 * Default block configuration for new stores
 */
export const DEFAULT_PRODUCT_BLOCKS: ProductPageBlock[] = [
  {
    id: 'default-gallery',
    type: 'product-gallery',
    order: 1,
    isActive: true,
    requiredPlan: 'free',
    config: { layout: 'carousel', showThumbnails: true },
  },
  {
    id: 'default-info',
    type: 'product-info',
    order: 2,
    isActive: true,
    requiredPlan: 'free',
    config: { showCategory: true, showRating: true },
  },
  {
    id: 'default-buybox',
    type: 'product-buy-box',
    order: 3,
    isActive: true,
    requiredPlan: 'free',
    config: { buttonStyle: 'solid' },
  },
  {
    id: 'default-description',
    type: 'product-description',
    order: 4,
    isActive: true,
    requiredPlan: 'free',
    config: { showTitle: true },
  },
  {
    id: 'default-related',
    type: 'related-products',
    order: 5,
    isActive: true,
    requiredPlan: 'starter',
    config: { limit: 4, layout: 'grid' },
  },
];
