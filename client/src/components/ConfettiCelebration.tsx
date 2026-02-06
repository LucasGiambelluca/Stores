import React, { useEffect, useState, useCallback } from 'react';

interface ConfettiPiece {
  id: number;
  x: number;
  color: string;
  size: number;
  rotation: number;
  delay: number;
}

interface ConfettiCelebrationProps {
  isActive: boolean;
  onComplete?: () => void;
  duration?: number;
  particleCount?: number;
}

const COLORS = [
  '#E5B800', // Mustard (brand)
  '#10B981', // Emerald
  '#3B82F6', // Blue
  '#EC4899', // Pink
  '#F97316', // Orange
  '#8B5CF6', // Purple
  '#EF4444', // Red
  '#06B6D4', // Cyan
];

export const ConfettiCelebration: React.FC<ConfettiCelebrationProps> = ({
  isActive,
  onComplete,
  duration = 3000,
  particleCount = 100,
}) => {
  const [pieces, setPieces] = useState<ConfettiPiece[]>([]);
  const [isAnimating, setIsAnimating] = useState(false);

  const generatePieces = useCallback(() => {
    const newPieces: ConfettiPiece[] = [];
    for (let i = 0; i < particleCount; i++) {
      newPieces.push({
        id: i,
        x: Math.random() * 100, // Random horizontal position (%)
        color: COLORS[Math.floor(Math.random() * COLORS.length)],
        size: Math.random() * 8 + 4, // 4-12px
        rotation: Math.random() * 360,
        delay: Math.random() * 500, // 0-500ms delay
      });
    }
    return newPieces;
  }, [particleCount]);

  useEffect(() => {
    if (isActive && !isAnimating) {
      setIsAnimating(true);
      setPieces(generatePieces());

      const timer = setTimeout(() => {
        setIsAnimating(false);
        setPieces([]);
        onComplete?.();
      }, duration);

      return () => clearTimeout(timer);
    }
  }, [isActive, isAnimating, duration, generatePieces, onComplete]);

  if (!isAnimating || pieces.length === 0) return null;

  return (
    <div className="confetti-container" aria-hidden="true">
      {pieces.map((piece) => (
        <div
          key={piece.id}
          className="confetti-piece"
          style={{
            '--x': `${piece.x}%`,
            '--color': piece.color,
            '--size': `${piece.size}px`,
            '--rotation': `${piece.rotation}deg`,
            '--delay': `${piece.delay}ms`,
          } as React.CSSProperties}
        />
      ))}
    </div>
  );
};

// Hook to trigger confetti from anywhere
export const useConfetti = () => {
  const [isActive, setIsActive] = useState(false);

  const celebrate = useCallback(() => {
    setIsActive(true);
  }, []);

  const onComplete = useCallback(() => {
    setIsActive(false);
  }, []);

  return { isActive, celebrate, onComplete };
};

export default ConfettiCelebration;
