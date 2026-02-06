import React, { useState } from 'react';
import { Plus, Edit2, Trash2, Tag, Calendar, AlertCircle, Save, X } from 'lucide-react';
import { useCoupon } from '../../context/CouponContext';
import { AdminLayout } from './AdminLayout';

export const AdminCoupons: React.FC = () => {
  const { coupons, addCoupon, updateCoupon, deleteCoupon } = useCoupon();
  const [isEditing, setIsEditing] = useState(false);
  const [editingCode, setEditingCode] = useState<string | null>(null);

  const [form, setForm] = useState({
    code: '',
    type: 'percentage' as 'percentage' | 'fixed',
    value: 0,
    minPurchase: 0,
    maxDiscount: 0,
    expiresAt: '',
    usageLimit: 0,
    description: '',
    active: true,
    isStackable: false,
    allowedPaymentMethods: [] as string[]
  });

  const resetForm = () => {
    setForm({
      code: '',
      type: 'percentage',
      value: 0,
      minPurchase: 0,
      maxDiscount: 0,
      expiresAt: '',
      usageLimit: 0,
      description: '',
      active: true,
      isStackable: false,
      allowedPaymentMethods: []
    });
    setIsEditing(false);
    setEditingCode(null);
  };

  const handleEdit = (coupon: any) => {
    setForm({
      code: coupon.code,
      type: coupon.type,
      value: coupon.value,
      minPurchase: coupon.minPurchase || 0,
      maxDiscount: coupon.maxDiscount || 0,
      expiresAt: coupon.expiresAt ? new Date(coupon.expiresAt).toISOString().split('T')[0] : '',
      usageLimit: coupon.usageLimit || 0,
      description: coupon.description,
      active: coupon.active !== false,
      isStackable: coupon.isStackable || false,
      allowedPaymentMethods: coupon.allowedPaymentMethods || []
    });
    setEditingCode(coupon.code);
    setIsEditing(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const couponData = {
      ...form,
      code: form.code.toUpperCase(),
      expiresAt: form.expiresAt ? new Date(form.expiresAt) : undefined,
      minPurchase: form.minPurchase || undefined,
      maxDiscount: form.maxDiscount || undefined,
      usageLimit: form.usageLimit || undefined,
      isStackable: form.isStackable,
      allowedPaymentMethods: form.allowedPaymentMethods.length > 0 ? form.allowedPaymentMethods : undefined,
    };

    if (editingCode) {
      updateCoupon(editingCode, couponData);
    } else {
      if (coupons.some(c => c.code === couponData.code)) {
        alert('Ya existe un cupón con este código');
        return;
      }
      addCoupon(couponData);
    }
    
    resetForm();
  };

  const handleDelete = (code: string) => {
    if (confirm('¿Estás seguro de eliminar este cupón?')) {
      deleteCoupon(code);
    }
  };

  const togglePaymentMethod = (method: string) => {
    setForm(prev => {
      const methods = prev.allowedPaymentMethods.includes(method)
        ? prev.allowedPaymentMethods.filter(m => m !== method)
        : [...prev.allowedPaymentMethods, method];
      return { ...prev, allowedPaymentMethods: methods };
    });
  };

  return (
    <AdminLayout>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Gestión de Cupones</h1>
          <p className="text-slate-500 mt-1">Administra los códigos de descuento y promociones</p>
        </div>
        <button
          onClick={() => { resetForm(); setIsEditing(true); }}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold transition-all bg-blue-600 text-white hover:bg-blue-700 shadow-lg shadow-blue-900/20 hover:shadow-blue-900/30"
        >
          <Plus size={20} />
          Nuevo Cupón
        </button>
      </div>

      {isEditing ? (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-8 mb-6 max-w-2xl mx-auto">
          <h3 className="text-xl font-bold text-slate-800 mb-6">
            {editingCode ? 'Editar Cupón' : 'Nuevo Cupón'}
          </h3>
          
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Código</label>
                <input
                  type="text"
                  required
                  value={form.code}
                  onChange={e => setForm({...form, code: e.target.value.toUpperCase()})}
                  className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 uppercase transition-all"
                  placeholder="Ej: VERANO2025"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Tipo</label>
                <select
                  value={form.type}
                  onChange={e => setForm({...form, type: e.target.value as any})}
                  className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                >
                  <option value="percentage">Porcentaje (%)</option>
                  <option value="fixed">Monto Fijo ($)</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Valor</label>
                <input
                  type="number"
                  required
                  min="0"
                  value={form.value}
                  onChange={e => setForm({...form, value: Number(e.target.value)})}
                  className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Compra Mínima ($)</label>
                <input
                  type="number"
                  min="0"
                  value={form.minPurchase}
                  onChange={e => setForm({...form, minPurchase: Number(e.target.value)})}
                  className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                />
              </div>
            </div>

            {form.type === 'percentage' && (
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Tope de Reintegro ($)</label>
                <input
                  type="number"
                  min="0"
                  value={form.maxDiscount}
                  onChange={e => setForm({...form, maxDiscount: Number(e.target.value)})}
                  className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                  placeholder="Opcional"
                />
              </div>
            )}

            <div className="grid grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Fecha de Expiración</label>
                <input
                  type="date"
                  value={form.expiresAt}
                  onChange={e => setForm({...form, expiresAt: e.target.value})}
                  className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Límite de Usos</label>
                <input
                  type="number"
                  min="0"
                  value={form.usageLimit}
                  onChange={e => setForm({...form, usageLimit: Number(e.target.value)})}
                  className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                  placeholder="0 = Ilimitado"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Descripción</label>
              <input
                type="text"
                required
                value={form.description}
                onChange={e => setForm({...form, description: e.target.value})}
                className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                placeholder="Descripción para el usuario"
              />
            </div>

            {/* Payment Methods Restriction */}
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
              <label className="block text-sm font-medium text-slate-700 mb-3">Métodos de Pago Permitidos</label>
              <p className="text-xs text-slate-500 mb-3">Si no seleccionás ninguno, el cupón aplica para todos los métodos.</p>
              <div className="flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={() => togglePaymentMethod('mercadopago')}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                    form.allowedPaymentMethods.includes('mercadopago')
                      ? 'bg-blue-600 text-white'
                      : 'bg-white border border-slate-200 text-slate-600 hover:border-blue-300'
                  }`}
                >
                  💳 MercadoPago
                </button>
                <button
                  type="button"
                  onClick={() => togglePaymentMethod('transfer')}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                    form.allowedPaymentMethods.includes('transfer')
                      ? 'bg-green-600 text-white'
                      : 'bg-white border border-slate-200 text-slate-600 hover:border-green-300'
                  }`}
                >
                  🏦 Transferencia
                </button>
                <button
                  type="button"
                  onClick={() => togglePaymentMethod('cash')}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                    form.allowedPaymentMethods.includes('cash')
                      ? 'bg-yellow-500 text-white'
                      : 'bg-white border border-slate-200 text-slate-600 hover:border-yellow-300'
                  }`}
                >
                  💵 Efectivo
                </button>
              </div>
            </div>

            {/* Checkboxes */}
            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-center gap-2 p-4 bg-slate-50 rounded-xl border border-slate-100">
                <input
                  type="checkbox"
                  id="active"
                  checked={form.active}
                  onChange={e => setForm({...form, active: e.target.checked})}
                  className="w-5 h-5 text-blue-600 rounded focus:ring-blue-500 border-slate-300"
                />
                <label htmlFor="active" className="text-sm font-medium text-slate-700 cursor-pointer">Cupón Activo</label>
              </div>

              <div className="flex items-center gap-2 p-4 bg-slate-50 rounded-xl border border-slate-100">
                <input
                  type="checkbox"
                  id="stackable"
                  checked={form.isStackable}
                  onChange={e => setForm({...form, isStackable: e.target.checked})}
                  className="w-5 h-5 text-purple-600 rounded focus:ring-purple-500 border-slate-300"
                />
                <label htmlFor="stackable" className="text-sm font-medium text-slate-700 cursor-pointer">
                  Acumulable
                  <span className="text-xs text-slate-500 block">Permite usar con otros cupones</span>
                </label>
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-8 pt-6 border-t border-slate-100">
              <button
                type="button"
                onClick={resetForm}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-medium text-slate-600 hover:bg-slate-100 transition-colors"
              >
                <X size={18} />
                Cancelar
              </button>
              <button
                type="submit"
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold bg-blue-600 text-white hover:bg-blue-700 shadow-lg shadow-blue-900/20 transition-all"
              >
                <Save size={18} />
                Guardar Cupón
              </button>
            </div>
          </form>
        </div>
      ) : (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
          <table className="w-full">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Código</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Descuento</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Condiciones</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Estado</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {coupons.map((coupon) => (
                <tr key={coupon.code} className="hover:bg-slate-50/50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-slate-100 rounded-lg text-slate-500">
                        <Tag size={16} />
                      </div>
                      <div>
                        <span className="font-bold text-slate-800 block">{coupon.code}</span>
                        <p className="text-xs text-slate-500 mt-0.5">{coupon.description}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-3 py-1 text-xs rounded-full font-bold ${
                      coupon.type === 'percentage' 
                        ? 'bg-blue-50 text-blue-700 border border-blue-100' 
                        : 'bg-green-50 text-green-700 border border-green-100'
                    }`}>
                      {coupon.type === 'percentage' ? `${coupon.value}% OFF` : `$${coupon.value} OFF`}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-col gap-1.5 text-xs text-slate-500">
                      {coupon.minPurchase && (
                        <span className="flex items-center gap-1.5">
                          <AlertCircle size={12} className="text-slate-400" /> Mín. ${coupon.minPurchase}
                        </span>
                      )}
                      {coupon.expiresAt && (
                        <span className="flex items-center gap-1.5">
                          <Calendar size={12} className="text-slate-400" /> Vence: {new Date(coupon.expiresAt).toLocaleDateString()}
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <div className={`w-2 h-2 rounded-full ${coupon.active !== false ? 'bg-green-500' : 'bg-slate-300'}`} />
                      <span className={`text-sm font-medium ${
                        coupon.active !== false ? 'text-green-700' : 'text-slate-500'
                      }`}>
                        {coupon.active !== false ? 'Activo' : 'Inactivo'}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleEdit(coupon)}
                        className="p-2 hover:bg-blue-50 text-slate-400 hover:text-blue-600 rounded-lg transition-colors"
                        title="Editar"
                      >
                        <Edit2 size={18} />
                      </button>
                      <button
                        onClick={() => handleDelete(coupon.code)}
                        className="p-2 hover:bg-red-50 text-slate-400 hover:text-red-600 rounded-lg transition-colors"
                        title="Eliminar"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              
              {coupons.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-6 py-16 text-center">
                    <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Tag size={32} className="text-slate-300" />
                    </div>
                    <h3 className="text-slate-800 font-medium mb-1">No hay cupones creados</h3>
                    <p className="text-slate-500 text-sm">Crea tu primer cupón para empezar a ofrecer descuentos.</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </AdminLayout>
  );
};
