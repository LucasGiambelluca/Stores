import React, { useState, useRef } from 'react';
import { Upload, X, Image as ImageIcon, Loader2, AlertCircle } from 'lucide-react';
import { getStoreHeaders } from '@/src/utils/storeDetection';
import { API_BASE } from '../../context/storeApi';

interface ImageUploadProps {
  value: string;
  onChange: (url: string) => void;
  label?: string;
  placeholder?: string;
  compact?: boolean;
}

export const ImageUpload: React.FC<ImageUploadProps> = ({
  value,
  onChange,
  label = 'Imagen',
  placeholder = 'URL de la imagen o subí una nueva',
  compact = false,
}) => {
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleUpload = async (file: File) => {
    if (!file.type.startsWith('image/')) {
      setError('Solo se permiten imágenes');
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      setError('La imagen no puede superar los 10MB');
      return;
    }

    setIsUploading(true);
    setError(null);

    try {
      const token = sessionStorage.getItem('token');
      const formData = new FormData();
      formData.append('image', file);

      const storeHeaders = getStoreHeaders();
      const response = await fetch(`${API_BASE}/upload/product`, {
        method: 'POST',
        headers: {
          ...(token && { Authorization: `Bearer ${token}` }),
          ...storeHeaders,
        },
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Error al subir imagen');
      }

      onChange(data.url);
    } catch (err: any) {
      console.error('Upload error:', err);
      setError(err.message || 'Error al subir imagen');
    } finally {
      setIsUploading(false);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleUpload(file);
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    const file = e.dataTransfer.files?.[0];
    if (file) {
      handleUpload(file);
    }
  };

  const handleClear = () => {
    onChange('');
    setError(null);
  };

  return (
    <div className="space-y-2">
      {label && (
        <label className="block text-sm font-medium text-gray-700">{label}</label>
      )}

      {/* Preview */}
      {value && (
        <div className="relative w-full h-48 bg-gray-100 rounded-lg overflow-hidden group">
          <img
            src={value}
            alt="Preview"
            className="w-full h-full object-contain"
            onError={(e) => {
              e.currentTarget.src = 'https://via.placeholder.com/400x300?text=Error';
            }}
          />
          <button
            type="button"
            onClick={handleClear}
            className="absolute top-2 right-2 p-1.5 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600"
          >
            <X size={16} />
          </button>
        </div>
      )}

      {/* Upload Zone */}
      {!value && (
        <div
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`
            relative border-2 border-dashed rounded-lg cursor-pointer
            transition-all flex flex-col items-center justify-center gap-2
            ${compact ? 'w-full aspect-square' : 'w-full h-40'}
            ${dragActive 
              ? 'border-accent bg-accent/10' 
              : 'border-gray-300 hover:border-gray-400 bg-gray-50'
            }
            ${isUploading ? 'pointer-events-none' : ''}
          `}
        >
          {isUploading ? (
            <>
              <Loader2 size={compact ? 20 : 32} className="animate-spin" style={{ color: 'var(--color-accent)' }} />
              {!compact && <span className="text-sm text-gray-500">Subiendo...</span>}
            </>
          ) : (
            <>
              <div className={`${compact ? 'w-8 h-8' : 'w-12 h-12'} bg-gray-200 rounded-full flex items-center justify-center`}>
                <Upload size={compact ? 16 : 24} className="text-gray-500" />
              </div>
              {!compact && (
                <>
                  <p className="text-sm text-gray-600 text-center px-4">
                    <span className="font-medium" style={{ color: 'var(--color-accent)' }}>Hacé clic</span> o arrastrá una imagen
                  </p>
                  <p className="text-xs text-gray-400">PNG, JPG, WebP (máx 10MB)</p>
                </>
              )}
            </>
          )}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileSelect}
            className="hidden"
          />
        </div>
      )}

      {/* URL Input - hide in compact mode */}
      {!compact && (
        <div className="flex gap-2">
          <input
            type="text"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder}
            className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded-lg focus-ring-accent"
          />
          {!value && (
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploading}
              className="px-3 py-2 rounded-lg font-medium text-sm disabled:opacity-50 flex items-center gap-1 btn-accent"
            >
              <Upload size={16} />
              Subir
            </button>
          )}
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="flex items-center gap-2 text-red-600 text-sm">
          <AlertCircle size={16} />
          {error}
        </div>
      )}
    </div>
  );
};

// Multiple images upload
interface MultiImageUploadProps {
  values: string[];
  onChange: (urls: string[]) => void;
  maxImages?: number;
  label?: string;
}

export const MultiImageUpload: React.FC<MultiImageUploadProps> = ({
  values = [],
  onChange,
  maxImages = 5,
  label = 'Imágenes adicionales',
}) => {
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleUpload = async (files: FileList) => {
    const validFiles = Array.from(files).filter(
      (f) => f.type.startsWith('image/') && f.size <= 10 * 1024 * 1024
    );

    if (validFiles.length === 0) return;

    setIsUploading(true);

    try {
      const token = sessionStorage.getItem('token');
      const formData = new FormData();
      validFiles.forEach((file) => formData.append('images', file));

      const storeHeaders = getStoreHeaders();
      const response = await fetch(`${API_BASE}/upload/products`, {
        method: 'POST',
        headers: {
          ...(token && { Authorization: `Bearer ${token}` }),
          ...storeHeaders,
        },
        body: formData,
      });

      const data = await response.json();

      if (response.ok && data.images) {
        const newUrls = data.images.map((img: any) => img.url);
        onChange([...values, ...newUrls].slice(0, maxImages));
      }
    } catch (err) {
      console.error('Upload error:', err);
    } finally {
      setIsUploading(false);
    }
  };

  const removeImage = (index: number) => {
    onChange(values.filter((_, i) => i !== index));
  };

  return (
    <div className="space-y-2">
      {label && (
        <label className="block text-sm font-medium text-gray-700">{label}</label>
      )}

      <div className="flex flex-wrap gap-2">
        {values.map((url, index) => (
          <div
            key={index}
            className="relative w-20 h-20 bg-gray-100 rounded-lg overflow-hidden group"
          >
            <img
              src={url}
              alt={`Image ${index + 1}`}
              className="w-full h-full object-cover"
            />
            <button
              type="button"
              onClick={() => removeImage(index)}
              className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <X size={20} className="text-white" />
            </button>
          </div>
        ))}

        {values.length < maxImages && (
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading}
            className="w-20 h-20 border-2 border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center gap-1 hover:border-accent transition-colors disabled:opacity-50"
          >
            {isUploading ? (
              <Loader2 size={20} className="text-gray-400 animate-spin" />
            ) : (
              <>
                <ImageIcon size={20} className="text-gray-400" />
                <span className="text-xs text-gray-400">Agregar</span>
              </>
            )}
          </button>
        )}
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        multiple
        onChange={(e) => e.target.files && handleUpload(e.target.files)}
        className="hidden"
      />

      <p className="text-xs text-gray-400">
        {values.length}/{maxImages} imágenes
      </p>
    </div>
  );
};
