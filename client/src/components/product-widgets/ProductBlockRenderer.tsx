/**
 * ProductBlockRenderer
 * 
 * Dynamic renderer for product page blocks. Similar to BlockRenderer but
 * specialized for product pages with product context passed to each widget.
 * 
 * Handles plan-based feature gating with locked widget indicators.
 */

import React from 'react';
import { Lock, Ruler } from 'lucide-react';
import { 
  Product, 
  ProductPageBlock, 
  ProductWidgetType, 
  PlanLevel,
  WIDGET_PLAN_REQUIREMENTS 
} from '../../types';

// Import widgets
import { ProductGallery } from './ProductGallery';
import { ProductInfo } from './ProductInfo';
import { ProductBuyBox } from './ProductBuyBox';
import { ProductDescription } from './ProductDescription';
import { ProductBenefits } from './ProductBenefits';
import { RelatedProducts } from './RelatedProducts';
import ProductReviews from './ProductReviews';
import ProductSpecs from './ProductSpecs';
import ProductBanner from './ProductBanner';
import ProductCountdown from './ProductCountdown';
import ProductVideo from './ProductVideo';
import ProductCustomHtml from './ProductCustomHtml';
import Product3DViewer from './Product3DViewer';
import SizeGuide from '../SizeGuide';
import { ProductBundlesWidget } from '../product/widgets/ProductBundlesWidget';
import { ProductCrossSellWidget } from '../product/widgets/ProductCrossSellWidget';
import { WidgetContainer } from '../ui/WidgetContainer';

// Plan hierarchy for comparison
const PLAN_HIERARCHY: Record<PlanLevel, number> = {
  free: 0,
  starter: 1,
  pro: 2,
  enterprise: 3,
};

interface ProductBlockRendererProps {
  block: ProductPageBlock;
  product: Product;
  products: Product[]; // For related products
  storePlan: PlanLevel;
  onSizeGuideClick?: () => void;
  onTryOnClick?: () => void;
  // New props for bundles/cross-sell
  selectedBundle?: any;
  onSelectBundle?: (bundle: any) => void;
  selectedCrossSells?: string[];
  onToggleCrossSell?: (id: string, selected: boolean) => void;
}

/**
 * Check if a plan has access to a widget
 */
const hasAccess = (storePlan: PlanLevel, requiredPlan: PlanLevel): boolean => {
  return PLAN_HIERARCHY[storePlan] >= PLAN_HIERARCHY[requiredPlan];
};

/**
 * Locked Widget Overlay
 * Shown when a widget is not available in the current plan
 */
const LockedWidget: React.FC<{ widgetName: string; requiredPlan: PlanLevel }> = ({
  widgetName,
  requiredPlan,
}) => (
  <div className="relative rounded-xl border-2 border-dashed border-gray-300 bg-gray-50/80 p-8 text-center">
    <div className="absolute inset-0 backdrop-blur-[2px]" />
    <div className="relative z-10 flex flex-col items-center gap-3">
      <div className="w-12 h-12 rounded-full bg-gray-200 flex items-center justify-center">
        <Lock size={24} className="text-gray-500" />
      </div>
      <h4 className="font-semibold text-gray-700">{widgetName}</h4>
      <p className="text-sm text-gray-500 max-w-[250px]">
        Disponible en el plan <span className="font-bold capitalize">{requiredPlan}</span>.
        Actualizá tu plan para desbloquear esta funcionalidad.
      </p>
      <button className="mt-2 px-4 py-2 bg-black text-white text-sm font-medium rounded-lg hover:bg-gray-800 transition-colors">
        Ver Planes
      </button>
    </div>
  </div>
);

/**
 * Widget name mapping for locked overlay
 */
const WIDGET_NAMES: Record<ProductWidgetType, string> = {
  'product-gallery': 'Galería de Producto',
  'product-info': 'Información del Producto',
  'product-buy-box': 'Caja de Compra',
  'product-description': 'Descripción',
  'product-reviews': 'Reseñas de Clientes',
  'related-products': 'Productos Relacionados',
  'product-specs': 'Especificaciones',
  'product-banner': 'Banner Promocional',
  'product-countdown': 'Temporizador de Oferta',
  'product-size-guide': 'Guía de Talles',
  'product-video': 'Video del Producto',
  'product-custom-html': 'Contenido Personalizado',
  'product-3d-viewer': 'Visor 3D',
  'product-bundles': 'Packs de Descuento',
  'product-cross-sell': 'Complementos',
};

