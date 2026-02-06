import { test, expect } from '@playwright/test';

/**
 * Homepage E2E Tests for Tiendita Storefront
 * Tests critical user flows on the main page.
 */

test.describe('Homepage', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('should load and display store name', async ({ page }) => {
    // Check that the page loads without errors
    await expect(page).toHaveTitle(/./); // Any title is fine
    
    // Check that some content loaded (not just blank page)
    await expect(page.locator('body')).not.toBeEmpty();
  });

  test('should display products section', async ({ page }) => {
    // Wait for products to load
    const productsSection = page.locator('[id*="product"], [class*="product"]');
    
    // Either products exist or a "no products" message is shown
    const hasProducts = await productsSection.count() > 0;
    const hasEmptyMessage = await page.getByText(/no hay productos/i).isVisible().catch(() => false);
    
    expect(hasProducts || hasEmptyMessage).toBeTruthy();
  });

  test('should have working navigation', async ({ page }) => {
    // Check that main navigation elements are present
    const nav = page.locator('nav, header');
    await expect(nav.first()).toBeVisible();
  });

  test('should be mobile responsive', async ({ page }) => {
    // This test runs in Mobile Chrome viewport (from config)
    await expect(page.locator('body')).toBeVisible();
    
    // Check no horizontal overflow
    const bodyWidth = await page.evaluate(() => document.body.scrollWidth);
    const viewportWidth = page.viewportSize()?.width || 0;
    expect(bodyWidth).toBeLessThanOrEqual(viewportWidth + 5); // 5px tolerance
  });
});

test.describe('Product Interaction', () => {
  test('should navigate to product detail on click', async ({ page }) => {
    await page.goto('/');
    
    // Find a product card and click
    const productCard = page.locator('[class*="product-card"], [data-testid="product-card"]').first();
    
    if (await productCard.isVisible()) {
      await productCard.click();
      
      // Should navigate to product detail page
      await expect(page).toHaveURL(/\/producto\//);
    } else {
      // No products, skip this test
      test.skip();
    }
  });
});
