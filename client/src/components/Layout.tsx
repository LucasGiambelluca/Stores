/**
 * Layout.tsx - Re-exports for backward compatibility
 * 
 * This file now serves as a barrel export for layout components.
 * Each component has been extracted to its own file in ./layout/ for better
 * code organization and maintainability.
 * 
 * Original file was 766 lines, now split into:
 * - layout/Navbar.tsx (~588 lines)
 * - layout/Footer.tsx (~160 lines)
 */

// Navbar component with navigation, search, and mobile menu
export { Navbar, type NavbarProps } from './layout/Navbar';

// Footer component with contact info, links, and legal sections
export { Footer } from './layout/Footer';