
import React from 'react';
import { Star, ThumbsUp, CheckCircle } from 'lucide-react';
import { Product } from '../../types';

interface ProductReviewsProps {
  product: Product;
  showSummary?: boolean;
  limit?: number;
}

// Mock reviews data
const MOCK_REVIEWS = [
  {
    id: 1,
    author: 'María G.',
    rating: 5,
    date: 'Hace 2 días',
    title: 'Excelente calidad',
    content: 'Me encantó el producto, la tela es súper suave y el calce perfecto. Llegó muy rápido.',
    verified: true,
    likes: 12
  },
  {
    id: 2,
    author: 'Lucía P.',
    rating: 4,
    date: 'Hace 1 semana',
    title: 'Muy lindo',
    content: 'El color es tal cual la foto. Un poco largo para mi gusto pero se puede arreglar.',
    verified: true,
    likes: 5
  },
  {
    id: 3,
    author: 'Sofía M.',
    rating: 5,
    date: 'Hace 2 semanas',
    title: 'Lo amo!',
    content: 'Es la segunda vez que compro y nunca defraudan. Súper recomendable.',
    verified: true,
    likes: 8
  }
];

const ProductReviews: React.FC<ProductReviewsProps> = ({
  product,
  showSummary = true,
  limit = 5
}) => {
  const reviews = MOCK_REVIEWS.slice(0, limit);
  const averageRating = 4.8;
  const totalReviews = 124;

  return (
    <div className="py-8 border-t border-gray-100">
      <div className="max-w-4xl mx-auto px-4">
        {showSummary && (
          <div className="flex flex-col md:flex-row items-center gap-8 mb-10 bg-gray-50 p-6 rounded-2xl">
            <div className="text-center md:text-left">
              <h3 className="text-lg font-semibold mb-1">Opiniones de clientes</h3>
              <div className="flex items-center gap-2 justify-center md:justify-start">
                <div className="flex text-yellow-400">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star key={star} size={24} fill="currentColor" className={star <= Math.round(averageRating) ? "" : "text-gray-300"} />
                  ))}
                </div>
                <span className="text-2xl font-bold">{averageRating}</span>
              </div>
              <p className="text-sm text-gray-500 mt-1">Basado en {totalReviews} reseñas</p>
            </div>
            
            <div className="flex-1 w-full">
              <div className="space-y-2">
                {[5, 4, 3, 2, 1].map((stars) => (
                  <div key={stars} className="flex items-center gap-2 text-sm">
                    <span className="w-3">{stars}</span>
                    <Star size={12} className="text-gray-400" />
                    <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-yellow-400 rounded-full"
                        style={{ width: stars === 5 ? '70%' : stars === 4 ? '20%' : '5%' }}
                      />
                    </div>
                    <span className="w-8 text-right text-gray-500">
                      {stars === 5 ? '70%' : stars === 4 ? '20%' : '5%'}
                    </span>
                  </div>
                ))}
              </div>
            </div>
            
            <button className="w-full md:w-auto px-6 py-3 bg-black text-white rounded-lg font-medium hover:bg-gray-800 transition-colors">
              Escribir reseña
            </button>
          </div>
        )}

        <div className="space-y-6">
          {reviews.map((review) => (
            <div key={review.id} className="border-b border-gray-100 pb-6 last:border-0">
              <div className="flex justify-between items-start mb-2">
                <div className="flex items-center gap-2">
                  <div className="flex text-yellow-400">
                    {[...Array(5)].map((_, i) => (
                      <Star 
                        key={i} 
                        size={14} 
                        fill={i < review.rating ? "currentColor" : "none"} 
                        className={i < review.rating ? "" : "text-gray-300"}
                      />
                    ))}
                  </div>
                  <span className="font-semibold text-sm">{review.author}</span>
                  {review.verified && (
                    <span className="flex items-center gap-1 text-xs text-green-600 bg-green-50 px-2 py-0.5 rounded-full">
                      <CheckCircle size={10} /> Compra verificada
                    </span>
                  )}
                </div>
                <span className="text-xs text-gray-400">{review.date}</span>
              </div>
              
              <h4 className="font-medium mb-1">{review.title}</h4>
              <p className="text-gray-600 text-sm leading-relaxed mb-3">{review.content}</p>
              
              <button className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-gray-600 transition-colors">
                <ThumbsUp size={12} />
                Útil ({review.likes})
              </button>
            </div>
          ))}
        </div>
        
        {limit < MOCK_REVIEWS.length && (
          <div className="text-center mt-8">
            <button className="text-sm font-medium underline underline-offset-4 hover:text-gray-600">
              Ver todas las reseñas
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProductReviews;
