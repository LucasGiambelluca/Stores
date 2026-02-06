import React, { useState } from 'react';
import { X, Eye, EyeOff, Mail, Lock, User, Loader2 } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useStoreConfig } from '../../context/StoreContext';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialMode?: 'login' | 'register';
}

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose, initialMode = 'login' }) => {
  const { login, register, forgotPassword } = useAuth();
  const { config } = useStoreConfig();
  const [mode, setMode] = useState<'login' | 'register' | 'recovery'>(initialMode);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  // Form state
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const accentColor = config.colors.accent;
  const primaryColor = config.colors.primary;

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setIsLoading(true);

    try {
      if (mode === 'recovery') {
        const result = await forgotPassword(email);
        if (result.success) {
          setSuccess('Si el email existe, recibirás instrucciones para restablecer tu contraseña.');
        } else {
          setError(result.error || 'Error al enviar solicitud');
        }
      } else if (mode === 'register') {
        if (password !== confirmPassword) {
          setError('Las contraseñas no coinciden');
          setIsLoading(false);
          return;
        }
        if (password.length < 6) {
          setError('La contraseña debe tener al menos 6 caracteres');
          setIsLoading(false);
          return;
        }
        const result = await register(email, password, name);
        if (result.success) {
          onClose();
        } else {
          setError(result.error || 'Error al registrar');
        }
      } else {
        const result = await login(email, password);
        if (result.success) {
          onClose();
        } else {
          setError(result.error || 'Error al iniciar sesión');
        }
      }
    } finally {
      setIsLoading(false);
    }
  };

  const toggleMode = () => {
    setMode(mode === 'login' ? 'register' : 'login');
    setError(null);
    setSuccess(null);
  };

  const inputStyle = {
    '--tw-ring-color': accentColor,
  } as React.CSSProperties;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl animate-in fade-in zoom-in duration-200">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-xl font-bold text-gray-900">
            {mode === 'login' ? 'Iniciar Sesión' : mode === 'register' ? 'Crear Cuenta' : 'Recuperar Contraseña'}
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
              {error}
            </div>
          )}
          
          {success && (
            <div className="p-3 bg-green-50 border border-green-200 rounded-lg text-green-600 text-sm">
              {success}
            </div>
          )}

          {mode === 'register' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Nombre
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  style={inputStyle}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:border-transparent"
                  placeholder="Tu nombre"
                />
              </div>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Email
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                style={inputStyle}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:border-transparent"
                placeholder="tu@email.com"
              />
            </div>
          </div>

          {mode !== 'recovery' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Contraseña
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  style={inputStyle}
                  className="w-full pl-10 pr-12 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:border-transparent"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>
          )}

          {mode === 'register' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Confirmar Contraseña
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  style={inputStyle}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:border-transparent"
                  placeholder="••••••••"
                />
              </div>
            </div>
          )}

          {mode === 'login' && (
            <div className="flex justify-end">
              <button
                type="button"
                onClick={() => {
                  setMode('recovery');
                  setError(null);
                  setSuccess(null);
                }}
                className="text-sm font-medium text-blue-600 hover:text-blue-800 hover:underline"
              >
                ¿Olvidaste tu contraseña?
              </button>
            </div>
          )}

          <button
            type="submit"
            disabled={isLoading}
            style={{ backgroundColor: accentColor, color: primaryColor }}
            className="w-full py-3 font-semibold rounded-lg hover:opacity-90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {isLoading && <Loader2 size={20} className="animate-spin" />}
            {mode === 'login' ? 'Iniciar Sesión' : mode === 'register' ? 'Crear Cuenta' : 'Enviar Email'}
          </button>
        </form>

        {/* Footer */}
        <div className="p-6 pt-0 text-center">
          {mode === 'recovery' ? (
            <p className="text-sm text-gray-600">
              <button
                onClick={() => setMode('login')}
                className="font-semibold text-gray-900 hover:underline"
              >
                Volver al inicio de sesión
              </button>
            </p>
          ) : (
            <p className="text-sm text-gray-600">
              {mode === 'login' ? '¿No tenés cuenta?' : '¿Ya tenés cuenta?'}
              <button
                onClick={toggleMode}
                className="ml-1 font-bold text-gray-900 hover:underline"
              >
                {mode === 'login' ? 'Registrate' : 'Iniciá sesión'}
              </button>
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

// Admin Login Page
export const AdminLoginPage: React.FC = () => {
  const { login, forgotPassword, isAuthenticated, isAdmin } = useAuth();
  const { config } = useStoreConfig();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isRecovery, setIsRecovery] = useState(false);

  const accentColor = config.colors.accent;
  const primaryColor = config.colors.primary;

  // Redirect if already logged in as admin
  if (isAuthenticated && isAdmin) {
    window.location.href = '/admin';
    return null;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setIsLoading(true);

    try {
      if (isRecovery) {
        const result = await forgotPassword(email);
        if (result.success) {
            setSuccess('Si el email existe, recibirás instrucciones para restablecer tu contraseña.');
            setIsRecovery(false); // Switch back to login view but show success message
        } else {
            setError(result.error || 'Error al enviar solicitud');
        }
      } else {
        const result = await login(email, password);
        if (result.success) {
            window.location.href = '/admin';
        } else {
            setError(result.error || 'Credenciales inválidas');
        }
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div 
      className="min-h-screen flex items-center justify-center p-4" 
      style={{ backgroundColor: primaryColor, minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}
    >
      <div className="w-full max-w-md" style={{ width: '100%', maxWidth: '28rem' }}>
        <div className="text-center mb-8" style={{ textAlign: 'center', marginBottom: '2rem' }}>
          {config.logo && (
            <img 
              src={config.logo} 
              alt={config.name} 
              className="h-16 mx-auto mb-4 object-contain"
              style={{ height: '4rem', margin: '0 auto 1rem', objectFit: 'contain' }}
            />
          )}
          <h1 className="text-3xl font-bold text-white mb-2" style={{ fontSize: '1.875rem', fontWeight: 700, color: 'white', marginBottom: '0.5rem' }}>
            {isRecovery ? 'Recuperar Contraseña' : 'Panel Admin'}
          </h1>
          <p className="text-gray-400" style={{ color: '#9ca3af' }}>
            {isRecovery ? 'Ingresá tu email para recibir instrucciones' : 'Ingresá tus credenciales para continuar'}
          </p>
        </div>

        <form 
          onSubmit={handleSubmit} 
          className="bg-white rounded-2xl p-8 shadow-xl space-y-6"
          style={{ 
            backgroundColor: 'white', 
            borderRadius: '1rem', 
            padding: '2rem', 
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
            display: 'flex',
            flexDirection: 'column',
            gap: '1.5rem'
          }}
        >
          {error && (
            <div 
              className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm"
              style={{ padding: '0.75rem', backgroundColor: '#fef2f2', border: '1px solid #fecaca', borderRadius: '0.5rem', color: '#dc2626', fontSize: '0.875rem' }}
            >
              {error}
            </div>
          )}

          {success && (
            <div 
              className="p-3 bg-green-50 border border-green-200 rounded-lg text-green-600 text-sm"
              style={{ padding: '0.75rem', backgroundColor: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '0.5rem', color: '#16a34a', fontSize: '0.875rem' }}
            >
              {success}
            </div>
          )}

          <div>
            <label 
              className="block text-sm font-medium text-gray-700 mb-2"
              style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, color: '#374151', marginBottom: '0.5rem' }}
            >
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:border-transparent"
              style={{ 
                width: '100%', 
                padding: '0.75rem 1rem', 
                border: '1px solid #d1d5db', 
                borderRadius: '0.5rem',
                fontSize: '1rem',
                boxSizing: 'border-box'
              }}
              placeholder="admin@admin.com"
            />
          </div>

          {!isRecovery && (
              <div>
                <label 
                  className="block text-sm font-medium text-gray-700 mb-2"
                  style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, color: '#374151', marginBottom: '0.5rem' }}
                >
                  Contraseña
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:border-transparent"
                  style={{ 
                    width: '100%', 
                    padding: '0.75rem 1rem', 
                    border: '1px solid #d1d5db', 
                    borderRadius: '0.5rem',
                    fontSize: '1rem',
                    boxSizing: 'border-box'
                  }}
                  placeholder="••••••••"
                />
              </div>
          )}

          <button
            type="submit"
            disabled={isLoading}
            style={{ 
              backgroundColor: accentColor, 
              color: primaryColor,
              width: '100%',
              padding: '0.75rem',
              fontWeight: 700,
              borderRadius: '0.5rem',
              border: 'none',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.5rem',
              fontSize: '1rem'
            }}
            className="w-full py-3 font-bold rounded-lg hover:opacity-90 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {isLoading && <Loader2 size={20} className="animate-spin" />}
            {isRecovery ? 'Enviar Email de Recuperación' : 'Ingresar'}
          </button>

          <div style={{ textAlign: 'center' }}>
            <button
                type="button"
                onClick={() => {
                    setIsRecovery(!isRecovery);
                    setError(null);
                    setSuccess(null);
                }}
                className="text-sm hover:underline"
                style={{ color: '#6b7280', fontSize: '0.875rem', background: 'none', border: 'none', cursor: 'pointer' }}
            >
                {isRecovery ? 'Volver al inicio de sesión' : '¿Olvidaste tu contraseña?'}
            </button>
          </div>

        </form>
      </div>
    </div>
  );
};
