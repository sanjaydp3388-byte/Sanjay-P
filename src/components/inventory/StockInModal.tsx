import React, { useState, useEffect } from 'react';
import { Product, Supplier } from '../../types/index.ts';
import { api } from '../../services/api.ts';
import { useToast } from '../../context/ToastContext.tsx';
import { useAuth } from '../../context/AuthContext.tsx';
import { ArrowDownLeft, X, AlertCircle } from 'lucide-react';

interface StockInModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  products: Product[];
  suppliers: Supplier[];
  initialProductId?: number;
}

export const StockInModal: React.FC<StockInModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  products,
  suppliers,
  initialProductId,
}) => {
  const { user } = useAuth();
  const { showToast } = useToast();

  const [productId, setProductId] = useState<number | ''>('');
  const [supplierId, setSupplierId] = useState<number | ''>('');
  const [quantity, setQuantity] = useState<number | ''>('');
  const [unitCost, setUnitCost] = useState<number | ''>('');
  const [referenceNo, setReferenceNo] = useState('');
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      const selectedId = initialProductId || (products.length > 0 ? products[0].id : '');
      setProductId(selectedId);
      setReferenceNo(`PO-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`);
      setQuantity('');
      setNotes('');
      setError(null);
    }
  }, [isOpen, initialProductId, products]);

  // When selected product changes, prefill supplier and default cost price
  useEffect(() => {
    if (productId) {
      const p = products.find((item) => item.id === Number(productId));
      if (p) {
        setSupplierId(p.supplier_id || '');
        setUnitCost(p.cost_price || 0);
      }
    }
  }, [productId, products]);

  if (!isOpen) return null;

  const selectedProduct = products.find((p) => p.id === Number(productId));
  const totalCost = (Number(quantity) || 0) * (Number(unitCost) || 0);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!productId) {
      setError('Please select a product.');
      return;
    }
    const numQty = parseInt(String(quantity), 10);
    if (!numQty || numQty <= 0) {
      setError('Quantity must be greater than 0.');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await api.inventory.stockIn({
        product_id: Number(productId),
        supplier_id: supplierId ? Number(supplierId) : undefined,
        quantity: numQty,
        unit_cost: Number(unitCost) || 0,
        reference_no: referenceNo.trim(),
        notes: notes.trim(),
        created_by: user ? `${user.first_name} ${user.last_name} (${user.role})` : 'System User',
      });

      showToast(res.message, 'success');
      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to process Stock In.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div
        id="stock-in-modal-dialog"
        className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-slate-200 p-6 overflow-hidden max-h-[90vh] flex flex-col"
      >
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-100">
              <ArrowDownLeft className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900">Stock In (Receive Goods)</h3>
              <p className="text-xs text-slate-500">Record incoming inventory replenishment</p>
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
              id="stock-in-product-select"
              value={productId}
              onChange={(e) => setProductId(Number(e.target.value))}
              required
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm font-medium text-slate-900 focus:bg-white focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all"
            >
              <option value="">-- Choose Product --</option>
              {products.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} ({p.sku}) — Current: {p.quantity} {p.unit}
                </option>
              ))}
            </select>
          </div>

          {/* Current Stock Preview */}
          {selectedProduct && (
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/70 flex items-center justify-between text-xs">
              <div>
                <span className="text-slate-500">Current Stock:</span>{' '}
                <strong className="text-slate-900 font-bold">{selectedProduct.quantity} {selectedProduct.unit}</strong>
              </div>
              <div>
                <span className="text-slate-500">Min Threshold:</span>{' '}
                <strong className="text-slate-900 font-bold">{selectedProduct.min_stock} {selectedProduct.unit}</strong>
              </div>
            </div>
          )}

          {/* Quantity & Unit Cost */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Quantity to Inward <span className="text-rose-500">*</span>
              </label>
              <input
                id="stock-in-quantity-input"
                type="number"
                min="1"
                step="1"
                required
                value={quantity}
                onChange={(e) => setQuantity(e.target.value === '' ? '' : parseInt(e.target.value, 10))}
                placeholder="e.g. 25"
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm font-medium text-slate-900 focus:bg-white focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Unit Cost Price ($)
              </label>
              <input
                id="stock-in-cost-input"
                type="number"
                min="0"
                step="0.01"
                value={unitCost}
                onChange={(e) => setUnitCost(e.target.value === '' ? '' : parseFloat(e.target.value))}
                placeholder="0.00"
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm font-medium text-slate-900 focus:bg-white focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all"
              />
            </div>
          </div>

          {/* Total Cost Display */}
          <div className="p-3 bg-emerald-50/70 border border-emerald-200/80 rounded-xl flex items-center justify-between">
            <span className="text-xs font-semibold text-emerald-900">Total Purchase Valuation:</span>
            <span className="text-base font-extrabold text-emerald-700">
              ${totalCost.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
          </div>

          {/* Supplier & Reference No */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Supplier
              </label>
              <select
                id="stock-in-supplier-select"
                value={supplierId}
                onChange={(e) => setSupplierId(Number(e.target.value))}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm font-medium text-slate-900 focus:bg-white focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all"
              >
                <option value="">-- Direct / Existing Supplier --</option>
                {suppliers.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.company_name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                PO / Reference Number
              </label>
              <input
                id="stock-in-reference-input"
                type="text"
                value={referenceNo}
                onChange={(e) => setReferenceNo(e.target.value)}
                placeholder="PO-2026-001"
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm font-medium text-slate-900 focus:bg-white focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all"
              />
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Receiving Notes / Memo
            </label>
            <textarea
              id="stock-in-notes-input"
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Received at Bay 3 dock, inspected packaging."
              className="w-full px-3.5 py-2 bg-slate-50 border border-slate-300 rounded-xl text-sm font-medium text-slate-900 focus:bg-white focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all"
            />
          </div>

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
              disabled={isSubmitting}
              id="stock-in-submit-btn"
              className="px-5 py-2 text-sm font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-sm shadow-emerald-600/20 transition-all disabled:opacity-50 flex items-center gap-2"
            >
              {isSubmitting ? 'Processing...' : 'Confirm Stock In'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