export const ProductBlockRenderer: React.FC<ProductBlockRendererProps> = ({
  block,
  product,
  products,
  storePlan,
  onSizeGuideClick,
  onTryOnClick,
  selectedBundle,
  onSelectBundle,
  selectedCrossSells,
  onToggleCrossSell,
}) => {
  // Skip inactive blocks
  if (!block.isActive) return null;

  // Check plan access
  const requiredPlan = WIDGET_PLAN_REQUIREMENTS[block.type] || 'free';
  const canAccess = hasAccess(storePlan, requiredPlan);

  // Show locked overlay if no access
  if (!canAccess) {
    return (
      <LockedWidget
        widgetName={WIDGET_NAMES[block.type] || block.type}
        requiredPlan={requiredPlan}
        />
      );
  }

  switch (block.type) {
    case 'product-gallery':
      return (
        <ProductGallery
          product={product}
          layout={block.config.layout as 'carousel' | 'grid' | 'stack'}
          imageRatio={block.config.imageRatio as '1:1' | '3:4' | '4:3' | '16:9'}
          showThumbnails={block.config.showThumbnails ?? true}
          enableZoom={block.config.enableZoom ?? true}
          enableLightbox={block.config.enableLightbox ?? true}
        />
      );

      return (
        <WidgetContainer variant="minimal">
          <ProductInfo
            product={product}
            showCategory={block.config.showCategory ?? true}
            showRating={block.config.showRating ?? true}
            showViewingCount={block.config.showViewingCount ?? true}
            showStockUrgency={block.config.showStockUrgency ?? true}
            showBadges={block.config.showBadges ?? true}
          />
        </WidgetContainer>
      );

    case 'product-buy-box':
      return (
        <WidgetContainer variant="default">
          <ProductBuyBox
            product={product}
            buttonStyle={block.config.buttonStyle as 'solid' | 'outline' | 'ghost'}
            showWishlistButton={block.config.showWishlistButton ?? true}
            showWhatsAppButton={block.config.showWhatsAppButton ?? true}
            showBuyNowButton={block.config.showBuyNowButton ?? true}
            showTryOnButton={block.config.showTryOnButton ?? true}
            sticky={block.config.sticky ?? false}
            accentColor={block.config.accentColor}
            onSizeGuideClick={onSizeGuideClick}
            onTryOnClick={onTryOnClick}
          />
        </WidgetContainer>
      );

    case 'product-description':
      return (
        <WidgetContainer variant="default">
          <ProductDescription
            product={product}
            showTitle={block.config.showTitle ?? true}
            expandable={block.config.expandable ?? false}
            maxLines={block.config.maxLines || 4}
          />
        </WidgetContainer>
      );

    case 'related-products':
      return (
        <WidgetContainer variant="minimal">
          <RelatedProducts
            product={product}
            products={products}
            title={block.config.title || 'También te puede gustar'}
            limit={block.config.limit || 4}
            layout={block.config.layout || 'grid'}
            columns={block.config.columns || 4}
          />
        </WidgetContainer>
      );

      return (
        <WidgetContainer variant="default">
          <ProductReviews
            product={product}
            showSummary={block.config.showSummary ?? true}
            limit={block.config.limit || 5}
          />
        </WidgetContainer>
      );

      return (
        <WidgetContainer variant="default">
          <ProductSpecs
            product={product}
            title={block.config.title}
            layout={block.config.layout as 'table' | 'list'}
          />
        </WidgetContainer>
      );

    case 'product-banner':
      return (
        <WidgetContainer variant="minimal">
          <ProductBanner
            image={block.config.image}
            title={block.config.title}
            subtitle={block.config.subtitle}
            buttonText={block.config.buttonText}
            buttonLink={block.config.buttonLink}
            height={block.config.height}
          />
        </WidgetContainer>
      );

    case 'product-countdown':
      return (
        <WidgetContainer variant="minimal">
          <ProductCountdown
            endDate={block.config.endDate}
            title={block.config.title}
            theme={block.config.theme as 'light' | 'dark'}
          />
        </WidgetContainer>
      );

    case 'product-size-guide':
      return (
        <WidgetContainer variant="minimal">
          <SizeGuide
            title={block.config.title}
            mode={block.config.mode as 'standard' | 'image'}
            imageUrl={block.config.imageUrl}
            embedded={true}
          />
        </WidgetContainer>
      );

    case 'product-video':
      return (
        <WidgetContainer variant="minimal">
          <ProductVideo
            videoUrl={block.config.videoUrl}
            autoplay={block.config.autoplay}
            showControls={block.config.showControls}
          />
        </WidgetContainer>
      );

    case 'product-custom-html':
      return (
        <WidgetContainer variant="minimal">
          <ProductCustomHtml
            html={block.config.html}
          />
        </WidgetContainer>
      );

    case 'product-3d-viewer':
      return (
        <WidgetContainer variant="minimal">
          <Product3DViewer
            modelUrl={block.config.modelUrl}
            poster={block.config.poster}
            autoRotate={block.config.autoRotate}
          />
        </WidgetContainer>
      );

    case 'product-bundles':
      return (
        <WidgetContainer variant="default">
          <ProductBundlesWidget
            config={block.config}
            product={product}
            selectedBundle={selectedBundle}
            onSelectBundle={onSelectBundle}
            currentPrice={product.price}
          />
        </WidgetContainer>
      );

    case 'product-cross-sell':
      return (
        <WidgetContainer variant="default">
          <ProductCrossSellWidget
            config={block.config}
            product={product}
            selectedProducts={selectedCrossSells}
            onToggleProduct={onToggleCrossSell}
          />
        </WidgetContainer>
      );

    default:
      return null;
  }
};

export { DEFAULT_PRODUCT_BLOCKS } from '../../data/defaultProductBlocks';

export default ProductBlockRenderer;
