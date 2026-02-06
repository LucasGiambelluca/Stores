import { Request, Response } from 'express';
import { authService } from '../services/auth.service.js';
import { getRequestInfo } from '../services/audit.service.js';
import { RegisterDto, LoginDto, RefreshTokenDto, UpdateProfileDto, ChangePasswordDto, ForgotPasswordDto, ResetPasswordDto } from '../dtos/auth.dto.js';

// Register new customer OR new store owner
export async function register(req: Request<{}, {}, RegisterDto>, res: Response) {
  try {
    const { email, password, name, phone, storeName } = req.body;
    const storeId = req.storeId;

    const result = await authService.register({ email, password, name, phone, storeName }, storeId);

    res.status(201).json(result);
  } catch (error: any) {
    console.error('Register error:', error);
    if (error.message === 'El email ya está registrado' || error.message === 'El nombre de la tienda no está disponible') {
      return res.status(400).json({ error: error.message });
    }
    if (error.message === 'Store context required for registration') {
      return res.status(400).json({ error: error.message });
    }
    res.status(500).json({ error: 'Error al registrar usuario' });
  }
}

// Login (admin or customer)
export async function login(req: Request<{}, {}, LoginDto>, res: Response) {
  try {
    const { email, password } = req.body;
    const reqInfo = getRequestInfo(req);
    const storeId = req.storeId;
    const storeDomain = req.storeDomain;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email y contraseña requeridos' });
    }

    const result = await authService.login(
      { email, password }, 
      { storeId, storeDomain, ip: reqInfo.ipAddress, userAgent: reqInfo.userAgent }
    );

    res.json(result);
  } catch (error: any) {
    console.error('Login error:', error);
    if (error.message === 'Credenciales inválidas') {
      return res.status(401).json({ error: error.message });
    }
    res.status(500).json({ error: 'Error al iniciar sesión' });
  }
}

// Refresh access token
export async function refresh(req: Request<{}, {}, RefreshTokenDto>, res: Response) {
  try {
    const { refreshToken } = req.body;
    
    if (!refreshToken) {
      return res.status(400).json({ error: 'Refresh token requerido' });
    }
    
    const result = await authService.refresh(refreshToken);
    
    res.json(result);
  } catch (error: any) {
    console.error('Refresh token error:', error);
    if (error.message === 'Refresh token inválido o expirado') {
      return res.status(401).json({ error: error.message });
    }
    res.status(500).json({ error: 'Error al renovar token' });
  }
}

// Get current user
export async function me(req: Request, res: Response) {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'No autenticado' });
    }

    const user = await authService.me(req.user.id, req.user.storeId);

    res.json({ user });
  } catch (error: any) {
    console.error('Me error:', error);
    if (error.message === 'Usuario no encontrado') {
      return res.status(404).json({ error: error.message });
    }
    res.status(500).json({ error: 'Error al obtener usuario' });
  }
}

// Update profile
export async function updateProfile(req: Request<{}, {}, UpdateProfileDto>, res: Response) {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'No autenticado' });
    }

    const { name, phone } = req.body;

    await authService.updateProfile(req.user.id, req.user.storeId, { name, phone });

    res.json({ message: 'Perfil actualizado' });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ error: 'Error al actualizar perfil' });
  }
}

// Change password
export async function changePassword(req: Request<{}, {}, ChangePasswordDto>, res: Response) {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'No autenticado' });
    }

    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ error: 'Contraseñas requeridas' });
    }

    await authService.changePassword(req.user.id, req.user.storeId, { currentPassword, newPassword });

    res.json({ message: 'Contraseña actualizada' });
  } catch (error: any) {
    console.error('Change password error:', error);
    if (error.message === 'Contraseña actual incorrecta') {
      return res.status(401).json({ error: error.message });
    }
    res.status(500).json({ error: 'Error al cambiar contraseña' });
  }
}

// Forgot password
export async function forgotPassword(req: Request<{}, {}, ForgotPasswordDto>, res: Response) {
  try {
    const { email } = req.body;
    const storeId = req.storeId;

    if (!email) {
      return res.status(400).json({ error: 'Email requerido' });
    }

    // Store ID is optional here - if not provided, service will try to find user's store
    await authService.forgotPassword(email, storeId);

    res.json({ message: 'Si el email existe, recibirás un enlace para restablecer tu contraseña' });
  } catch (error) {
    console.error('Forgot password error:', error);
    res.status(500).json({ error: 'Error al procesar solicitud' });
  }
}

// Reset password
export async function resetPassword(req: Request<{}, {}, ResetPasswordDto>, res: Response) {
  try {
    const { token, newPassword } = req.body;
    const storeId = req.storeId;

    if (!token || !newPassword) {
      return res.status(400).json({ error: 'Token y nueva contraseña requeridos' });
    }

    await authService.resetPassword(token, newPassword, storeId);

    res.json({ message: 'Contraseña restablecida exitosamente' });
  } catch (error: any) {
    console.error('Reset password error:', error);
    if (error.message === 'Token inválido o expirado' || error.message === 'Token expirado') {
      return res.status(400).json({ error: error.message });
    }
    if (error.message === 'La contraseña debe tener al menos 8 caracteres') {
        return res.status(400).json({ error: error.message });
    }
    res.status(500).json({ error: 'Error al restablecer contraseña' });
  }
}
