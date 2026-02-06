import { Request, Response } from 'express';
import multer from 'multer';
import * as cloudinaryService from '../services/cloudinary.service.js';

// Multer configuration - memory storage for Cloudinary upload
const storage = multer.memoryStorage();

const fileFilter = (req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
  
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Tipo de archivo no permitido. Solo JPEG, PNG, WebP y GIF.'));
  }
};

export const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB
  },
});

// Upload product image to Cloudinary
export async function uploadProductImage(req: Request, res: Response) {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No se recibió ninguna imagen' });
    }

    // Check if Cloudinary is configured
    if (!cloudinaryService.isConfigured()) {
      return res.status(500).json({ 
        error: 'Cloudinary no está configurado. Agregá las credenciales en .env' 
      });
    }

    // Use storeId for folder organization (multi-tenant)
    const storeId = req.storeId || 'default';
    const folder = `stores/${storeId}/productos`;

    const result = await cloudinaryService.uploadImage(req.file.buffer, {
      folder,
    });

    res.json({
      message: 'Imagen subida correctamente',
      url: result.url,
      publicId: result.publicId,
      width: result.width,
      height: result.height,
    });
  } catch (error) {
    console.error('Upload product image error:', error);
    res.status(500).json({ error: 'Error al subir imagen' });
  }
}

// Upload banner image to Cloudinary
export async function uploadBannerImage(req: Request, res: Response) {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No se recibió ninguna imagen' });
    }

    if (!cloudinaryService.isConfigured()) {
      return res.status(500).json({ 
        error: 'Cloudinary no está configurado' 
      });
    }

    // Use storeId for folder organization (multi-tenant)
    const storeId = req.storeId || 'default';
    const folder = `stores/${storeId}/banners`;

    const result = await cloudinaryService.uploadImage(req.file.buffer, {
      folder,
      transformation: [
        { width: 1920, crop: 'limit' },
        { quality: 'auto:good' },
      ],
    });

    res.json({
      message: 'Banner subido correctamente',
      url: result.url,
      publicId: result.publicId,
    });
  } catch (error) {
    console.error('Upload banner image error:', error);
    res.status(500).json({ error: 'Error al subir banner' });
  }
}

// Upload multiple product images
export async function uploadProductImages(req: Request, res: Response) {
  try {
    const files = req.files as Express.Multer.File[];
    
    if (!files || files.length === 0) {
      return res.status(400).json({ error: 'No se recibieron imágenes' });
    }

    if (!cloudinaryService.isConfigured()) {
      return res.status(500).json({ 
        error: 'Cloudinary no está configurado' 
      });
    }

    // Use storeId for folder organization (multi-tenant)
    const storeId = req.storeId || 'default';
    const folder = `stores/${storeId}/productos`;

    const results = await cloudinaryService.uploadImages(
      files.map(f => f.buffer),
      folder
    );

    res.json({
      message: `${results.length} imágenes subidas`,
      images: results.map(r => ({
        url: r.url,
        publicId: r.publicId,
      })),
    });
  } catch (error) {
    console.error('Upload product images error:', error);
    res.status(500).json({ error: 'Error al subir imágenes' });
  }
}

// Delete image from Cloudinary
export async function deleteImage(req: Request, res: Response) {
  try {
    const { publicId } = req.body;

    if (!publicId) {
      return res.status(400).json({ error: 'publicId requerido' });
    }

    const success = await cloudinaryService.deleteImage(publicId);

    if (success) {
      res.json({ message: 'Imagen eliminada' });
    } else {
      res.status(404).json({ error: 'No se pudo eliminar la imagen' });
    }
  } catch (error) {
    console.error('Delete image error:', error);
    res.status(500).json({ error: 'Error al eliminar imagen' });
  }
}

// Check Cloudinary configuration status
export async function checkConfig(req: Request, res: Response) {
  res.json({
    configured: cloudinaryService.isConfigured(),
    cloudName: process.env.CLOUDINARY_CLOUD_NAME || null,
  });
}

// Separate file filter for receipts (images + PDF)
const receiptFileFilter = (req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  const allowedTypes = [
    'image/jpeg', 
    'image/png', 
    'image/webp', 
    'image/gif',
    'application/pdf'
  ];
  
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Tipo de archivo no permitido. Solo JPEG, PNG, WebP, GIF o PDF.'));
  }
};

// Separate multer for receipts (allows PDF)
export const uploadReceipt = multer({
  storage,
  fileFilter: receiptFileFilter,
  limits: {
    fileSize: 15 * 1024 * 1024, // 15MB for PDFs
  },
});

// Upload receipt (payment proof) - PUBLIC endpoint
export async function uploadReceiptImage(req: Request, res: Response) {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No se recibió ningún archivo' });
    }

    if (!cloudinaryService.isConfigured()) {
      return res.status(500).json({ 
        error: 'Cloudinary no está configurado' 
      });
    }

    // Use storeId for folder organization
    const storeId = req.storeId || 'default';
    const folder = `stores/${storeId}/receipts`;

    // Detect if it's a PDF
    const isPdf = req.file.mimetype === 'application/pdf';

    const result = await cloudinaryService.uploadImage(req.file.buffer, {
      folder,
      resourceType: isPdf ? 'raw' : 'image',
    });

    res.json({
      message: 'Comprobante subido correctamente',
      url: result.url,
      publicId: result.publicId,
    });
  } catch (error) {
    console.error('Upload receipt error:', error);
    res.status(500).json({ error: 'Error al subir comprobante' });
  }
}
