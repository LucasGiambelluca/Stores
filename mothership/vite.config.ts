import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const isProduction = mode === 'production';
  
  return {
    plugins: [react()],
    // Production build optimizations
    build: {
      // Increase chunk size warning limit
      chunkSizeWarningLimit: 500,
      // Minification
      minify: isProduction ? 'esbuild' : false,
      // Enable source maps in dev only
      sourcemap: !isProduction,
      // Rollup options for code splitting
      rollupOptions: {
        output: {
          // Manual chunks for better caching
          manualChunks: {
            // React core - rarely changes
            'vendor-react': ['react', 'react-dom', 'react-router-dom'],
            // UI utilities
            'vendor-ui': ['lucide-react'],
            // Heavy libraries
            'vendor-utils': ['axios', 'recharts'],
          },
          // Consistent chunk naming
          chunkFileNames: isProduction 
            ? 'assets/[name]-[hash].js' 
            : 'assets/[name].js',
          entryFileNames: isProduction
            ? 'assets/[name]-[hash].js'
            : 'assets/[name].js',
        }
      },
      // Target modern browsers for smaller bundles
      target: 'es2020',
    },
    // Optimize dependencies
    optimizeDeps: {
      include: ['react', 'react-dom', 'react-router-dom', 'axios'],
    },
  };
})
