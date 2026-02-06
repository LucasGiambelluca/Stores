import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';
import { eq, sql } from 'drizzle-orm';
import { db, users, type User } from '../db/drizzle.js';
import { generateTokenPair, refreshAccessToken, AuthUser } from '../middleware/auth.js';
import { logAudit } from './audit.service.js';
import { env } from '../env.js';
import { withStore } from '../db/rls.js';
import { sendPasswordReset } from './email.service.js';
import { storeService } from './store.service.js';

export class AuthService {
  async register(data: { email: string; password: string; name?: string; phone?: string; storeName?: string }, storeId?: string) {
    const { email, password, name, phone, storeName } = data;

    // Password strength validation
    if (password.length < 8) {
      throw new Error('La contraseña debe tener al menos 8 caracteres');
    }

    // CASE 1: New Store Creation (No storeId context, but storeName provided)
    if (!storeId && storeName) {
      // Check if domain/store name is available
      const domain = storeName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
      const isAvailable = await storeService.checkDomainAvailability(domain);
      
      if (!isAvailable) {
        throw new Error('El nombre de la tienda no está disponible');
      }

      // Create store
      const { store } = await storeService.createStore({
        name: storeName,
        ownerEmail: email,
        ownerName: name
      });
      
      const newStoreId = store.id;

      // Create Admin User for this store
      const hashedPassword = await bcrypt.hash(password, 10);
      const userId = uuidv4();
      
      await db.insert(users).values({
        id: userId,
        storeId: newStoreId,
        email,
        password: hashedPassword,
        name: name ?? null,
        phone: phone ?? null,
        role: 'admin', // Owner is admin
      });

      const user: AuthUser = { 
        id: userId, 
        email, 
        role: 'admin', 
        storeId: newStoreId,
        name 
      };
      const tokens = generateTokenPair(user);

      return {
        message: 'Tienda y usuario creados exitosamente',
        user: { id: userId, email, name, role: 'admin', storeId: newStoreId },
        store: store,
        token: tokens.accessToken,
        refreshToken: tokens.refreshToken
      };
    }

    // CASE 2: Customer Registration (Requires storeId context)
    if (!storeId) {
      throw new Error('Store context required for registration');
    }

    return await withStore(storeId, async (tx) => {
      // Check if user exists in this store
      const existing = await tx.select({ id: users.id })
        .from(users)
        .where(eq(users.email, email))
        .limit(1);
      
      if (existing.length > 0) {
        throw new Error('El email ya está registrado');
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(password, 10);

      // Create user
      const id = uuidv4();
      await tx.insert(users).values({
        id,
        storeId: storeId!,
        email,
        password: hashedPassword,
        name: name ?? null,
        phone: phone ?? null,
        role: 'customer',
      });

      const user: AuthUser = { 
        id, 
        email, 
        role: 'customer', 
        storeId: storeId!,
        name 
      };
      const tokens = generateTokenPair(user);

      return {
        message: 'Usuario registrado exitosamente',
        user: { id, email, name, role: 'customer', storeId: storeId },
        token: tokens.accessToken,
        refreshToken: tokens.refreshToken
      };
    });
  }

  async login(data: { email: string; password: string }, context: { storeId?: string; storeDomain?: string; ip?: string; userAgent?: string }) {
    const { email, password } = data;
    const { storeId, storeDomain, ip, userAgent } = context;
    const reqInfo = { ip, userAgent };

    console.log(`[Login] Attempting login for: ${email}`);
    console.log(`[Login] Store Context: ${storeId || 'None'} (${storeDomain || 'None'})`);

    let user: User | undefined;

    if (storeId) {
      user = await withStore(storeId, async (tx) => {
        const [u] = await tx.select().from(users).where(eq(users.email, email)).limit(1);
        return u;
      });
    } else {
      // Fallback for non-store context (e.g. super admin on main domain)
      // SECURITY: Only allow super_admin to login without store context
      const [u] = await db.select().from(users).where(eq(users.email, email)).limit(1);
      
      if (u && u.role !== 'super_admin') {
        console.log(`[Login] Blocked global login attempt for non-super_admin: ${email}`);
        
        logAudit({
          action: 'login_failed',
          userEmail: email,
          details: 'Intento de login global bloqueado (Tenant Leak Prevention)',
          ...reqInfo,
        });

        throw new Error('Credenciales inválidas');
      }
      
      user = u;
    }
    
    if (!user) {
      console.log('[Login] User not found');
      logAudit({
        action: 'login_failed',
        userEmail: email,
        details: 'Usuario no encontrado',
        ...reqInfo,
      });
      throw new Error('Credenciales inválidas');
    }

    // Check if user belongs to the store (if storeId is present)
    if (storeId && user.storeId !== storeId && user.role !== 'super_admin') {
       console.log(`[Login] User ${user.id} belongs to store ${user.storeId}, not ${storeId}`);
       throw new Error('Credenciales inválidas');
    }

    console.log(`[Login] User found: ${user.id} (Role: ${user.role})`);

    // Verify password
    const validPassword = await bcrypt.compare(password, user.password);
    
    console.log(`[Login] Password valid: ${validPassword}`);

    if (!validPassword) {
      logAudit({
        action: 'login_failed',
        userId: user.id,
        userEmail: email,
        details: 'Contraseña incorrecta',
        ...reqInfo,
      });
      throw new Error('Credenciales inválidas');
    }

    const authUser: AuthUser = {
      id: user.id,
      email: user.email,
      role: user.role as 'admin' | 'staff' | 'customer',
      storeId: user.storeId,
      name: user.name ?? undefined
    };

    const tokens = generateTokenPair(authUser);

    // Log successful login
    logAudit({
      action: 'login_success',
      userId: user.id,
      userEmail: user.email,
      details: `Rol: ${user.role}`,
      ...reqInfo,
    });

    return {
      message: 'Login exitoso',
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        storeId: user.storeId,
        forcePasswordChange: user.forcePasswordChange || false
      },
      token: tokens.accessToken,
      refreshToken: tokens.refreshToken
    };
  }

