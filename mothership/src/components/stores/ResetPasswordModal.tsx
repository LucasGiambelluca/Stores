import { useState } from 'react';
import { Key, CheckCircle, Eye, EyeOff, X } from 'lucide-react';
import Button from '../ui/Button';
import { changePasswordSchema } from '../../schemas/validation';

interface ResetPasswordModalProps {
  store: any;
  onClose: () => void;
  onReset: (password: string) => Promise<void>;
}

export default function ResetPasswordModal({ store, onClose, onReset }: ResetPasswordModalProps) {
  const [newPassword, setNewPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const handleReset = async () => {
    const result = changePasswordSchema.safeParse({ newPassword });
    if (!result.success) {
      setError(result.error.errors[0].message);
      return;
    }
    
    setLoading(true);
    setError('');
    try {
      await onReset(newPassword);
      setSuccess(true);
    } catch (err: any) {
      setError(err?.message || 'Error al resetear');
    } finally {
      setLoading(false);
    }
  };

  if (!store) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md border border-slate-200 ">
        <div className="p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
              <Key className="w-5 h-5 text-blue-600 " />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900 ">Blanquear Contraseña</h3>
              <p className="text-sm text-slate-500 ">{store.name}</p>
            </div>
          </div>

          {success ? (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
              <div className="flex items-center gap-2 text-green-700 ">
                <CheckCircle size={20} />
                <span className="font-medium">Contraseña reseteada</span>
              </div>
              <p className="text-sm text-green-600 mt-1">
                Nueva contraseña: <code className="bg-green-100 px-2 py-1 rounded font-mono">{newPassword}</code>
              </p>
              <p className="text-xs text-green-600 mt-2">El usuario deberá cambiarla al iniciar sesión.</p>
            </div>
          ) : (
            <>
              <div className="bg-slate-50 rounded-lg p-3 mb-4">
                <p className="text-xs font-medium text-slate-500 uppercase mb-1">Email del admin</p>
                <p className="font-mono text-sm text-slate-700 ">{store.ownerEmail}</p>
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium mb-1 text-slate-700 ">Nueva Contraseña</label>
                <div className="relative">
                  <input 
                    type={showPassword ? 'text' : 'password'}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Mínimo 6 caracteres"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg pr-10 bg-white text-slate-900 "
                  />
                  <button type="button" onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-600 ">
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              <Button 
                onClick={handleReset}
                disabled={loading || newPassword.length < 6}
                className="w-full"
              >
                {loading ? 'Reseteando...' : 'Resetear Contraseña'}
              </Button>
              
              {error && <p className="text-red-600 text-sm mt-2">{error}</p>}
            </>
          )}
        </div>

        <div className="border-t border-slate-100 px-6 py-3">
          <button 
            onClick={onClose}
            className="w-full py-2 text-slate-600 font-medium hover:text-slate-800 "
          >
            {success ? 'Cerrar' : 'Cancelar'}
          </button>
        </div>
      </div>
    </div>
  );
}
