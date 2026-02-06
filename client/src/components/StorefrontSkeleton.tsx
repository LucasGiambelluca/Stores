import React from 'react';

/**
 * Premium Skeleton Loading Component
 * Shows a beautiful animated skeleton while the store config loads
 */
export const StorefrontSkeleton: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-50 animate-pulse">
      {/* Header Skeleton */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            {/* Logo */}
            <div className="w-32 h-10 bg-gray-200 rounded-lg" />
            
            {/* Nav Links */}
            <div className="hidden md:flex items-center gap-6">
              <div className="w-16 h-4 bg-gray-200 rounded" />
              <div className="w-20 h-4 bg-gray-200 rounded" />
              <div className="w-16 h-4 bg-gray-200 rounded" />
            </div>
            
            {/* Icons */}
            <div className="flex items-center gap-4">
              <div className="w-8 h-8 bg-gray-200 rounded-full" />
              <div className="w-8 h-8 bg-gray-200 rounded-full" />
            </div>
          </div>
        </div>
      </header>

      {/* Hero Skeleton */}
      <div className="relative h-[60vh] min-h-[400px] bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent skeleton-shimmer" />
        <div className="absolute inset-0 flex flex-col justify-center px-8 max-w-7xl mx-auto">
          <div className="w-24 h-6 bg-white/30 rounded-full mb-4" />
          <div className="w-96 max-w-full h-12 bg-white/40 rounded-lg mb-4" />
          <div className="w-64 h-6 bg-white/30 rounded mb-6" />
          <div className="w-40 h-12 bg-white/50 rounded-full" />
        </div>
      </div>

      {/* Features Bar Skeleton */}
      <div className="bg-white py-6 border-b">
        <div className="max-w-6xl mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="flex flex-col items-center gap-2">
                <div className="w-8 h-8 bg-gray-200 rounded-full" />
                <div className="w-20 h-4 bg-gray-200 rounded" />
                <div className="w-28 h-3 bg-gray-100 rounded" />
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Products Section Skeleton */}
      <div className="py-12 px-4">
        <div className="max-w-7xl mx-auto">
          {/* Section Title */}
          <div className="text-center mb-8">
            <div className="w-48 h-8 bg-gray-200 rounded-lg mx-auto mb-2" />
            <div className="w-32 h-4 bg-gray-100 rounded mx-auto" />
          </div>
          
          {/* Product Grid */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {[1, 2, 3, 4, 5, 6, 7, 8].map(i => (
              <div key={i} className="bg-white rounded-xl overflow-hidden shadow-sm">
                <div className="aspect-square bg-gray-200" />
                <div className="p-4">
                  <div className="w-full h-4 bg-gray-200 rounded mb-2" />
                  <div className="w-2/3 h-4 bg-gray-100 rounded mb-3" />
                  <div className="w-20 h-6 bg-gray-300 rounded" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Loading Indicator */}
      <div className="fixed bottom-6 right-6 bg-white rounded-full shadow-lg px-4 py-2 flex items-center gap-2">
        <div className="w-4 h-4 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin" />
        <span className="text-sm text-gray-600">Cargando tienda...</span>
      </div>

      <style>{`
        @keyframes shimmer {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
        .skeleton-shimmer {
          animation: shimmer 1.5s infinite;
        }
      `}</style>
    </div>
  );
};

/**
 * Admin Panel Skeleton
 * Shows while admin dashboard is loading
 */
export const AdminSkeleton: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-100 flex">
      {/* Sidebar */}
      <div className="w-64 bg-gray-900 p-4">
        <div className="w-32 h-8 bg-gray-700 rounded mb-8" />
        {[1, 2, 3, 4, 5].map(i => (
          <div key={i} className="flex items-center gap-3 py-3">
            <div className="w-5 h-5 bg-gray-700 rounded" />
            <div className="w-24 h-4 bg-gray-700 rounded" />
          </div>
        ))}
      </div>
      
      {/* Main Content */}
      <div className="flex-1 p-8">
        <div className="w-48 h-8 bg-gray-300 rounded mb-6" />
        <div className="grid grid-cols-4 gap-6 mb-8">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="bg-white rounded-xl p-6">
              <div className="w-8 h-8 bg-gray-200 rounded mb-4" />
              <div className="w-16 h-8 bg-gray-300 rounded mb-2" />
              <div className="w-24 h-4 bg-gray-100 rounded" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default StorefrontSkeleton;
