import React from 'react';
import { X, Zap, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface UpgradeModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentPlan: string;
  limitType: 'products' | 'orders';
}

export const UpgradeModal: React.FC<UpgradeModalProps> = ({ isOpen, onClose, currentPlan, limitType }) => {
  if (!isOpen) return null;

  const getNextPlan = (plan: string) => {
    switch (plan) {
      case 'free': return 'Starter';
      case 'starter': return 'Pro';
      case 'pro': return 'Enterprise';
      default: return 'Pro';
    }
  };

  const nextPlan = getNextPlan(currentPlan);

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          onClick={onClose}
        />
        
        <motion.div 
          initial={{ scale: 0.95, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.95, opacity: 0, y: 20 }}
          className="relative bg-white dark:bg-zinc-900 rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden border border-lime-500/30"
        >
          {/* Header with gradient */}
          <div className="bg-gradient-to-r from-lime-600 to-green-600 p-6 text-white text-center relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-full bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-10"></div>
            <div className="relative z-10">
              <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4 backdrop-blur-md">
                <img src="/src/assets/limeLogo.png" alt="LimeStore" className="w-10 h-10 object-contain" />
              </div>
              <h2 className="text-2xl font-bold mb-1">¡Límite Alcanzado!</h2>
              <p className="text-lime-100">
                Has llegado al máximo de {limitType === 'products' ? 'productos' : 'órdenes'} de tu plan {currentPlan}.
              </p>
            </div>
            <button 
              onClick={onClose}
              className="absolute top-4 right-4 text-white/70 hover:text-white transition-colors"
            >
              <X size={24} />
            </button>
          </div>

          <div className="p-8">
            <div className="text-center mb-8">
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                Pásate a {nextPlan}
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                Desbloqueá más capacidad y herramientas exclusivas para seguir creciendo.
              </p>
            </div>

            <div className="space-y-4 mb-8">
              <div className="flex items-center gap-3">
                <div className="w-6 h-6 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center flex-shrink-0">
                  <Check size={14} className="text-green-600 dark:text-green-400" />
                </div>
                <span className="text-gray-700 dark:text-gray-300">
                  {nextPlan === 'Pro' ? '2000 productos' : 'Productos ilimitados'}
                </span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-6 h-6 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center flex-shrink-0">
                  <Check size={14} className="text-green-600 dark:text-green-400" />
                </div>
                <span className="text-gray-700 dark:text-gray-300">
                  {nextPlan === 'Pro' ? 'Órdenes ilimitadas' : 'Soporte prioritario 24/7'}
                </span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-6 h-6 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center flex-shrink-0">
                  <Check size={14} className="text-green-600 dark:text-green-400" />
                </div>
                <span className="text-gray-700 dark:text-gray-300">
                  Herramientas de IA avanzadas
                </span>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => window.open('https://wa.me/5491112345678?text=Hola,%20quiero%20mejorar%20mi%20plan', '_blank')}
                className="flex-1 bg-lime-600 hover:bg-lime-700 text-white font-bold py-3 px-6 rounded-xl transition-all shadow-lg shadow-lime-600/20 transform hover:-translate-y-0.5"
              >
                Mejorar Plan
              </button>
              <button
                onClick={onClose}
                className="px-6 py-3 rounded-xl border-2 border-gray-200 dark:border-zinc-700 text-gray-600 dark:text-gray-300 font-semibold hover:bg-gray-50 dark:hover:bg-zinc-800 transition-colors"
              >
                Quizás luego
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
