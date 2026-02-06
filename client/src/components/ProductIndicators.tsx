import React from 'react';
import { Eye, Flame, Star, Clock, TrendingUp } from 'lucide-react';

// Simulated viewing count (in production, use real-time data from WebSockets)
export const ViewingIndicator: React.FC<{ productId: string | number }> = ({ productId }) => {
  // Generate a pseudo-random number based on product ID that stays consistent
  const hash = String(productId).split('').reduce((a, b) => a + b.charCodeAt(0), 0);
  const viewingCount = (hash % 8) + 2; // Between 2-9 people

  return (
    <div className="flex items-center gap-1.5 text-orange-600 text-sm">
      <Eye size={14} className="animate-pulse" />
      <span className="font-medium">{viewingCount} personas viendo ahora</span>
    </div>
  );
};

// Stock urgency indicator
export const StockUrgency: React.FC<{ stock?: number }> = ({ stock = 100 }) => {
  if (stock > 10) return null;
  
  const urgencyLevel = stock <= 3 ? 'critical' : stock <= 5 ? 'warning' : 'low';
  
  const styles = {
    critical: 'bg-red-100 text-red-700 border-red-200',
    warning: 'bg-orange-100 text-orange-700 border-orange-200',
    low: 'bg-yellow-100 text-yellow-700 border-yellow-200',
  };

  return (
    <div className={`flex items-center gap-2 px-3 py-2 rounded-lg border ${styles[urgencyLevel]}`}>
      <Flame size={16} className={urgencyLevel === 'critical' ? 'animate-bounce' : ''} />
      <span className="font-medium text-sm">
        {stock <= 3 ? `¡Últimas ${stock} unidades!` : `¡Solo quedan ${stock}!`}
      </span>
    </div>
  );
};

// Star rating display
export const StarRating: React.FC<{ 
  rating: number; 
  count?: number; 
  size?: 'sm' | 'md' | 'lg';
  showCount?: boolean;
}> = ({ rating, count = 0, size = 'md', showCount = true }) => {
  const sizeMap = { sm: 12, md: 16, lg: 20 };
  const iconSize = sizeMap[size];
  
  const fullStars = Math.floor(rating);
  const hasHalf = rating % 1 >= 0.5;
  const emptyStars = 5 - fullStars - (hasHalf ? 1 : 0);

  return (
    <div className="flex items-center gap-1">
      <div className="flex">
        {[...Array(fullStars)].map((_, i) => (
          <Star key={`full-${i}`} size={iconSize} className="fill-yellow-400 text-yellow-400" />
        ))}
        {hasHalf && (
          <div className="relative">
            <Star size={iconSize} className="text-gray-300" />
            <div className="absolute inset-0 overflow-hidden w-1/2">
              <Star size={iconSize} className="fill-yellow-400 text-yellow-400" />
            </div>
          </div>
        )}
        {[...Array(emptyStars)].map((_, i) => (
          <Star key={`empty-${i}`} size={iconSize} className="text-gray-300" />
        ))}
      </div>
      {showCount && count > 0 && (
        <span className="text-gray-500 text-sm ml-1">({count})</span>
      )}
    </div>
  );
};

// Recent purchase indicator
export const RecentPurchase: React.FC = () => {
  const names = ['María', 'Carlos', 'Ana', 'Juan', 'Laura', 'Diego', 'Sofía', 'Pablo'];
  const cities = ['Buenos Aires', 'Córdoba', 'Rosario', 'Mendoza', 'La Plata'];
  const times = ['hace 2 min', 'hace 5 min', 'hace 12 min', 'hace 18 min', 'hace 30 min'];

  const randomIndex = Math.floor(Math.random() * names.length);
  const name = names[randomIndex];
  const city = cities[randomIndex % cities.length];
  const time = times[randomIndex % times.length];

  return (
    <div className="flex items-center gap-2 px-3 py-2 bg-green-50 border border-green-200 rounded-lg text-sm">
      <TrendingUp size={14} className="text-green-600" />
      <span className="text-green-700">
        <strong>{name}</strong> de {city} compró {time}
      </span>
    </div>
  );
};

// Sale countdown timer
export const SaleCountdown: React.FC<{ endDate?: Date }> = ({ endDate }) => {
  const [timeLeft, setTimeLeft] = React.useState({ hours: 0, minutes: 0, seconds: 0 });
  
  const targetDate = endDate || new Date(Date.now() + 24 * 60 * 60 * 1000); // Default: 24h from now
  
  React.useEffect(() => {
    const timer = setInterval(() => {
      const now = new Date().getTime();
      const distance = targetDate.getTime() - now;
      
      if (distance < 0) {
        clearInterval(timer);
        return;
      }
      
      setTimeLeft({
        hours: Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
        minutes: Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60)),
        seconds: Math.floor((distance % (1000 * 60)) / 1000),
      });
    }, 1000);
    
    return () => clearInterval(timer);
  }, [targetDate]);

  return (
    <div className="flex items-center gap-2 px-3 py-2 bg-red-600 text-white rounded-lg text-sm">
      <Clock size={14} />
      <span className="font-medium">
        Oferta termina en: {String(timeLeft.hours).padStart(2, '0')}:
        {String(timeLeft.minutes).padStart(2, '0')}:
        {String(timeLeft.seconds).padStart(2, '0')}
      </span>
    </div>
  );
};

// Savings badge
export const SavingsBadge: React.FC<{ 
  originalPrice: number; 
  currentPrice: number;
  showPercentage?: boolean;
}> = ({ originalPrice, currentPrice, showPercentage = true }) => {
  const savings = originalPrice - currentPrice;
  const percentage = Math.round((savings / originalPrice) * 100);
  
  if (savings <= 0) return null;

  return (
    <div className="inline-flex items-center gap-1 px-2 py-1 bg-green-500 text-white text-xs font-bold rounded">
      {showPercentage ? `-${percentage}%` : `Ahorrás $${savings.toLocaleString()}`}
    </div>
  );
};

export default {
  ViewingIndicator,
  StockUrgency,
  StarRating,
  RecentPurchase,
  SaleCountdown,
  SavingsBadge,
};
