import React, { useState } from 'react';
import { Search, Package, Truck, CheckCircle, MapPin, Clock, ExternalLink, AlertCircle } from 'lucide-react';

// Tracking status mapping
const STATUS_CONFIG: Record<string, { label: string; icon: React.ReactNode; color: string }> = {
  created: { label: 'Etiqueta Generada', icon: <Package size={20} />, color: 'var(--color-info)' },
  shipped: { label: 'Enviado', icon: <Truck size={20} />, color: 'var(--color-warning)' },
  in_transit: { label: 'En Tránsito', icon: <Truck size={20} />, color: 'var(--color-primary)' },
  delivered: { label: 'Entregado', icon: <CheckCircle size={20} />, color: 'var(--color-success)' },
  failed: { label: 'Problema', icon: <AlertCircle size={20} />, color: 'var(--color-error)' },
  pending: { label: 'Pendiente', icon: <Clock size={20} />, color: 'var(--color-text-muted)' },
};

interface TrackingEvent {
  date: string;
  time: string;
  status: string;
  location: string;
  description: string;
}

interface TrackingInfo {
  trackingNumber: string;
  status: string;
  orderNumber: string;
  customerName: string;
  shippingAddress: string;
  estimatedDelivery?: string;
  events: TrackingEvent[];
  carrier: string;
}

