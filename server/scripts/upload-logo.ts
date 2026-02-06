
import { v2 as cloudinary } from 'cloudinary';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config();

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.join(__dirname, '../..');

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

async function run() {
  try {
    console.log('🚀 Subiendo logo a Cloudinary...');
    const result = await cloudinary.uploader.upload(path.join(rootDir, 'limeLogo.png'), {
      folder: 'system',
      public_id: 'limestore-logo',
      overwrite: true,
    });
    console.log('✅ Logo subido:', result.secure_url);
    return result.secure_url;
  } catch (error) {
    console.error('❌ Error subiendo logo:', error);
    return null;
  }
}

run();
