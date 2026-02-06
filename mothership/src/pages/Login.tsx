import { useState } from 'react';
import { ArrowRight, Lock, Mail } from 'lucide-react';
import { motion } from 'framer-motion';
import { GlassCard } from '../components/ui/GlassCard';
import { NeonButton } from '../components/ui/NeonButton';
import limeLogo from '../assets/limeLogo.png';
import { SparkMap } from '../components/ui/SparkMap';
import { useAuthLogic } from '../hooks/useAuthLogic';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  
  const {
    loginError,
    isLoginLoading,
    handleLogin,
    showForgotModal, setShowForgotModal,
    resetEmail, setResetEmail,
    resetStatus,
    resetMessage,
    handleForgotPassword,
    closeForgotModal
  } = useAuthLogic();

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-human-sand relative overflow-hidden transition-colors duration-500">
      {/* Forgot Password Modal */}
      {showForgotModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white w-full max-w-md rounded-2xl p-6 shadow-2xl border border-slate-200 "
          >
            <h2 className="text-xl font-bold mb-4 text-slate-900 ">Restablecer Contraseña</h2>
            
            {resetStatus === 'success' ? (
              <div className="text-center py-4">
                <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <Mail className="text-green-600 " size={24} />
                </div>
                <p className="text-slate-600 mb-6">{resetMessage}</p>
                <button
                  onClick={closeForgotModal}
                  className="w-full py-2 bg-slate-100 rounded-lg font-medium hover:bg-slate-200 transition-colors"
                >
                  Cerrar
                </button>
              </div>
            ) : (
              <form onSubmit={handleForgotPassword}>
                <p className="text-sm text-slate-500 mb-4">
                  Ingresa tu correo electrónico y te enviaremos un enlace para restablecer tu contraseña.
                </p>
                
                <div className="space-y-4 mb-6">
                  <input
                    type="email"
                    value={resetEmail}
                    onChange={(e) => setResetEmail(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-3 outline-none focus:border-lime-500 transition-colors"
                    placeholder="admin@lime.store"
                    required
                  />
                  
                  {resetStatus === 'error' && (
                    <p className="text-red-500 text-sm">{resetMessage}</p>
                  )}
                </div>
                
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={closeForgotModal}
                    className="flex-1 py-2 bg-slate-100 text-slate-700 rounded-lg font-medium hover:bg-slate-200 transition-colors"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={resetStatus === 'loading'}
                    className="flex-1 py-2 bg-lime-600 text-white rounded-lg font-medium hover:bg-lime-500 transition-colors disabled:opacity-50"
                  >
                    {resetStatus === 'loading' ? 'Enviando...' : 'Enviar'}
                  </button>
                </div>
              </form>
            )}
          </motion.div>
        </div>
      )}

      <SparkMap />

      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="w-full max-w-md px-4 relative z-10"
      >
        <GlassCard className="p-8 sm:p-10 border-slate-200 shadow-2xl bg-white/80 backdrop-blur-xl">
          <div className="flex flex-col items-center mb-8">
            <motion.div 
              initial={{ y: -20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="w-24 h-24 bg-white rounded-3xl flex items-center justify-center mb-6 shadow-xl _0_30px_rgba(132,204,22,0.4)] border border-slate-100 p-4"
            >
              <img src={limeLogo} alt="Lime Logo" className="w-full h-full object-contain" />
            </motion.div>
            
            <motion.h1 
              initial={{ y: -10, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="text-3xl font-display font-bold text-human-carbon text-center mb-2 tracking-tight"
            >
              Lime<span className="text-human-green">Mothership</span>
            </motion.h1>
            
            <motion.p 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4 }}
              className="text-slate-600 text-center text-sm font-medium font-handwritten text-lg"
            >
              Retoma tu historia. Tu sueño te espera.
            </motion.p>
          </div>

          <form onSubmit={(e) => handleLogin(e, email, password)} className="space-y-6">
            <div className="space-y-4">
              <div className="relative group">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-human-green transition-colors" size={20} />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-white border-2 border-slate-200 rounded-xl py-3.5 pl-12 pr-4 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-human-green focus:ring-4 focus:ring-human-green/10 transition-all font-medium"
                  placeholder="admin@lime.store"
                  required
                />
              </div>
              
              <div className="relative group">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-human-green transition-colors" size={20} />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-white border-2 border-slate-200 rounded-xl py-3.5 pl-12 pr-4 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-human-green focus:ring-4 focus:ring-human-green/10 transition-all font-medium"
                  placeholder="••••••••"
                  required
                />
              </div>
            </div>

            <div className="flex justify-end">
              <button
                type="button"
                onClick={() => setShowForgotModal(true)}
                className="text-sm text-human-green hover:underline font-medium"
              >
                ¿Olvidaste tu contraseña?
              </button>
            </div>

            {loginError && (
              <motion.div 
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className="text-red-600 text-sm text-center bg-red-50 border border-red-200 rounded-lg p-3 font-medium"
              >
                {loginError}
              </motion.div>
            )}

            <NeonButton 
              type="submit" 
              className="w-full py-4 text-lg font-bold tracking-wide shadow-xl shadow-human-green/20 bg-human-green hover:bg-lime-500 text-human-carbon border-none"
              isLoading={isLoginLoading}
              icon={ArrowRight}
            >
              RETOMAR MI VIAJE
            </NeonButton>
          </form>
          
          <div className="mt-8 text-center">
            <p className="text-xs text-slate-500 font-medium flex items-center justify-center gap-2">
              <span className="w-2 h-2 rounded-full bg-human-green animate-pulse"></span>
              Conectando con 42 soñadores en línea.
            </p>
          </div>
        </GlassCard>
      </motion.div>
    </div>
  );
}
