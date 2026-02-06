import { useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { loginSchema, resetPasswordSchema } from '../schemas/validation';
import { apiClient } from '../api/client';

export function useAuthLogic() {
  const { login } = useAuth();
  const navigate = useNavigate();
  
  // Login State
  const [loginError, setLoginError] = useState('');
  const [isLoginLoading, setIsLoginLoading] = useState(false);

  // Forgot Password State
  const [showForgotModal, setShowForgotModal] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [resetStatus, setResetStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [resetMessage, setResetMessage] = useState('');

  const handleLogin = async (e: FormEvent, email: string, password: string) => {
    e.preventDefault();
    setLoginError('');
    
    const result = loginSchema.safeParse({ email, password });
    if (!result.success) {
      setLoginError(result.error.errors[0].message);
      return;
    }

    setIsLoginLoading(true);

    try {
      await login(email, password);
      setTimeout(() => navigate('/'), 500);
    } catch (err: any) {
      setLoginError(err.message || 'Credenciales inválidas');
      setIsLoginLoading(false);
    }
  };

  const handleForgotPassword = async (e: FormEvent) => {
    e.preventDefault();
    setResetStatus('loading');
    setResetMessage('');
    
    const result = resetPasswordSchema.safeParse({ email: resetEmail });
    if (!result.success) {
      setResetStatus('error');
      setResetMessage(result.error.errors[0].message);
      return;
    }
    
    try {
      // Use apiClient which already has the correct base URL
      await apiClient.post('/auth/forgot-password', { email: resetEmail });
      
      setResetStatus('success');
      setResetMessage('Si el correo existe, recibirás instrucciones para restablecer tu contraseña.');
    } catch (err: any) {
      setResetStatus('error');
      // Extract error message safely from axios response
      const errorMessage = err.response?.data?.message || err.message || 'Error al enviar solicitud';
      setResetMessage(errorMessage);
    }
  };

  const closeForgotModal = () => {
    setShowForgotModal(false);
    setResetStatus('idle');
    setResetEmail('');
    setResetMessage('');
  };

  return {
    // Login
    loginError,
    isLoginLoading,
    handleLogin,

    // Forgot Password
    showForgotModal, setShowForgotModal,
    resetEmail, setResetEmail,
    resetStatus,
    resetMessage,
    handleForgotPassword,
    closeForgotModal
  };
}
