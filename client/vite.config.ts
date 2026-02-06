import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, '.', '');
    const isProduction = mode === 'production';
    
    return {
      server: {
        port: 3005,
        host: '0.0.0.0',
        proxy: {
          '/api': {
            target: 'http://localhost:3001',
            changeOrigin: true,
          },
        },
      },
      plugins: [react()],
      define: {
        'process.env.API_KEY': JSON.stringify(env.GEMINI_API_KEY),
        'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY)
      },
      resolve: {
        alias: {
          '@': path.resolve(__dirname, '.'),
          'react': path.resolve(__dirname, './node_modules/react'),
          'react-dom': path.resolve(__dirname, './node_modules/react-dom'),
        }
      },
      // Production build optimizations
      build: {
        // Increase chunk size warning limit
        chunkSizeWarningLimit: 600,
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
              'vendor-ui': ['lucide-react', 'framer-motion'],
              // Heavy libraries
              'vendor-utils': ['axios', 'date-fns'],
            },
            // Consistent chunk naming for caching
            chunkFileNames: isProduction 
              ? 'assets/[name]-[hash].js' 
              : 'assets/[name].js',
            entryFileNames: isProduction
              ? 'assets/[name]-[hash].js'
              : 'assets/[name].js',
            assetFileNames: isProduction
              ? 'assets/[name]-[hash][extname]'
              : 'assets/[name][extname]',
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
});

