/**
 * Product Widgets - Barrel Export
 * 
 * Central export file for all product page builder widgets.
 * Import from this file to get access to all widgets.
 */

// Core Widgets (Free Plan)
export { ProductGallery } from './ProductGallery';
export { ProductInfo } from './ProductInfo';
export { ProductBuyBox } from './ProductBuyBox';
export { ProductDescription } from './ProductDescription';
export { ProductBenefits } from './ProductBenefits';

// Standard Widgets (Starter+)
export { RelatedProducts } from './RelatedProducts';
export { default as ProductReviews } from './ProductReviews';
export { default as ProductSpecs } from './ProductSpecs';

// Block Renderer
export { ProductBlockRenderer, DEFAULT_PRODUCT_BLOCKS } from './ProductBlockRenderer';

// Premium Widgets (Pro+)
export { default as ProductBanner } from './ProductBanner';
export { default as ProductCountdown } from './ProductCountdown';
// export { ProductSizeGuide } from './ProductSizeGuide'; // Imported from ../SizeGuide

// Enterprise Widgets
export { default as ProductVideo } from './ProductVideo';
export { default as ProductCustomHtml } from './ProductCustomHtml';
export { default as Product3DViewer } from './Product3DViewer';