export default function OrderTracking() {
  const [searchQuery, setSearchQuery] = useState('');
  const [tracking, setTracking] = useState<TrackingInfo | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    setLoading(true);
    setError('');
    setTracking(null);

    try {
      // Try tracking number first, then order number
      const isOrderNumber = searchQuery.startsWith('XM-');
      const endpoint = isOrderNumber 
        ? `/api/shipping/tracking/order/${searchQuery}`
        : `/api/shipping/tracking/${searchQuery}`;
      
      const response = await fetch(endpoint);
      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'No se encontró el envío');
        return;
      }

      setTracking(data.tracking);
    } catch (err) {
      setError('Error al buscar el envío. Por favor intente nuevamente.');
    } finally {
      setLoading(false);
    }
  };

  const getStatusConfig = (status: string) => {
    return STATUS_CONFIG[status] || STATUS_CONFIG.pending;
  };

  const currentStatus = tracking ? getStatusConfig(tracking.status) : null;

  return (
    <div className="order-tracking-page">
      <div className="tracking-container">
        {/* Header */}
        <div className="tracking-header">
          <h1>Seguimiento de Envío</h1>
          <p>Ingresá tu número de seguimiento o número de orden para rastrear tu pedido</p>
        </div>

        {/* Search Form */}
        <form onSubmit={handleSearch} className="tracking-search">
          <div className="search-input-wrapper">
            <Search size={20} className="search-icon" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Ej: XMP12345ABC o XM-ABC123-XYZ"
              className="tracking-input"
            />
          </div>
          <button type="submit" className="tracking-button" disabled={loading}>
            {loading ? 'Buscando...' : 'Rastrear'}
          </button>
        </form>

        {/* Error Message */}
        {error && (
          <div className="tracking-error">
            <AlertCircle size={20} />
            <span>{error}</span>
          </div>
        )}

        {/* Tracking Results */}
        {tracking && (
          <div className="tracking-results">
            {/* Status Card */}
            <div className="status-card">
              <div className="status-icon" style={{ color: currentStatus?.color }}>
                {currentStatus?.icon}
              </div>
              <div className="status-info">
                <span className="status-label" style={{ color: currentStatus?.color }}>
                  {currentStatus?.label}
                </span>
                <span className="tracking-number">{tracking.trackingNumber}</span>
              </div>
              {tracking.estimatedDelivery && (
                <div className="estimated-delivery">
                  <Clock size={16} />
                  <span>Entrega estimada: {new Date(tracking.estimatedDelivery).toLocaleDateString('es-AR')}</span>
                </div>
              )}
            </div>

            {/* Order Info */}
            <div className="order-info-card">
              <h3>Información del Pedido</h3>
              <div className="info-grid">
                <div className="info-item">
                  <span className="info-label">Orden</span>
                  <span className="info-value">{tracking.orderNumber}</span>
                </div>
                <div className="info-item">
                  <span className="info-label">Destinatario</span>
                  <span className="info-value">{tracking.customerName}</span>
                </div>
                <div className="info-item">
                  <span className="info-label">Dirección</span>
                  <span className="info-value">{tracking.shippingAddress}</span>
                </div>
                <div className="info-item">
                  <span className="info-label">Transportista</span>
                  <span className="info-value carrier-badge">
                    {tracking.carrier === 'mock' ? 'Envío Estándar' : tracking.carrier}
                  </span>
                </div>
              </div>
            </div>

            {/* Timeline */}
            <div className="tracking-timeline">
              <h3>Historial de Envío</h3>
              <div className="timeline">
                {tracking.events.map((event, index) => {
                  const eventConfig = getStatusConfig(event.status);
                  const isLatest = index === 0;
                  
                  return (
                    <div 
                      key={index} 
                      className={`timeline-item ${isLatest ? 'latest' : ''}`}
                    >
                      <div 
                        className="timeline-dot" 
                        style={{ backgroundColor: isLatest ? eventConfig.color : 'var(--color-border)' }}
                      />
                      <div className="timeline-content">
                        <div className="timeline-header">
                          <span className="timeline-status" style={{ color: isLatest ? eventConfig.color : 'inherit' }}>
                            {eventConfig.label}
                          </span>
                          <span className="timeline-date">
                            {new Date(event.date).toLocaleDateString('es-AR')} {event.time}
                          </span>
                        </div>
                        <p className="timeline-description">{event.description}</p>
                        {event.location && (
                          <span className="timeline-location">
                            <MapPin size={14} />
                            {event.location}
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* Help Section */}
        <div className="tracking-help">
          <h4>¿Necesitás ayuda?</h4>
          <p>Si tenés algún problema con tu envío, contactanos por WhatsApp o email.</p>
        </div>
      </div>

      <style>{`
        .order-tracking-page {
          min-height: 100vh;
          padding: 2rem;
          background: var(--color-background-alt, #f5f5f5);
        }

        .tracking-container {
          max-width: 700px;
          margin: 0 auto;
        }

        .tracking-header {
          text-align: center;
          margin-bottom: 2rem;
        }

        .tracking-header h1 {
          font-size: 2rem;
          color: var(--color-text);
          margin-bottom: 0.5rem;
        }

        .tracking-header p {
          color: var(--color-text-muted);
        }

        .tracking-search {
          display: flex;
          gap: 1rem;
          margin-bottom: 2rem;
        }

        .search-input-wrapper {
          flex: 1;
          position: relative;
        }

        .search-icon {
          position: absolute;
          left: 1rem;
          top: 50%;
          transform: translateY(-50%);
          color: var(--color-text-muted);
        }

        .tracking-input {
          width: 100%;
          padding: 1rem 1rem 1rem 3rem;
          font-size: 1rem;
          border: 2px solid var(--color-border);
          border-radius: 12px;
          background: white;
          transition: border-color 0.2s;
        }

        .tracking-input:focus {
          outline: none;
          border-color: var(--color-primary);
        }

        .tracking-button {
          padding: 1rem 2rem;
          font-size: 1rem;
          font-weight: 600;
          color: white;
          background: var(--color-primary);
          border: none;
          border-radius: 12px;
          cursor: pointer;
          transition: background 0.2s, transform 0.2s;
        }

        .tracking-button:hover {
          background: var(--color-primary-dark);
          transform: translateY(-2px);
        }

        .tracking-button:disabled {
          opacity: 0.7;
          cursor: not-allowed;
        }

        .tracking-error {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          padding: 1rem;
          background: rgba(220, 53, 69, 0.1);
          color: var(--color-error, #dc3545);
          border-radius: 8px;
          margin-bottom: 1.5rem;
        }

        .tracking-results {
          display: flex;
          flex-direction: column;
          gap: 1.5rem;
        }

        .status-card {
          display: flex;
          align-items: center;
          gap: 1rem;
          padding: 1.5rem;
          background: white;
          border-radius: 16px;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
        }

        .status-icon {
          width: 48px;
          height: 48px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: currentColor;
          background: rgba(var(--color-primary-rgb), 0.1);
          border-radius: 12px;
        }

        .status-info {
          flex: 1;
        }

        .status-label {
          display: block;
          font-size: 1.25rem;
          font-weight: 700;
        }

        .tracking-number {
          display: block;
          font-family: monospace;
          font-size: 0.9rem;
          color: var(--color-text-muted);
          letter-spacing: 1px;
        }

        .estimated-delivery {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.5rem 1rem;
          background: var(--color-background-alt, #f0f0f0);
          border-radius: 8px;
          font-size: 0.9rem;
        }

        .order-info-card {
          padding: 1.5rem;
          background: white;
          border-radius: 16px;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
        }

        .order-info-card h3 {
          margin-bottom: 1rem;
          font-size: 1rem;
          color: var(--color-text-muted);
          text-transform: uppercase;
          letter-spacing: 1px;
        }

        .info-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 1rem;
        }

        .info-item {
          display: flex;
          flex-direction: column;
          gap: 0.25rem;
        }

        .info-label {
          font-size: 0.8rem;
          color: var(--color-text-muted);
        }

        .info-value {
          font-weight: 500;
        }

        .carrier-badge {
          display: inline-block;
          padding: 0.25rem 0.5rem;
          background: var(--color-primary);
          color: white;
          border-radius: 6px;
          font-size: 0.85rem;
        }

        .tracking-timeline {
          padding: 1.5rem;
          background: white;
          border-radius: 16px;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
        }

        .tracking-timeline h3 {
          margin-bottom: 1.5rem;
          font-size: 1rem;
          color: var(--color-text-muted);
          text-transform: uppercase;
          letter-spacing: 1px;
        }

        .timeline {
          position: relative;
          padding-left: 2rem;
        }

        .timeline::before {
          content: '';
          position: absolute;
          left: 7px;
          top: 0;
          bottom: 0;
          width: 2px;
          background: var(--color-border);
        }

        .timeline-item {
          position: relative;
          padding-bottom: 1.5rem;
        }

        .timeline-item:last-child {
          padding-bottom: 0;
        }

        .timeline-dot {
          position: absolute;
          left: -2rem;
          top: 4px;
          width: 16px;
          height: 16px;
          border-radius: 50%;
          border: 3px solid white;
          box-shadow: 0 0 0 2px var(--color-border);
        }

        .timeline-item.latest .timeline-dot {
          box-shadow: 0 0 0 4px rgba(var(--color-primary-rgb), 0.2);
        }

        .timeline-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 0.25rem;
        }

        .timeline-status {
          font-weight: 600;
        }

        .timeline-date {
          font-size: 0.8rem;
          color: var(--color-text-muted);
        }

        .timeline-description {
          margin: 0.25rem 0;
          color: var(--color-text-muted);
        }

        .timeline-location {
          display: inline-flex;
          align-items: center;
          gap: 0.25rem;
          font-size: 0.85rem;
          color: var(--color-text-muted);
        }

        .tracking-help {
          margin-top: 2rem;
          padding: 1.5rem;
          background: white;
          border-radius: 16px;
          text-align: center;
        }

        .tracking-help h4 {
          margin-bottom: 0.5rem;
        }

        .tracking-help p {
          color: var(--color-text-muted);
          margin: 0;
        }

        @media (max-width: 640px) {
          .tracking-search {
            flex-direction: column;
          }

          .info-grid {
            grid-template-columns: 1fr;
          }

          .status-card {
            flex-wrap: wrap;
          }

          .estimated-delivery {
            width: 100%;
            justify-content: center;
          }
        }
      `}</style>
    </div>
  );
}