  async refresh(refreshToken: string) {
    const tokens = await refreshAccessToken(refreshToken);
    
    if (!tokens) {
      throw new Error('Refresh token inválido o expirado');
    }
    
    return {
      message: 'Token renovado',
      token: tokens.accessToken,
      refreshToken: tokens.refreshToken
    };
  }

  async me(userId: string, storeId: string) {
    const user = await withStore(storeId, async (tx) => {
      const [u] = await tx
        .select({
          id: users.id,
          email: users.email,
          name: users.name,
          phone: users.phone,
          role: users.role,
          storeId: users.storeId,
          createdAt: users.createdAt,
        })
        .from(users)
        .where(eq(users.id, userId))
        .limit(1);
      return u;
    });

    if (!user) {
      throw new Error('Usuario no encontrado');
    }

    return user;
  }

  async updateProfile(userId: string, storeId: string, data: { name?: string; phone?: string }) {
    await withStore(storeId, async (tx) => {
      await tx.update(users)
        .set({
          name: data.name ?? null,
          phone: data.phone ?? null,
          updatedAt: sql`CURRENT_TIMESTAMP`,
        })
        .where(eq(users.id, userId));
    });
  }

  async changePassword(userId: string, storeId: string, data: { currentPassword: string; newPassword: string }) {
    const { currentPassword, newPassword } = data;

    await withStore(storeId, async (tx) => {
      // Get current user
      const [user] = await tx
        .select({ password: users.password })
        .from(users)
        .where(eq(users.id, userId))
        .limit(1);
      
      if (!user) {
        throw new Error('Usuario no encontrado');
      }
      
      // Verify current password
      const validPassword = await bcrypt.compare(currentPassword, user.password);
      if (!validPassword) {
        throw new Error('Contraseña actual incorrecta');
      }

      // Hash new password
      const hashedPassword = await bcrypt.hash(newPassword, 10);

      await tx.update(users)
        .set({
          password: hashedPassword,
          forcePasswordChange: false, // Clear the flag
          updatedAt: sql`CURRENT_TIMESTAMP`,
        })
        .where(eq(users.id, userId));
    });
  }

