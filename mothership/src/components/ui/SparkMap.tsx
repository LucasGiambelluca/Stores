import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';

interface Spark {
  id: number;
  x: number;
  y: number;
  size: number;
  delay: number;
  duration: number;
}

export const SparkMap = () => {
  const [sparks, setSparks] = useState<Spark[]>([]);

  useEffect(() => {
    // Generate random sparks
    const generateSparks = () => {
      const newSparks: Spark[] = Array.from({ length: 20 }).map((_, i) => ({
        id: i,
        x: Math.random() * 100, // %
        y: Math.random() * 100, // %
        size: Math.random() * 4 + 2, // 2-6px
        delay: Math.random() * 5,
        duration: Math.random() * 3 + 2, // 2-5s
      }));
      setSparks(newSparks);
    };

    generateSparks();
  }, []);

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none bg-human-carbon/5 ">
      {/* Abstract Map Background (Optional: SVG or just dots) */}
      <div className="absolute inset-0 opacity-10 " 
           style={{ 
             backgroundImage: 'radial-gradient(circle at center, #A3E635 1px, transparent 1px)', 
             backgroundSize: '40px 40px' 
           }} 
      />

      {/* Sparks */}
      {sparks.map((spark) => (
        <motion.div
          key={spark.id}
          className="absolute rounded-full bg-human-green shadow-[0_0_10px_rgba(163,230,53,0.6)]"
          style={{
            left: `${spark.x}%`,
            top: `${spark.y}%`,
            width: spark.size,
            height: spark.size,
          }}
          animate={{
            opacity: [0, 1, 0],
            scale: [0, 1.5, 0],
          }}
          transition={{
            duration: spark.duration,
            repeat: Infinity,
            delay: spark.delay,
            ease: "easeInOut",
          }}
        />
      ))}

      {/* Ambient Glow */}
      <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-human-green/10 rounded-full blur-[120px] animate-pulse" style={{ animationDuration: '8s' }} />
      <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] bg-human-coral/10 rounded-full blur-[120px] animate-pulse" style={{ animationDuration: '10s', animationDelay: '1s' }} />
    </div>
  );
};
