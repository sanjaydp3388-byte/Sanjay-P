import React, { useState, useEffect } from 'react';
import { Product, InventoryTransaction } from '../../types/index.ts';
import { api } from '../../services/api.ts';
import { Badge } from '../common/Badge.tsx';
import {
  Package,
  X,
  ArrowDownLeft,
  ArrowUpRight,
  Truck,
  Layers,
  History,
  TrendingUp,
  DollarSign,
  AlertTriangle,
} from 'lucide-react';

interface ProductDetailModalProps {
  productId: number | null;
  onClose: () => void;
  onStockIn: (productId: number) => void;
  onStockOut: (productId: number) => void;
}

export const ProductDetailModal: React.FC<ProductDetailModalProps> = ({
  productId,
  onClose,
  onStockIn,
  onStockOut,
}) => {
  const [product, setProduct] = useState<Product | null>(null);
  const [transactions, setTransactions] = useState<InventoryTransaction[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (productId) {
      setIsLoading(true);
      setError(null);
      api.products
        .getById(productId)
        .then((res) => {
          setProduct(res.product);
          setTransactions(res.transactions);
        })
        .catch((err) => setError(err.message || 'Failed to load details.'))
        .finally(() => setIsLoading(false));
    } else {
      setProduct(null);
      setTransactions([]);
    }
  }, [productId]);

  if (!productId) return null;

  const margin = product && product.unit_price > 0
    ? (((product.unit_price - product.cost_price) / product.unit_price) * 100).toFixed(1)
    : '0.0';

  const stockPercentage = product
    ? Math.min(100, Math.round((product.quantity / (product.max_stock || 100)) * 100))
    : 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div
        id="product-detail-modal-dialog"
        className="relative w-full max-w-3xl bg-white rounded-2xl shadow-2xl border border-slate-200 p-6 overflow-hidden max-h-[92vh] flex flex-col"
      >
        {/* Header */}
        <div className="flex items-start justify-between pb-4 border-b border-slate-100">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center border border-indigo-100/80 shadow-xs">
              <Package className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2.5">
                <h3 className="text-xl font-extrabold text-slate-900 tracking-tight leading-tight">
                  {product?.name || 'Loading details...'}
                </h3>
                {product && <Badge status={product.stock_status} />}
              </div>
              <p className="text-xs font-mono font-semibold text-slate-500 mt-1">
                SKU: {product?.sku} • Added: {product?.created_at ? new Date(product.created_at).toLocaleDateString() : 'N/A'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {isLoading ? (
          <div className="py-20 text-center text-slate-400 text-sm">Loading product data and transactions...</div>
        ) : error || !product ? (
          <div className="py-12 text-center text-rose-500 text-sm">{error || 'Product not found'}</div>
        ) : (
          <div className="flex-1 overflow-y-auto pt-5 space-y-6 pr-1">
            {/* Quick Metrics & Inventory Gauge */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Stock Gauge Card */}
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200/80 flex flex-col justify-between">
                <div>
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Current Stock</span>
                  <div className="flex items-baseline gap-2 mt-1">
                    <span className="text-3xl font-black text-slate-900">{product.quantity}</span>
                    <span className="text-sm font-semibold text-slate-500">{product.unit}</span>
                  </div>
                </div>

                <div className="mt-4">
                  <div className="flex justify-between text-[11px] font-semibold text-slate-500 mb-1.5">
                    <span>Min: {product.min_stock}</span>
                    <span>Max: {product.max_stock}</span>
                  </div>
                  <div className="w-full bg-slate-200 h-2.5 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        product.quantity <= 0
                          ? 'bg-rose-500'
                          : product.quantity <= product.min_stock
                          ? 'bg-amber-500'
                          : 'bg-emerald-500'
                      }`}
                      style={{ width: `${Math.max(5, stockPercentage)}%` }}
                    />
                  </div>
                </div>
              </div>

              {/* Unit Economics */}
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200/80 flex flex-col justify-between">
                <div>
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Unit Economics</span>
                  <div className="mt-2 space-y-1.5 text-xs">
                    <div className="flex justify-between">
                      <span className="text-slate-500">Selling Price:</span>
                      <strong className="text-slate-900 font-bold">${product.unit_price.toFixed(2)}</strong>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Cost Price:</span>
                      <strong className="text-slate-700">${product.cost_price.toFixed(2)}</strong>
                    </div>
                    <div className="flex justify-between pt-1 border-t border-slate-200">
                      <span className="text-slate-500">Profit Margin:</span>
                      <span className="font-extrabold text-emerald-600">+{margin}%</span>
                    </div>
                  </div>
                </div>

                <div className="mt-3 pt-2 border-t border-slate-200/70 text-[11px] text-slate-500 flex justify-between">
                  <span>Inventory Valuation:</span>
                  <strong className="text-slate-900 font-bold">
                    ${(product.quantity * product.unit_price).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                  </strong>
                </div>
              </div>

              {/* Category & Supplier */}
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200/80 flex flex-col justify-between">
                <div>
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Metadata & Vendor</span>
                  <div className="mt-2 space-y-2 text-xs">
                    <div className="flex items-center gap-2 text-slate-700">
                      <Layers className="w-4 h-4 text-indigo-500 shrink-0" />
                      <span className="truncate font-semibold">{product.category_name}</span>
                    </div>
                    <div className="flex items-center gap-2 text-slate-700">
                      <Truck className="w-4 h-4 text-blue-500 shrink-0" />
                      <span className="truncate font-semibold">{product.supplier_name}</span>
                    </div>
                    {product.supplier_email && (
                      <p className="text-[11px] text-slate-500 truncate pl-6">{product.supplier_email}</p>
                    )}
                  </div>
                </div>

                {/* Quick Actions inside Drawer */}
                <div className="mt-3 flex items-center gap-2 pt-2 border-t border-slate-200/70">
                  <button
                    onClick={() => {
                      onClose();
                      onStockIn(product.id);
                    }}
                    className="flex-1 py-1.5 px-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition-colors flex items-center justify-center gap-1"
                  >
                    <ArrowDownLeft className="w-3.5 h-3.5" />
                    <span>Stock In</span>
                  </button>
                  <button
                    onClick={() => {
                      onClose();
                      onStockOut(product.id);
                    }}
                    className="flex-1 py-1.5 px-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-bold transition-colors flex items-center justify-center gap-1"
                  >
                    <ArrowUpRight className="w-3.5 h-3.5" />
                    <span>Stock Out</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Description */}
            {product.description && (
              <div className="p-4 bg-slate-50/70 rounded-2xl border border-slate-200/70 text-xs">
                <span className="font-bold text-slate-500 uppercase tracking-wider block mb-1">Description</span>
                <p className="text-slate-700 leading-relaxed">{product.description}</p>
              </div>
            )}

            {/* Transaction History for this Product */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <History className="w-4 h-4 text-indigo-600" />
                  <h4 className="text-sm font-bold text-slate-900">Stock Movement Audit History</h4>
                </div>
                <span className="text-xs font-semibold text-slate-500">{transactions.length} record(s)</span>
              </div>

              {transactions.length === 0 ? (
                <div className="p-8 text-center bg-slate-50 rounded-2xl border border-slate-200/60 text-xs text-slate-500">
                  No stock transactions have been recorded for this product yet.
                </div>
              ) : (
                <div className="border border-slate-200 rounded-2xl overflow-hidden shadow-xs">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-100/80 text-slate-600 font-bold uppercase tracking-wider border-b border-slate-200">
                      <tr>
                        <th className="py-2.5 px-3">Date</th>
                        <th className="py-2.5 px-3">Type</th>
                        <th className="py-2.5 px-3 text-right">Quantity</th>
                        <th className="py-2.5 px-3 text-right">Updated Stock</th>
                        <th className="py-2.5 px-3">Ref No</th>
                        <th className="py-2.5 px-3">Recorded By</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {transactions.map((tx) => (
                        <tr key={tx.id} className="hover:bg-slate-50/70 transition-colors">
                          <td className="py-2.5 px-3 text-slate-500">
                            {new Date(tx.created_at).toLocaleDateString()} {new Date(tx.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </td>
                          <td className="py-2.5 px-3">
                            <Badge status={tx.transaction_type === 'STOCK_IN' ? 'Stock In' : 'Stock Out'} />
                          </td>
                          <td className={`py-2.5 px-3 text-right font-bold ${tx.transaction_type === 'STOCK_IN' ? 'text-emerald-600' : 'text-purple-600'}`}>
                            {tx.transaction_type === 'STOCK_IN' ? `+${tx.quantity}` : `-${tx.quantity}`}
                          </td>
                          <td className="py-2.5 px-3 text-right font-extrabold text-slate-900">
                            {tx.updated_stock}
                          </td>
                          <td className="py-2.5 px-3 font-mono text-slate-600">
                            {tx.reference_no || '—'}
                          </td>
                          <td className="py-2.5 px-3 text-slate-600">
                            {tx.created_by || tx.user_name || 'System'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
