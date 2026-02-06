import React, { useState, useEffect } from 'react';
import { Star, ThumbsUp, CheckCircle, User } from 'lucide-react';
import { getStoreId } from '../utils/storeDetection';

interface Review {
  id: string;
  customer_name: string;
  rating: number;
  title?: string;
  comment?: string;
  is_verified_purchase: number;
  created_at: string;
}

interface ReviewStats {
  total: number;
  average: number;
  distribution: { [key: number]: number };
}

interface ProductReviewsProps {
  productId: string;
  productName: string;
}

export const ProductReviews: React.FC<ProductReviewsProps> = ({ productId, productName }) => {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [stats, setStats] = useState<ReviewStats | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  
  const [form, setForm] = useState({
    rating: 5,
    title: '',
    comment: '',
    customerName: '',
    customerEmail: '',
  });

  useEffect(() => {
    fetchReviews();
  }, [productId]);

  // Use store ID in key for isolation
  const getStorageKey = () => {
    const storeId = getStoreId() || 'default';
    return `reviews_${storeId}_${productId}`;
  };

  const fetchReviews = () => {
    try {
      const stored = sessionStorage.getItem(getStorageKey());
      const storedReviews: Review[] = stored ? JSON.parse(stored) : [];
      setReviews(storedReviews);
      
      // Calculate stats
      if (storedReviews.length > 0) {
        const total = storedReviews.length;
        const sum = storedReviews.reduce((acc, r) => acc + r.rating, 0);
        const average = Math.round((sum / total) * 10) / 10;
        const distribution: { [key: number]: number } = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
        storedReviews.forEach(r => {
          distribution[r.rating] = (distribution[r.rating] || 0) + 1;
        });
        setStats({ total, average, distribution });
      }
    } catch (err) {
      console.error('Error fetching reviews:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.customerName) return;
    
    setSubmitting(true);
    try {
      const stored = sessionStorage.getItem(getStorageKey());
      const existingReviews: Review[] = stored ? JSON.parse(stored) : [];
      
      const newReview: Review = {
        id: `review-${Date.now()}`,
        customer_name: form.customerName,
        rating: form.rating,
        title: form.title || undefined,
        comment: form.comment || undefined,
        is_verified_purchase: 0,
        created_at: new Date().toISOString(),
      };
      
      const updatedReviews = [newReview, ...existingReviews];
      sessionStorage.setItem(getStorageKey(), JSON.stringify(updatedReviews));
      
      setSubmitted(true);
      setShowForm(false);
      setForm({ rating: 5, title: '', comment: '', customerName: '', customerEmail: '' });
      fetchReviews();
    } catch (err) {
      console.error('Error submitting review:', err);
    } finally {
      setSubmitting(false);
    }
  };

  const renderStars = (rating: number, size = 16, interactive = false) => {
    return (
      <div className="flex gap-0.5">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type={interactive ? 'button' : undefined}
            onClick={interactive ? () => setForm({ ...form, rating: star }) : undefined}
            className={interactive ? 'cursor-pointer hover:scale-110 transition-transform' : ''}
            disabled={!interactive}
          >
            <Star
              size={size}
              className={star <= rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}
            />
          </button>
        ))}
      </div>
    );
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('es-AR', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  if (isLoading) {
    return (
      <div className="py-8 text-center text-gray-500">
        Cargando opiniones...
      </div>
    );
  }

  return (
    <div className="py-8 border-t">
      <h2 className="text-2xl font-bold mb-6">Opiniones de Clientes</h2>
      
      {/* Stats Summary */}
      {stats && stats.total > 0 && (
        <div className="bg-gray-50 p-6 rounded-xl mb-8 flex flex-col md:flex-row gap-8">
          <div className="text-center">
            <div className="text-5xl font-bold" style={{ color: 'var(--color-accent)' }}>{stats.average}</div>
            <div className="mt-2">{renderStars(Math.round(stats.average), 20)}</div>
            <div className="text-sm text-gray-500 mt-1">{stats.total} opiniones</div>
          </div>
          
          <div className="flex-1 space-y-2">
            {[5, 4, 3, 2, 1].map((rating) => {
              const count = stats.distribution[rating] || 0;
              const percentage = stats.total > 0 ? (count / stats.total) * 100 : 0;
              return (
                <div key={rating} className="flex items-center gap-2 text-sm">
                  <span className="w-4">{rating}</span>
                  <Star size={14} className="fill-yellow-400 text-yellow-400" />
                  <div className="flex-1 bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-yellow-400 h-2 rounded-full transition-all"
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                  <span className="w-8 text-gray-500">{count}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Write Review Button */}
      {!showForm && !submitted && (
        <button
          onClick={() => setShowForm(true)}
          className="mb-8 px-6 py-3 font-semibold rounded-lg transition-colors btn-accent"
        >
          Escribir una opinión
        </button>
      )}

      {/* Success message */}
      {submitted && (
        <div className="mb-8 p-4 bg-green-50 border border-green-200 rounded-lg flex items-center gap-3">
          <CheckCircle className="text-green-600" />
          <span className="text-green-800">¡Gracias por tu opinión!</span>
        </div>
      )}

      {/* Review Form */}
      {showForm && (
        <form onSubmit={handleSubmit} className="mb-8 bg-gray-50 p-6 rounded-xl space-y-4">
          <h3 className="font-semibold text-lg">Tu opinión sobre {productName}</h3>
          
          <div>
            <label className="block text-sm font-medium mb-2">Puntuación *</label>
            {renderStars(form.rating, 32, true)}
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Tu nombre *</label>
              <input
                type="text"
                required
                value={form.customerName}
                onChange={(e) => setForm({ ...form, customerName: e.target.value })}
                className="w-full px-4 py-2 border rounded-lg"
                placeholder="Juan Pérez"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Email (opcional)</label>
              <input
                type="email"
                value={form.customerEmail}
                onChange={(e) => setForm({ ...form, customerEmail: e.target.value })}
                className="w-full px-4 py-2 border rounded-lg"
                placeholder="juan@email.com"
              />
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-1">Título (opcional)</label>
            <input
              type="text"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              className="w-full px-4 py-2 border rounded-lg"
              placeholder="Excelente calidad"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-1">Tu opinión</label>
            <textarea
              value={form.comment}
              onChange={(e) => setForm({ ...form, comment: e.target.value })}
              rows={4}
              className="w-full px-4 py-2 border rounded-lg resize-none"
              placeholder="Contanos qué te pareció el producto..."
            />
          </div>
          
          <div className="flex gap-3">
            <button
              type="submit"
              disabled={submitting}
              className="px-6 py-2 font-semibold rounded-lg disabled:opacity-50 btn-accent"
            >
              {submitting ? 'Enviando...' : 'Enviar opinión'}
            </button>
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="px-6 py-2 border rounded-lg hover:bg-gray-100"
            >
              Cancelar
            </button>
          </div>
        </form>
      )}

      {/* Reviews List */}
      {reviews.length > 0 ? (
        <div className="space-y-6">
          {reviews.map((review) => (
            <div key={review.id} className="border-b pb-6">
              <div className="flex items-start justify-between mb-2">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    {renderStars(review.rating)}
                    {review.is_verified_purchase === 1 && (
                      <span className="flex items-center gap-1 text-xs text-green-600 bg-green-50 px-2 py-0.5 rounded">
                        <CheckCircle size={12} /> Compra verificada
                      </span>
                    )}
                  </div>
                  {review.title && (
                    <h4 className="font-semibold">{review.title}</h4>
                  )}
                </div>
                <span className="text-sm text-gray-500">{formatDate(review.created_at)}</span>
              </div>
              
              {review.comment && (
                <p className="text-gray-700 mb-2">{review.comment}</p>
              )}
              
              <div className="flex items-center gap-2 text-sm text-gray-500">
                <User size={14} />
                {review.customer_name}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-8 text-gray-500">
          <p>Aún no hay opiniones para este producto.</p>
          <p className="text-sm mt-1">¡Sé el primero en opinar!</p>
        </div>
      )}
    </div>
  );
};

export default ProductReviews;
