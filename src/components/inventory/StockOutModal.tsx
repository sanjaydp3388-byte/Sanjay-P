import React, { useState, useEffect } from 'react';
import { Product } from '../../types/index.ts';
import { api } from '../../services/api.ts';
import { useToast } from '../../context/ToastContext.tsx';
import { useAuth } from '../../context/AuthContext.tsx';
import { ArrowUpRight, X, AlertCircle } from 'lucide-react';

interface StockOutModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  products: Product[];
  initialProductId?: number;
}

export const StockOutModal: React.FC<StockOutModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  products,
  initialProductId,
}) => {
  const { user } = useAuth();
  const { showToast } = useToast();

  const [productId, setProductId] = useState<number | ''>('');
  const [quantity, setQuantity] = useState<number | ''>('');
  const [reason, setReason] = useState('Customer Sales Order');
  const [referenceNo, setReferenceNo] = useState('');
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      const selectedId = initialProductId || (products.length > 0 ? products[0].id : '');
      setProductId(selectedId);
      setReferenceNo(`SO-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`);
      setQuantity('');
      setNotes('');
      setError(null);
    }
  }, [isOpen, initialProductId, products]);

  if (!isOpen) return null;

  const selectedProduct = products.find((p) => p.id === Number(productId));
  const availableStock = selectedProduct ? selectedProduct.quantity : 0;
  const numQty = parseInt(String(quantity), 10) || 0;
  const isOverStock = numQty > availableStock;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!productId) {
      setError('Please select a product.');
      return;
    }
    if (!numQty || numQty <= 0) {
      setError('Quantity must be greater than 0.');
      return;
    }
    if (numQty > availableStock) {
      setError(`Insufficient stock. Available stock is only ${availableStock} units.`);
      return;
    }
    if (!reason) {
      setError('Please specify a reason for stock out.');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await api.inventory.stockOut({
        product_id: Number(productId),
        quantity: numQty,
        reason,
        reference_no: referenceNo.trim(),
        notes: notes.trim(),
        created_by: user ? `${user.first_name} ${user.last_name} (${user.role})` : 'System User',
      });

      showToast(res.message, 'success');
      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to process Stock Out.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div
        id="stock-out-modal-dialog"
        className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-slate-200 p-6 overflow-hidden max-h-[90vh] flex flex-col"
      >
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center border border-purple-100">
              <ArrowUpRight className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900">Stock Out (Issue Goods)</h3>
              <p className="text-xs text-slate-500">Record inventory disbursement or sales issue</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {error && (
          <div className="mt-4 p-3 bg-rose-50 border border-rose-200 rounded-xl flex items-start gap-2.5 text-xs text-rose-800">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
            <span className="font-medium">{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto pt-4 space-y-4">
          {/* Product Select */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Select Product <span className="text-rose-500">*</span>
            </label>
            <select
              id="stock-out-product-select"
              value={productId}
              onChange={(e) => setProductId(Number(e.target.value))}
              required
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm font-medium text-slate-900 focus:bg-white focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all"
            >
              <option value="">-- Choose Product --</option>
              {products.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} ({p.sku}) — Available: {p.quantity} {p.unit}
                </option>
              ))}
            </select>
          </div>

          {/* Current Stock Availability Gauge */}
          {selectedProduct && (
            <div
              className={`p-3.5 rounded-xl border flex items-center justify-between transition-colors ${
                availableStock <= 0
                  ? 'bg-rose-50 border-rose-200 text-rose-900'
                  : isOverStock
                  ? 'bg-rose-50 border-rose-300 text-rose-900'
                  : 'bg-slate-50 border-slate-200/80 text-slate-800'
              }`}
            >
              <div>
                <span className="text-xs font-medium text-slate-500">Available In Stock:</span>
                <p className="text-base font-extrabold">{availableStock} {selectedProduct.unit}</p>
              </div>
              <div className="text-right">
                <span className="text-xs font-medium text-slate-500">Selling Price:</span>
                <p className="text-sm font-bold text-slate-900">${selectedProduct.unit_price.toFixed(2)}</p>
              </div>
            </div>
          )}

          {/* Quantity & Reason */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Quantity to Issue <span className="text-rose-500">*</span>
              </label>
              <input
                id="stock-out-quantity-input"
                type="number"
                min="1"
                max={availableStock > 0 ? availableStock : 1}
                step="1"
                required
                value={quantity}
                onChange={(e) => setQuantity(e.target.value === '' ? '' : parseInt(e.target.value, 10))}
                placeholder="e.g. 5"
                className={`w-full px-3.5 py-2.5 bg-slate-50 border rounded-xl text-sm font-medium text-slate-900 focus:bg-white focus:ring-2 transition-all ${
                  isOverStock
                    ? 'border-rose-400 focus:ring-rose-500 focus:border-rose-500'
                    : 'border-slate-300 focus:ring-purple-500 focus:border-purple-500'
                }`}
              />
              {isOverStock && (
                <p className="text-[11px] text-rose-600 font-medium mt-1">
                  Cannot exceed available stock ({availableStock} units)
                </p>
              )}
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Disbursement Reason <span className="text-rose-500">*</span>
              </label>
              <select
                id="stock-out-reason-select"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                required
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm font-medium text-slate-900 focus:bg-white focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all"
              >
                <option value="Customer Sales Order">Customer Sales Order</option>
                <option value="Internal Office Usage">Internal Office Usage</option>
                <option value="Transfer to Branch">Transfer to Branch</option>
                <option value="Damaged / Broken Goods">Damaged / Broken Goods</option>
                <option value="Expired / Obsolete Batch">Expired / Obsolete Batch</option>
                <option value="Return to Supplier">Return to Supplier</option>
              </select>
            </div>
          </div>

          {/* Reference No */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Sales Order / Reference Number
            </label>
            <input
              id="stock-out-reference-input"
              type="text"
              value={referenceNo}
              onChange={(e) => setReferenceNo(e.target.value)}
              placeholder="SO-2026-101"
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm font-medium text-slate-900 focus:bg-white focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all"
            />
          </div>

          {/* Notes */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Fulfillment Notes / Memo
            </label>
            <textarea
              id="stock-out-notes-input"
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Delivered to IT Department for staff onboarding."
              className="w-full px-3.5 py-2 bg-slate-50 border border-slate-300 rounded-xl text-sm font-medium text-slate-900 focus:bg-white focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all"
            />
          </div>

          {/* Remaining Stock Calculation Preview */}
          {selectedProduct && numQty > 0 && !isOverStock && (
            <div className="p-3 bg-purple-50/70 border border-purple-200/80 rounded-xl flex items-center justify-between text-xs">
              <span className="font-semibold text-purple-900">Estimated Remaining Stock:</span>
              <span className="font-extrabold text-purple-800 text-sm">
                {availableStock - numQty} {selectedProduct.unit}
              </span>
            </div>
          )}

          {/* Footer actions */}
          <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || isOverStock || availableStock <= 0}
              id="stock-out-submit-btn"
              className="px-5 py-2 text-sm font-bold text-white bg-slate-900 hover:bg-slate-800 rounded-xl shadow-sm transition-all disabled:opacity-50 flex items-center gap-2"
            >
              {isSubmitting ? 'Processing...' : 'Confirm Stock Out'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
