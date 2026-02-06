import { ProductsService } from './products.service.js';
// import { OrdersService } from './orders.service.js'; // Will be added later

export class StoreScope {
  private storeId: string;
  
  // Scoped service instances
  public products: ProductsService;
  // public orders: OrdersService;

  constructor(storeId: string) {
    if (!storeId) {
      throw new Error('StoreScope requires a storeId');
    }
    this.storeId = storeId;

    // Initialize services with the storeId
    this.products = new ProductsService(storeId);
    // this.orders = new OrdersService(storeId);
  }

  /**
   * Get the store ID for this scope
   */
  get id() {
    return this.storeId;
  }
}
