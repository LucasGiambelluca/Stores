
import React, { useState, useEffect } from 'react';
import { Clock } from 'lucide-react';

interface ProductCountdownProps {
  endDate: string;
  title?: string;
  theme?: 'light' | 'dark';
}

const ProductCountdown: React.FC<ProductCountdownProps> = ({
  endDate,
  title = '¡Oferta por tiempo limitado!',
  theme = 'light'
}) => {
  const [timeLeft, setTimeLeft] = useState({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0
  });

  useEffect(() => {
    const calculateTimeLeft = () => {
      const difference = +new Date(endDate) - +new Date();
      
      if (difference > 0) {
        setTimeLeft({
          days: Math.floor(difference / (1000 * 60 * 60 * 24)),
          hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
          minutes: Math.floor((difference / 1000 / 60) % 60),
          seconds: Math.floor((difference / 1000) % 60)
        });
      } else {
        setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0 });
      }
    };

    calculateTimeLeft();
    const timer = setInterval(calculateTimeLeft, 1000);

    return () => clearInterval(timer);
  }, [endDate]);

  const isDark = theme === 'dark';

  return (
    <div className={`py-6 px-4 rounded-xl text-center mb-6 ${
      isDark ? 'bg-gray-900 text-white' : 'bg-red-50 text-red-900'
    }`}>
      <div className="flex items-center justify-center gap-2 mb-4">
        <Clock size={20} className={isDark ? 'text-white' : 'text-red-600'} />
        <h3 className="font-bold text-lg">{title}</h3>
      </div>

      <div className="flex justify-center gap-4">
        <TimeUnit value={timeLeft.days} label="Días" isDark={isDark} />
        <div className="text-2xl font-bold mt-2">:</div>
        <TimeUnit value={timeLeft.hours} label="Horas" isDark={isDark} />
        <div className="text-2xl font-bold mt-2">:</div>
        <TimeUnit value={timeLeft.minutes} label="Min" isDark={isDark} />
        <div className="text-2xl font-bold mt-2">:</div>
        <TimeUnit value={timeLeft.seconds} label="Seg" isDark={isDark} />
      </div>
    </div>
  );
};

const TimeUnit: React.FC<{ value: number; label: string; isDark: boolean }> = ({ value, label, isDark }) => (
  <div className="flex flex-col items-center">
    <div className={`text-3xl font-bold tabular-nums ${
      isDark ? 'text-white' : 'text-red-600'
    }`}>
      {value.toString().padStart(2, '0')}
    </div>
    <span className={`text-xs uppercase tracking-wider mt-1 ${
      isDark ? 'text-gray-400' : 'text-red-400'
    }`}>
      {label}
    </span>
  </div>
);

export default ProductCountdown;