  async forgotPassword(email: string, storeId?: string) {
    // If no storeId provided (e.g. Mothership), try to find user's store by email
    let targetStoreId = storeId;
    
    if (!targetStoreId) {
      const usersList = await db.select({ storeId: users.storeId })
        .from(users)
        .where(eq(users.email, email))
        .limit(1);
      
      if (usersList.length > 0) {
        targetStoreId = usersList[0].storeId;
      } else {
        // User not found globally
        return;
      }
    }

    if (!targetStoreId) return;

    await withStore(targetStoreId, async (tx) => {
      // Find user
      const [user] = await tx.select()
        .from(users)
        .where(eq(users.email, email))
        .limit(1);

      if (!user) {
        // Don't reveal if user exists
        return;
      }

      // Generate reset token
      const resetToken = uuidv4();
      const expiresAt = new Date();
      expiresAt.setHours(expiresAt.getHours() + 1); // 1 hour expiry

      // Save token
      await tx.update(users)
        .set({
          resetToken,
          resetTokenExpiresAt: expiresAt,
          updatedAt: sql`CURRENT_TIMESTAMP`,
        })
        .where(eq(users.id, user.id));

      // Send email
      await sendPasswordReset(email, resetToken);
    });
  }

  async resetPassword(token: string, newPassword: string, storeId?: string) {
    if (newPassword.length < 8) {
      throw new Error('La contraseña debe tener al menos 8 caracteres');
    }

    // Resolve storeId from token if missing
    let targetStoreId = storeId;
    if (!targetStoreId) {
      const usersList = await db.select({ storeId: users.storeId })
        .from(users)
        .where(eq(users.resetToken, token))
        .limit(1);
      
      if (usersList.length > 0) {
        targetStoreId = usersList[0].storeId;
      } else {
        throw new Error('Token inválido o expirado');
      }
    }

    if (!targetStoreId) {
       throw new Error('Token inválido o expirado');
    }

    await withStore(targetStoreId, async (tx) => {
      // Find user by token
      const [user] = await tx.select()
        .from(users)
        .where(eq(users.resetToken, token))
        .limit(1);

      if (!user) {
        throw new Error('Token inválido o expirado');
      }

      // Check expiry
      if (!user.resetTokenExpiresAt || new Date() > user.resetTokenExpiresAt) {
        throw new Error('Token expirado');
      }

      // Hash new password
      const hashedPassword = await bcrypt.hash(newPassword, 10);

      // Update password and clear token
      await tx.update(users)
        .set({
          password: hashedPassword,
          resetToken: null,
          resetTokenExpiresAt: null,
          forcePasswordChange: false,
          updatedAt: sql`CURRENT_TIMESTAMP`,
        })
        .where(eq(users.id, user.id));
    });
  }

  async createAdminUser() {
    const adminEmail = env.ADMIN_EMAIL;
    const adminPassword = env.ADMIN_PASSWORD;

    try {
      // Check if admin exists - Global check is fine for startup script
      const existing = await db.select({ id: users.id })
        .from(users)
        .where(eq(users.email, adminEmail))
        .limit(1);
      
      if (existing.length > 0) {
        console.log('👤 Admin user already exists');
        return;
      }

      // Get first available store - admin needs to be assigned to a store
      const store = await db.query.stores.findFirst();
      
      if (!store) {
        console.log('⚠️  No stores found, skipping admin user creation');
        console.log('   Admin will be created during setup wizard');
        return;
      }

      const hashedPassword = await bcrypt.hash(adminPassword, 10);
      const id = uuidv4();

      // Create admin directly (no RLS needed for startup script)
      await db.insert(users).values({
        id,
        storeId: store.id, // Assign to first available store
        email: adminEmail,
        password: hashedPassword,
        name: 'Administrador',
        role: 'admin',
      });

      console.log(`👤 Admin user created: ${adminEmail}`);
    } catch (error) {
      console.error('Error creating admin user:', error);
    }
  }
}

export const authService = new AuthService();
