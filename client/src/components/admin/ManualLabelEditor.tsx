import React, { useState, useRef } from 'react';
import { X, Printer, Save, Edit3, Package, MapPin, User, Phone, Building } from 'lucide-react';

interface LabelData {
  // Sender (Remitente)
  sender: {
    name: string;
    address: string;
    city: string;
    province: string;
    postalCode: string;
    phone: string;
  };
  // Recipient (Destinatario)
  recipient: {
    name: string;
    address: string;
    city: string;
    province: string;
    postalCode: string;
    phone: string;
  };
  // Package info
  orderNumber: string;
  trackingNumber: string;
  weight?: string;
  notes?: string;
}

interface ManualLabelEditorProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (trackingNumber: string) => void;
  shipment: {
    orderId: string;
    orderNumber: string;
    customer: { name: string; email: string; phone: string };
    address: { street: string; city: string; province: string; postalCode: string };
  };
  senderConfig?: {
    name: string;
    address: string;
    city: string;
    province: string;
    postalCode: string;
    phone: string;
  };
}

export const ManualLabelEditor: React.FC<ManualLabelEditorProps> = ({
  isOpen,
  onClose,
  onSave,
  shipment,
  senderConfig,
}) => {
  const printRef = useRef<HTMLDivElement>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  
  const [labelData, setLabelData] = useState<LabelData>({
    sender: {
      name: senderConfig?.name || '',
      address: senderConfig?.address || '',
      city: senderConfig?.city || '',
      province: senderConfig?.province || '',
      postalCode: senderConfig?.postalCode || '',
      phone: senderConfig?.phone || '',
    },
    recipient: {
      name: shipment.customer.name,
      address: shipment.address.street,
      city: shipment.address.city,
      province: shipment.address.province,
      postalCode: shipment.address.postalCode,
      phone: shipment.customer.phone,
    },
    orderNumber: shipment.orderNumber,
    trackingNumber: `MAN-${Date.now().toString(36).toUpperCase()}`,
    weight: '',
    notes: '',
  });

  if (!isOpen) return null;

  const handlePrint = () => {
    const printContent = printRef.current;
    if (!printContent) return;

    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Etiqueta de Envío - ${labelData.orderNumber}</title>
          <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body { 
              font-family: Arial, sans-serif; 
              padding: 20px;
              max-width: 400px;
              margin: 0 auto;
            }
            .label-container {
              border: 3px solid #000;
              padding: 16px;
            }
            .section {
              margin-bottom: 16px;
              padding-bottom: 16px;
              border-bottom: 2px dashed #ccc;
            }
            .section:last-child {
              border-bottom: none;
              margin-bottom: 0;
              padding-bottom: 0;
            }
            .section-title {
              font-size: 10px;
              text-transform: uppercase;
              color: #666;
              margin-bottom: 4px;
              font-weight: bold;
            }
            .name {
              font-size: 16px;
              font-weight: bold;
              margin-bottom: 4px;
            }
            .address {
              font-size: 14px;
              line-height: 1.4;
            }
            .phone {
              font-size: 12px;
              color: #333;
              margin-top: 4px;
            }
            .order-info {
              display: flex;
              justify-content: space-between;
              align-items: center;
            }
            .order-number {
              font-size: 20px;
              font-weight: bold;
            }
            .tracking {
              font-size: 12px;
              font-family: monospace;
              background: #f0f0f0;
              padding: 4px 8px;
              border-radius: 4px;
            }
            .barcode-placeholder {
              text-align: center;
              padding: 20px;
              border: 1px dashed #ccc;
              margin-top: 12px;
              font-family: monospace;
              font-size: 18px;
              letter-spacing: 4px;
            }
            @media print {
              body { padding: 0; }
              .label-container { border-width: 2px; }
            }
          </style>
        </head>
        <body>
          ${printContent.innerHTML}
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => {
      printWindow.print();
      printWindow.close();
    }, 250);
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await onSave(labelData.trackingNumber);
      onClose();
    } finally {
      setIsSaving(false);
    }
  };

  const updateSender = (field: keyof LabelData['sender'], value: string) => {
    setLabelData(prev => ({
      ...prev,
      sender: { ...prev.sender, [field]: value }
    }));
  };

  const updateRecipient = (field: keyof LabelData['recipient'], value: string) => {
    setLabelData(prev => ({
      ...prev,
      recipient: { ...prev.recipient, [field]: value }
    }));
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-xl max-w-2xl w-full max-h-[95vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b sticky top-0 bg-white z-10">
          <div>
            <h2 className="text-xl font-bold">Etiqueta de Envío</h2>
            <p className="text-sm text-gray-500">Pedido {shipment.orderNumber}</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsEditing(!isEditing)}
              className={`px-3 py-2 rounded-lg flex items-center gap-2 text-sm font-medium ${
                isEditing ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <Edit3 size={16} />
              {isEditing ? 'Editando' : 'Editar'}
            </button>
            <button
              onClick={onClose}
              className="p-2 text-gray-500 hover:bg-gray-100 rounded-lg"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Label Preview / Editor */}
        <div className="p-6">
          <div ref={printRef} className="label-container border-2 border-black rounded-lg p-4 bg-white">
            {/* Order Info */}
            <div className="section flex justify-between items-center pb-4 mb-4 border-b-2 border-dashed border-gray-300">
              <div>
                <p className="text-xs text-gray-500 uppercase font-semibold">Pedido</p>
                <p className="order-number text-2xl font-bold">{labelData.orderNumber}</p>
              </div>
              <div className="text-right">
                <p className="text-xs text-gray-500 uppercase font-semibold">Tracking</p>
                {isEditing ? (
                  <input
                    type="text"
                    value={labelData.trackingNumber}
                    onChange={e => setLabelData({ ...labelData, trackingNumber: e.target.value })}
                    className="tracking font-mono text-sm bg-gray-100 px-2 py-1 rounded border"
                  />
                ) : (
                  <p className="tracking font-mono text-sm bg-gray-100 px-2 py-1 rounded">
                    {labelData.trackingNumber}
                  </p>
                )}
              </div>
            </div>

            {/* Remitente */}
            <div className="section pb-4 mb-4 border-b-2 border-dashed border-gray-300">
              <div className="flex items-center gap-2 mb-2">
                <Building size={14} className="text-gray-400" />
                <p className="section-title text-xs text-gray-500 uppercase font-semibold">Remitente</p>
              </div>
              {isEditing ? (
                <div className="grid gap-2">
                  <input
                    type="text"
                    value={labelData.sender.name}
                    onChange={e => updateSender('name', e.target.value)}
                    placeholder="Nombre"
                    className="name font-bold border rounded px-2 py-1"
                  />
                  <input
                    type="text"
                    value={labelData.sender.address}
                    onChange={e => updateSender('address', e.target.value)}
                    placeholder="Dirección"
                    className="border rounded px-2 py-1"
                  />
                  <div className="grid grid-cols-3 gap-2">
                    <input
                      type="text"
                      value={labelData.sender.city}
                      onChange={e => updateSender('city', e.target.value)}
                      placeholder="Ciudad"
                      className="border rounded px-2 py-1"
                    />
                    <input
                      type="text"
                      value={labelData.sender.province}
                      onChange={e => updateSender('province', e.target.value)}
                      placeholder="Provincia"
                      className="border rounded px-2 py-1"
                    />
                    <input
                      type="text"
                      value={labelData.sender.postalCode}
                      onChange={e => updateSender('postalCode', e.target.value)}
                      placeholder="CP"
                      className="border rounded px-2 py-1"
                    />
                  </div>
                  <input
                    type="text"
                    value={labelData.sender.phone}
                    onChange={e => updateSender('phone', e.target.value)}
                    placeholder="Teléfono"
                    className="border rounded px-2 py-1"
                  />
                </div>
              ) : (
                <>
                  <p className="name font-bold">{labelData.sender.name || '(Sin configurar)'}</p>
                  <p className="address text-sm">
                    {labelData.sender.address}<br />
                    {labelData.sender.city}, {labelData.sender.province} ({labelData.sender.postalCode})
                  </p>
                  {labelData.sender.phone && (
                    <p className="phone text-xs text-gray-600 mt-1">📞 {labelData.sender.phone}</p>
                  )}
                </>
              )}
            </div>

            {/* Destinatario */}
            <div className="section">
              <div className="flex items-center gap-2 mb-2">
                <MapPin size={14} className="text-gray-400" />
                <p className="section-title text-xs text-gray-500 uppercase font-semibold">Destinatario</p>
              </div>
              {isEditing ? (
                <div className="grid gap-2">
                  <input
                    type="text"
                    value={labelData.recipient.name}
                    onChange={e => updateRecipient('name', e.target.value)}
                    placeholder="Nombre"
                    className="name font-bold border rounded px-2 py-1 text-lg"
                  />
                  <input
                    type="text"
                    value={labelData.recipient.address}
                    onChange={e => updateRecipient('address', e.target.value)}
                    placeholder="Dirección"
                    className="border rounded px-2 py-1"
                  />
                  <div className="grid grid-cols-3 gap-2">
                    <input
                      type="text"
                      value={labelData.recipient.city}
                      onChange={e => updateRecipient('city', e.target.value)}
                      placeholder="Ciudad"
                      className="border rounded px-2 py-1"
                    />
                    <input
                      type="text"
                      value={labelData.recipient.province}
                      onChange={e => updateRecipient('province', e.target.value)}
                      placeholder="Provincia"
                      className="border rounded px-2 py-1"
                    />
                    <input
                      type="text"
                      value={labelData.recipient.postalCode}
                      onChange={e => updateRecipient('postalCode', e.target.value)}
                      placeholder="CP"
                      className="border rounded px-2 py-1"
                    />
                  </div>
                  <input
                    type="text"
                    value={labelData.recipient.phone}
                    onChange={e => updateRecipient('phone', e.target.value)}
                    placeholder="Teléfono"
                    className="border rounded px-2 py-1"
                  />
                </div>
              ) : (
                <>
                  <p className="name text-lg font-bold">{labelData.recipient.name}</p>
                  <p className="address">
                    {labelData.recipient.address}<br />
                    {labelData.recipient.city}, {labelData.recipient.province} ({labelData.recipient.postalCode})
                  </p>
                  {labelData.recipient.phone && (
                    <p className="phone text-sm text-gray-600 mt-1">📞 {labelData.recipient.phone}</p>
                  )}
                </>
              )}
            </div>

            {/* Barcode placeholder */}
            <div className="barcode-placeholder text-center py-4 border border-dashed border-gray-300 rounded mt-4">
              <p className="font-mono text-lg tracking-widest">{labelData.trackingNumber}</p>
              <p className="text-xs text-gray-400 mt-1">Código de seguimiento</p>
            </div>
          </div>

          {/* Notes (only in editor mode) */}
          {isEditing && (
            <div className="mt-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Notas / Instrucciones de envío
              </label>
              <textarea
                value={labelData.notes || ''}
                onChange={e => setLabelData({ ...labelData, notes: e.target.value })}
                placeholder="Ej: Frágil, no doblar..."
                className="w-full px-3 py-2 border rounded-lg h-20"
              />
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center justify-between gap-3 p-4 border-t bg-gray-50 sticky bottom-0">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300"
          >
            Cancelar
          </button>
          <div className="flex gap-2">
            <button
              onClick={handlePrint}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
            >
              <Printer size={18} />
              Imprimir
            </button>
            <button
              onClick={handleSave}
              disabled={isSaving}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center gap-2 disabled:bg-gray-400"
            >
              <Save size={18} />
              {isSaving ? 'Guardando...' : 'Guardar y Cerrar'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ManualLabelEditor;
