import React from 'react';
import { Product } from '../types/index.ts';
import { Badge } from '../components/common/Badge.tsx';
import {
  AlertOctagon,
  AlertTriangle,
  ArrowDownLeft,
  Package,
  Truck,
  Phone,
  Mail,
  ShieldCheck,
  CheckCircle2,
} from 'lucide-react';

interface LowStockPageProps {
  lowStockItems: Product[];
  onStockIn: (productId: number) => void;
  onViewProductDetail: (id: number) => void;
}

export const LowStockPage: React.FC<LowStockPageProps> = ({
  lowStockItems,
  onStockIn,
  onViewProductDetail,
}) => {
  const outOfStock = lowStockItems.filter((i) => i.quantity <= 0);
  const criticallyLow = lowStockItems.filter((i) => i.quantity > 0 && i.quantity <= i.min_stock);

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-rose-50 text-rose-600 rounded-xl border border-rose-100">
              <AlertOctagon className="w-5 h-5" />
            </div>
            <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">Stock Alert Center</h2>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Real-time replenishment monitoring for inventory items at or below safety buffer stock
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="px-3 py-1 bg-rose-100 text-rose-800 rounded-full text-xs font-bold">
            {outOfStock.length} Out of Stock
          </span>
          <span className="px-3 py-1 bg-amber-100 text-amber-800 rounded-full text-xs font-bold">
            {criticallyLow.length} Low Stock
          </span>
        </div>
      </div>

      {lowStockItems.length === 0 ? (
        <div className="p-12 text-center bg-white rounded-3xl border border-slate-200/80 shadow-xs max-w-md mx-auto space-y-3">
          <div className="w-14 h-14 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto border border-emerald-100">
            <CheckCircle2 className="w-8 h-8" />
          </div>
          <h3 className="text-base font-bold text-slate-900">All Inventory Levels Healthy</h3>
          <p className="text-xs text-slate-500 leading-relaxed">
            No products currently meet or violate the low stock threshold. Safety stock reserves are fully maintained.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {lowStockItems.map((item) => {
            const isZero = item.quantity <= 0;
            const deficit = Math.max(0, item.min_stock - item.quantity);
            const reorderRecommendation = Math.max(deficit, item.max_stock - item.quantity);

            return (
              <div
                key={item.id}
                className={`bg-white rounded-2xl border p-5 shadow-xs flex flex-col justify-between transition-all hover:shadow-md ${
                  isZero ? 'border-rose-300 ring-1 ring-rose-200' : 'border-amber-200 ring-1 ring-amber-100'
                }`}
              >
                <div>
                  {/* Top Badge & SKU */}
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <span className="font-mono text-[11px] font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded">
                        {item.sku}
                      </span>
                      <h3
                        onClick={() => onViewProductDetail(item.id)}
                        className="text-base font-bold text-slate-900 mt-1 hover:text-indigo-600 transition-colors cursor-pointer leading-tight"
                      >
                        {item.name}
                      </h3>
                      <p className="text-xs text-slate-500 mt-0.5">{item.category_name}</p>
                    </div>

                    <span
                      className={`px-2.5 py-1 rounded-full text-xs font-black uppercase tracking-wider ${
                        isZero ? 'bg-rose-100 text-rose-700' : 'bg-amber-100 text-amber-700'
                      }`}
                    >
                      {isZero ? 'Depleted' : 'Low Stock'}
                    </span>
                  </div>

                  {/* Stock Comparison Grid */}
                  <div className="mt-4 p-3 bg-slate-50 rounded-xl border border-slate-100 grid grid-cols-3 text-center text-xs">
                    <div>
                      <span className="text-[10px] text-slate-400 font-semibold block uppercase">Current</span>
                      <strong className={`text-base font-black ${isZero ? 'text-rose-600' : 'text-amber-600'}`}>
                        {item.quantity}
                      </strong>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 font-semibold block uppercase">Min Buffer</span>
                      <strong className="text-base font-black text-slate-700">{item.min_stock}</strong>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 font-semibold block uppercase">Deficit</span>
                      <strong className="text-base font-black text-rose-600">-{deficit}</strong>
                    </div>
                  </div>

                  {/* Recommended Reorder Banner */}
                  <div className="mt-3 p-2.5 bg-indigo-50/70 border border-indigo-100 rounded-xl text-xs text-indigo-900 flex items-center justify-between">
                    <span className="font-semibold">Recommended PO:</span>
                    <strong className="font-black text-indigo-700">+{reorderRecommendation} {item.unit}</strong>
                  </div>

                  {/* Supplier Info */}
                  <div className="mt-4 pt-3 border-t border-slate-100 text-xs text-slate-600 space-y-1.5">
                    <div className="flex items-center gap-2">
                      <Truck className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                      <span className="font-semibold truncate">{item.supplier_name}</span>
                    </div>
                    {item.supplier_email && (
                      <div className="flex items-center gap-2 text-slate-500">
                        <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <a href={`mailto:${item.supplier_email}`} className="truncate hover:underline">
                          {item.supplier_email}
                        </a>
                      </div>
                    )}
                  </div>
                </div>

                {/* Direct Action Button */}
                <div className="mt-5 pt-3 border-t border-slate-100 flex items-center gap-2">
                  <button
                    onClick={() => onViewProductDetail(item.id)}
                    className="px-3 py-2 text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors"
                  >
                    Details
                  </button>
                  <button
                    onClick={() => onStockIn(item.id)}
                    className="flex-1 py-2 px-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-sm shadow-emerald-600/20 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <ArrowDownLeft className="w-4 h-4" />
                    <span>Create Reorder PO</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
