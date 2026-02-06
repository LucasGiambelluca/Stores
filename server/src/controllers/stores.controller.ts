import { Request, Response } from 'express';
import { storeService } from '../services/store.service.js';
import { CreateStoreDto, UpdateStoreDto, AssignLicenseDto, ResetAdminPasswordDto, BulkDeleteStoresDto } from '../dtos/store.dto.js';

/**
 * GET ALL STORES - List stores with filters and pagination
 */
export async function getAllStores(req: Request, res: Response) {
  try {
    console.log('[Stores API] Getting all stores...');
    const { status, plan, search, page = '1', limit = '20' } = req.query;
    
    const result = await storeService.getAllStores(
      parseInt(page as string),
      parseInt(limit as string),
      search as string,
      status as string,
      plan as string
    );

    console.log('[Stores API] Returning', result.stores.length, 'stores');

    res.json({ data: result });
  } catch (error) {
    console.error('Get stores error:', error);
    res.status(500).json({ error: 'Failed to get stores' });
  }
}

/**
 * GET STORE BY ID - Get single store details
 */
export async function getStoreById(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const result = await storeService.getStoreById(id);
    res.json(result);
  } catch (error: any) {
    console.error('Get store error:', error);
    if (error.message === 'Store not found') {
      return res.status(404).json({ error: error.message });
    }
    res.status(500).json({ error: 'Failed to get store' });
  }
}

/**
 * CREATE STORE - Create new store WITHOUT license
 * License must be assigned separately via /assign-license
 */
export async function createStore(req: Request<{}, {}, CreateStoreDto>, res: Response) {
  try {
    const result = await storeService.createStore(req.body);
    res.status(201).json({
      message: 'Store created successfully - assign a license to activate',
      ...result
    });
  } catch (error: any) {
    console.error('Create store error:', error);
    if (error.message === 'Name and owner email are required') {
      return res.status(400).json({ error: error.message });
    }
    res.status(500).json({ error: 'Failed to create store' });
  }
}

/**
 * CHECK DOMAIN - Check if subdomain is available
 */
export async function checkDomain(req: Request, res: Response) {
  try {
    const { subdomain } = req.query;
    if (!subdomain || typeof subdomain !== 'string') {
      return res.status(400).json({ error: 'Subdomain is required' });
    }
    
    const available = await storeService.checkDomainAvailability(subdomain);
    res.json({ available });
  } catch (error) {
    console.error('Check domain error:', error);
    res.status(500).json({ error: 'Failed to check domain' });
  }
}

/**
 * ASSIGN LICENSE - Assign a license to a store
 * The store inherits the plan from the license
 */
export async function assignLicense(req: Request<{ id: string }, {}, AssignLicenseDto>, res: Response) {
  try {
    const { id } = req.params; // storeId
    const { licenseSerial } = req.body;
    
    if (!licenseSerial) {
      return res.status(400).json({ error: 'License serial is required' });
    }
    
    const result = await storeService.assignLicenseToStore(id, licenseSerial);
    
    res.json({
      success: true,
      message: `License ${licenseSerial} assigned to store`,
      ...result
    });
  } catch (error: any) {
    console.error('Assign license error:', error);
    const knownErrors = [
      'Store not found',
      'Store already has a license assigned',
      'License not found',
      'License is already assigned to another store',
      'License has been revoked',
      'License has expired',
    ];
    if (knownErrors.includes(error.message)) {
      return res.status(400).json({ error: error.message });
    }
    res.status(500).json({ error: 'Failed to assign license' });
  }
}

/**
 * UPDATE STORE - Update store status, plan, etc.
 */
export async function updateStore(req: Request<{ id: string }, {}, UpdateStoreDto>, res: Response) {
  try {
    const { id } = req.params;
    await storeService.updateStore(id, req.body);
    res.json({ message: 'Store updated successfully' });
  } catch (error: any) {
    console.error('Update store error:', error);
    if (error.message === 'Store not found') {
      return res.status(404).json({ error: error.message });
    }
    res.status(500).json({ error: 'Failed to update store' });
  }
}

/**
 * DELETE STORE - Delete store and associated license
 */
export async function deleteStore(req: Request, res: Response) {
  try {
    const { id } = req.params;
    await storeService.deleteStore(id);
    res.json({ message: 'Store deleted successfully' });
  } catch (error: any) {
    console.error('Delete store error:', error);
    if (error.message === 'Store not found') {
      return res.status(404).json({ error: error.message });
    }
    res.status(500).json({ error: 'Failed to delete store' });
  }
}

/**
 * GET STORE STATS - Get statistics for a store
 */
export async function getStoreStats(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const result = await storeService.getStoreStats(id);
    res.json(result);
  } catch (error) {
    console.error('Get store stats error:', error);
    res.status(500).json({ error: 'Failed to get store stats' });
  }
}

/**
 * GET STORE ADMINS - Get admin users of a store
 */
export async function getStoreAdmins(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const admins = await storeService.getStoreAdmins(id);
    res.json({ admins });
  } catch (error) {
    console.error('Get store admins error:', error);
    res.status(500).json({ error: 'Failed to get store admins' });
  }
}

/**
 * RESET ADMIN PASSWORD - Reset password for a store admin
 */
export async function resetAdminPassword(req: Request<{ id: string }, {}, ResetAdminPasswordDto>, res: Response) {
  try {
    const { id } = req.params; // storeId
    const result = await storeService.resetAdminPassword(id, req.body);
    
    res.json({ 
      success: true, 
      message: `Password reset for ${result.email}`,
      email: result.email,
    });
  } catch (error: any) {
    console.error('Reset password error:', error);
    if (error.message === 'Password must be at least 6 characters' || 
        error.message === 'User does not belong to this store') {
      return res.status(400).json({ error: error.message });
    }
    if (error.message === 'User not found') {
      return res.status(404).json({ error: error.message });
    }
    res.status(500).json({ error: 'Failed to reset password' });
  }
}

/**
 * BULK DELETE STORES - Delete multiple stores at once
 */
export async function bulkDeleteStores(req: Request<{}, {}, BulkDeleteStoresDto>, res: Response) {
  try {
    const { ids } = req.body;
    const result = await storeService.bulkDeleteStores(ids);
    
    res.json({ 
      success: true, 
      message: `${result.deletedCount} store(s) deleted successfully`,
      ...result
    });
  } catch (error: any) {
    console.error('Bulk delete stores error:', error);
    if (error.message === 'Array of store IDs is required') {
      return res.status(400).json({ error: error.message });
    }
    res.status(500).json({ error: 'Failed to delete stores' });
  }
}

/**
 * GET GLOBAL STATS - Get aggregated stats for dashboard
 */
export async function getGlobalStoreStats(req: Request, res: Response) {
  try {
    const stats = await storeService.getGlobalStats();
    res.json(stats);
  } catch (error) {
    console.error('Get global stats error:', error);
    res.status(500).json({ error: 'Failed to get global stats' });
  }
}

