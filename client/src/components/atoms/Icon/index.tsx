import React from 'react';
import { LucideIcon } from 'lucide-react';

export type IconSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl';

export interface IconProps {
  icon: LucideIcon;
  size?: IconSize;
  className?: string;
  color?: string;
  strokeWidth?: number;
}

const sizeMap: Record<IconSize, number> = {
  xs: 12,
  sm: 16,
  md: 20,
  lg: 24,
  xl: 32,
};

export const Icon: React.FC<IconProps> = ({
  icon: LucideIconComponent,
  size = 'md',
  className = '',
  color,
  strokeWidth = 2,
}) => {
  return (
    <LucideIconComponent
      size={sizeMap[size]}
      className={className}
      style={color ? { color } : undefined}
      strokeWidth={strokeWidth}
    />
  );
};

// IconButton - Icon with button wrapper
export interface IconButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  icon: LucideIcon;
  size?: IconSize;
  variant?: 'ghost' | 'solid' | 'outline';
  rounded?: boolean;
}

const buttonVariantClasses = {
  ghost: 'bg-transparent hover:bg-gray-100',
  solid: 'bg-gray-100 hover:bg-gray-200',
  outline: 'bg-transparent border border-gray-300 hover:bg-gray-50',
};

export const IconButton: React.FC<IconButtonProps> = ({
  icon,
  size = 'md',
  variant = 'ghost',
  rounded = true,
  className = '',
  ...props
}) => {
  const padding = size === 'xs' ? 'p-1' : size === 'sm' ? 'p-1.5' : size === 'md' ? 'p-2' : 'p-2.5';

  return (
    <button
      className={`
        inline-flex items-center justify-center transition-colors duration-200
        ${buttonVariantClasses[variant]}
        ${rounded ? 'rounded-full' : 'rounded-lg'}
        ${padding}
        ${className}
      `}
      {...props}
    >
      <Icon icon={icon} size={size} />
    </button>
  );
};

export default Icon;
