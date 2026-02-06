/**
 * AdminPanel.tsx - Re-exports for backward compatibility
 * 
 * This file now serves as a barrel export for admin components.
 * Each component has been extracted to its own file in ./admin/ for better
 * code splitting and maintainability.
 * 
 * Original file was 1346 lines, now split into:
 * - AdminDashboard.tsx (176 lines)
 * - AdminProductsPage.tsx (475 lines)
 * - AdminSettingsPanel.tsx (547 lines)
 */

// Dashboard
// Dashboard
export { AdminDashboard } from './admin/AdminDashboard';

// Products
export { AdminProducts } from './admin/AdminProductsPage';

// Settings
export { AdminSettings } from './admin/AdminSettingsPanel';

// Orders (already separated)
export { AdminOrdersPanel as AdminOrders } from './admin/OrdersPanel';

// Customers (already separated)
export { AdminCustomersPanel as AdminCustomers } from './admin/CustomersPanel';

// Reports (already separated)
export { AdminReportsPanel as AdminReports } from './admin/ReportsPanel';
