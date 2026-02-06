
import { Request, Response } from 'express';
import Replicate from 'replicate';
import { env } from '../env.js';
import { configService } from '../services/config.service.js';

/**
 * AI Controller for Virtual Try-On
 * Supports two providers:
 * 1. HuggingFace (per-store API key) - Free tier available
 * 2. Replicate (global API key) - Paid ~$0.024/image
 * 
 * Priority: Store's HuggingFace key > Global Replicate key
 */

export class AIController {
  private replicate: Replicate | null = null;

  constructor() {
    // Initialize Replicate client if token is available (fallback)
    if (env.REPLICATE_API_TOKEN) {
      this.replicate = new Replicate({
        auth: env.REPLICATE_API_TOKEN,
      });
      console.log('✅ Replicate AI service configured (global fallback)');
    } else {
      console.log('ℹ️ Replicate not configured - AI requires per-store HuggingFace key');
    }
  }
  
  /**
   * Generate Virtual Try-On image
   * First tries store's HuggingFace key, then falls back to global Replicate
   */
  async generateTryOn(req: Request, res: Response) {
    try {
      const { modelImage, garmentImage, garmentType = 'upper' } = req.body;
      const storeId = req.storeId;

      if (!modelImage || !garmentImage) {
        return res.status(400).json({ 
          error: 'Se requieren imágenes del modelo y la prenda' 
        });
      }

      // Get store's HuggingFace API key
      let huggingfaceKey: string | null = null;
      if (storeId) {
        huggingfaceKey = await configService.getConfigValue('huggingface_api_key', storeId);
      }

      // Try HuggingFace first if store has a key
      if (huggingfaceKey) {
        console.log('🤖 Using store HuggingFace key for IDM-VTON...');
        
        try {
          const result = await this.generateWithHuggingFace(
            modelImage, 
            garmentImage, 
            huggingfaceKey,
            garmentType
          );
          
          return res.json({ 
            success: true, 
            imageUrl: result, 
            provider: 'huggingface',
            cost: 'Variable (depends on HF tier)'
          });
        } catch (hfError: any) {
          console.warn('⚠️ HuggingFace failed, trying Replicate fallback:', hfError.message);
          // Fall through to Replicate
        }
      }

      // Fall back to Replicate if available
      if (!this.replicate) {
        return res.status(503).json({ 
          error: 'El servicio de IA no está configurado. Configurá tu clave de HuggingFace en el panel de administración.' 
        });
      }

      console.log('🤖 Using Replicate IDM-VTON (global fallback)...');
      
      // Call Replicate cuuupid/idm-vton model
      const output = await this.replicate.run(
        "cuuupid/idm-vton:c871bb9b046607b680449ecbae55fd8c6d945e0a1948644bf2361b3d021d3ff4",
        {
          input: {
            crop: false,
            seed: 42,
            steps: 30,
            category: garmentType === 'lower' ? 'lower_body' : 'upper_body',
            force_dc: false,
            human_img: modelImage,
            garm_img: garmentImage,
            mask_only: false,
            garment_des: "clothing item"
          }
        }
      );

      // Parse Replicate output
      let imageUrl: string | null = null;
      
      if (typeof output === 'string') {
        imageUrl = output;
      } else if (Array.isArray(output) && output.length > 0) {
        imageUrl = output[0];
      } else if (output && typeof output === 'object') {
        imageUrl = (output as any).url || (output as any).image || null;
      }
      
      if (!imageUrl || typeof imageUrl !== 'string') {
        console.error('Invalid output:', output);
        throw new Error('No valid image URL in response');
      }

      console.log('✅ Image generated successfully via Replicate');
      return res.json({ 
        success: true, 
        imageUrl, 
        provider: 'replicate',
        cost: '~$0.024'
      });

    } catch (error: any) {
      console.error('❌ AI Generation Error:', error.message);
      
      let userMessage = 'Error al generar la imagen. Intentá de nuevo.';
      
      if (error.message?.includes('billing') || error.message?.includes('credit')) {
        userMessage = 'Se agotaron los créditos de IA. Verificá tu cuenta de HuggingFace.';
      } else if (error.message?.includes('rate limit') || error.message?.includes('429') || error.message?.includes('quota')) {
        userMessage = 'Límite de uso alcanzado. Esperá unos minutos e intentá de nuevo.';
      } else if (error.message?.includes('Invalid') || error.message?.includes('401') || error.message?.includes('403')) {
        userMessage = 'Clave de API inválida. Verificá tu configuración en el panel de administración.';
      } else if (error.message?.includes('timeout')) {
        userMessage = 'El procesamiento tardó demasiado. Intentá de nuevo.';
      }
      
      res.status(500).json({ 
        error: userMessage,
        details: env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  /**
   * Generate using HuggingFace Gradio client
   */
  private async generateWithHuggingFace(
    modelImage: string, 
    garmentImage: string, 
    apiKey: string,
    garmentType: string
  ): Promise<string> {
    // Dynamic import to avoid issues if not installed
    const { Client, handle_file } = await import('@gradio/client');
    
    // Connect to IDM-VTON space with authentication
    const client = await Client.connect("yisol/IDM-VTON", { 
      hf_token: apiKey as `hf_${string}`
    });

    // Fetch images as blobs
    const modelBlob = await this.fetchAsBlob(modelImage);
    const garmentBlob = await this.fetchAsBlob(garmentImage);

    // Call IDM-VTON API
    const result = await client.predict("/tryon", {
      dict: {
        background: handle_file(modelBlob),
        layers: [],
        composite: null
      },
      garm_img: handle_file(garmentBlob),
      garment_des: "clothing item",
      is_checked: true,
      is_checked_crop: false,
      denoise_steps: 30,
      seed: 42
    });

    // Extract result image URL
    if (result.data && Array.isArray(result.data) && result.data[0]) {
      const resultData = result.data[0];
      if (typeof resultData === 'string') {
        return resultData;
      } else if (resultData.url) {
        return resultData.url;
      } else if (typeof resultData === 'object' && resultData.path) {
        return resultData.path;
      }
    }
    
    throw new Error('No valid image in HuggingFace response');
  }

  /**
   * Fetch image URL or data URL as Blob
   */
  private async fetchAsBlob(imageUrl: string): Promise<Blob> {
    const response = await fetch(imageUrl);
    return response.blob();
  }

  /**
   * Check AI service status for a store
   */
  async checkStatus(req: Request, res: Response) {
    const storeId = req.storeId;
    
    // Check if store has HuggingFace key configured
    let hasHuggingFaceKey = false;
    if (storeId) {
      const hfKey = await configService.getConfigValue('huggingface_api_key', storeId);
      hasHuggingFaceKey = !!hfKey;
    }
    
    const hasReplicateFallback = !!this.replicate;
    const isAvailable = hasHuggingFaceKey || hasReplicateFallback;

    res.json({
      available: isAvailable,
      provider: hasHuggingFaceKey ? 'huggingface' : (hasReplicateFallback ? 'replicate' : 'none'),
      hasStoreKey: hasHuggingFaceKey,
      hasFallback: hasReplicateFallback,
      model: 'IDM-VTON',
      message: isAvailable 
        ? 'Probador virtual con IA disponible' 
        : 'Configurá tu clave de HuggingFace en Configuración > Integraciones para habilitar el probador virtual'
    });
  }
}

export const aiController = new AIController();
