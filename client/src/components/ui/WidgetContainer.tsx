import React from 'react';

interface WidgetContainerProps {
  children: React.ReactNode;
  variant?: 'default' | 'feature' | 'minimal';
  className?: string;
}

/**
 * WidgetContainer - Unified wrapper for all product page widgets
 * Ensures visual consistency across the product page builder
 */
export const WidgetContainer: React.FC<WidgetContainerProps> = ({ 
  children, 
  variant = 'default',
  className = '' 
}) => {
  const variantClasses = {
    default: 'bg-white rounded-xl shadow-sm p-6',
    feature: 'bg-white rounded-2xl shadow-md p-8',
    minimal: 'bg-transparent p-0'
  };

  return (
    <div className={`widget-container ${variantClasses[variant]} ${className}`}>
      {children}
    </div>
  );
};
