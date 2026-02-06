import { v2 as cloudinary } from 'cloudinary';

let isCloudinaryConfigured = false;

// Configure Cloudinary lazily (after dotenv loads)
function ensureCloudinaryConfig() {
  if (!isCloudinaryConfigured) {
    cloudinary.config({
      cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
      api_key: process.env.CLOUDINARY_API_KEY,
      api_secret: process.env.CLOUDINARY_API_SECRET,
    });
    isCloudinaryConfigured = true;
  }
}

export interface UploadResult {
  url: string;
  publicId: string;
  width: number;
  height: number;
  format: string;
  bytes: number;
}

/**
 * Upload an image buffer (or PDF as raw) to Cloudinary
 */
export async function uploadImage(
  buffer: Buffer,
  options: {
    folder?: string;
    filename?: string;
    transformation?: object;
    resourceType?: 'image' | 'raw';  // 'raw' for PDFs
  } = {}
): Promise<UploadResult> {
  ensureCloudinaryConfig();
  const { folder = 'productos', filename, transformation, resourceType = 'image' } = options;

  return new Promise((resolve, reject) => {
    const uploadOptions: any = {
      folder: `limestore/${folder}`,
      resource_type: resourceType,
    };

    // Only apply image-specific options for images (not PDFs)
    if (resourceType === 'image') {
      uploadOptions.format = 'webp'; // Convert to WebP for smaller size
      uploadOptions.quality = 'auto:good'; // Automatic quality optimization
      uploadOptions.fetch_format = 'auto'; // Serve best format for browser

      if (transformation) {
        uploadOptions.transformation = transformation;
      }

      // Default transformation for products: max 1200px width
      if (!transformation && folder === 'productos') {
        uploadOptions.transformation = [
          { width: 1200, crop: 'limit' },
          { quality: 'auto:good' },
          { fetch_format: 'auto' },
        ];
      }
    }

    if (filename) {
      uploadOptions.public_id = filename;
    }

    const uploadStream = cloudinary.uploader.upload_stream(
      uploadOptions,
      (error, result) => {
        if (error) {
          console.error('Cloudinary upload error:', error);
          reject(error);
        } else if (result) {
          resolve({
            url: result.secure_url,
            publicId: result.public_id,
            width: result.width || 0,
            height: result.height || 0,
            format: result.format || '',
            bytes: result.bytes,
          });
        }
      }
    );

    uploadStream.end(buffer);
  });
}

/**
 * Upload multiple images
 */
export async function uploadImages(
  buffers: Buffer[],
  folder: string = 'productos'
): Promise<UploadResult[]> {
  const results: UploadResult[] = [];
  
  for (const buffer of buffers) {
    const result = await uploadImage(buffer, { folder });
    results.push(result);
  }
  
  return results;
}

/**
 * Delete an image from Cloudinary by public ID
 */
export async function deleteImage(publicId: string): Promise<boolean> {
  ensureCloudinaryConfig();
  try {
    const result = await cloudinary.uploader.destroy(publicId);
    return result.result === 'ok';
  } catch (error) {
    console.error('Cloudinary delete error:', error);
    return false;
  }
}

/**
 * Get optimized URL for an existing image
 */
export function getOptimizedUrl(
  publicId: string,
  options: {
    width?: number;
    height?: number;
    crop?: string;
    format?: string;
  } = {}
): string {
  const { width = 800, height, crop = 'limit', format = 'auto' } = options;

  return cloudinary.url(publicId, {
    transformation: [
      { width, height, crop },
      { quality: 'auto:good' },
      { fetch_format: format },
    ],
  });
}

/**
 * Generate thumbnail URL
 */
export function getThumbnailUrl(publicId: string, size: number = 200): string {
  return cloudinary.url(publicId, {
    transformation: [
      { width: size, height: size, crop: 'fill' },
      { quality: 'auto:good' },
      { fetch_format: 'auto' },
    ],
  });
}

/**
 * Check if Cloudinary is configured
 */
export function isConfigured(): boolean {
  return !!(
    process.env.CLOUDINARY_CLOUD_NAME &&
    process.env.CLOUDINARY_API_KEY &&
    process.env.CLOUDINARY_API_SECRET
  );
}

export default cloudinary;
