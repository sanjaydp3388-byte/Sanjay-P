import React, { useState, useEffect } from 'react';
import { InventoryTransaction, Product, PaginationMeta } from '../types/index.ts';
import { api } from '../services/api.ts';
import { useToast } from '../context/ToastContext.tsx';
import { Badge } from '../components/common/Badge.tsx';
import {
  ArrowDownUp,
  ArrowDownLeft,
  ArrowUpRight,
  Search,
  Filter,
  Calendar,
  ChevronLeft,
  ChevronRight,
  RotateCcw,
} from 'lucide-react';

interface InventoryPageProps {
  products: Product[];
  onOpenStockIn: () => void;
  onOpenStockOut: () => void;
  refreshKey: number;
}

export const InventoryPage: React.FC<InventoryPageProps> = ({
  products,
  onOpenStockIn,
  onOpenStockOut,
  refreshKey,
}) => {
  const { showToast } = useToast();

  const [transactions, setTransactions] = useState<InventoryTransaction[]>([]);
  const [pagination, setPagination] = useState<PaginationMeta>({
    total: 0,
    page: 1,
    limit: 15,
    totalPages: 1,
  });
  const [isLoading, setIsLoading] = useState(false);

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedType, setSelectedType] = useState('');
  const [selectedProductId, setSelectedProductId] = useState('');
  const [currentPage, setCurrentPage] = useState(1);

  const fetchTransactions = async () => {
    setIsLoading(true);
    try {
      const res = await api.inventory.getAll({
        search: searchTerm,
        transaction_type: selectedType,
        product_id: selectedProductId,
        page: currentPage,
        limit: 15,
      });
      setTransactions(res.data);
      setPagination(res.pagination);
    } catch (err: any) {
      showToast(err.message || 'Failed to load transaction audit trail.', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchTransactions();
  }, [searchTerm, selectedType, selectedProductId, currentPage, refreshKey]);

  const handleResetFilters = () => {
    setSearchTerm('');
    setSelectedType('');
    setSelectedProductId('');
    setCurrentPage(1);
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Header & Quick Action Buttons */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">
            Inventory Movements & Transactions
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Immutable audit log for all stock inward, outward, and transfer movements
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={onOpenStockIn}
            id="inventory-stock-in-btn"
            className="flex items-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-sm font-bold shadow-md shadow-emerald-600/20 transition-all cursor-pointer"
          >
            <ArrowDownLeft className="w-4 h-4" />
            <span>Record Stock In</span>
          </button>

          <button
            onClick={onOpenStockOut}
            id="inventory-stock-out-btn"
            className="flex items-center gap-2 px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-sm font-bold shadow-md transition-all cursor-pointer"
          >
            <ArrowUpRight className="w-4 h-4" />
            <span>Record Stock Out</span>
          </button>
        </div>
      </div>

      {/* Filter Ribbon */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* Search bar */}
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              id="inventory-search-input"
              type="text"
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
              placeholder="Search reference # or SKU..."
              className="w-full pl-9 pr-3.5 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-medium text-slate-900 focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all"
            />
          </div>

          {/* Movement Type */}
          <div>
            <select
              id="inventory-type-filter"
              value={selectedType}
              onChange={(e) => {
                setSelectedType(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-medium text-slate-900 focus:bg-white focus:ring-2 focus:ring-indigo-500 transition-all"
            >
              <option value="">All Movement Types</option>
              <option value="STOCK_IN">Stock In (Purchases / Inward)</option>
              <option value="STOCK_OUT">Stock Out (Dispatches / Sales)</option>
            </select>
          </div>

          {/* Product Filter */}
          <div>
            <select
              id="inventory-product-filter"
              value={selectedProductId}
              onChange={(e) => {
                setSelectedProductId(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-medium text-slate-900 focus:bg-white focus:ring-2 focus:ring-indigo-500 transition-all"
            >
              <option value="">All Products</option>
              {products.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} ({p.sku})
                </option>
              ))}
            </select>
          </div>

          {/* Reset button */}
          <div className="flex items-center gap-2">
            {(searchTerm || selectedType || selectedProductId) && (
              <button
                onClick={handleResetFilters}
                className="flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-bold text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors w-full"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Reset Filters</span>
              </button>
            )}
            <span className="text-xs font-semibold text-slate-500 ml-auto whitespace-nowrap">
              {pagination.total} Total Records
            </span>
          </div>
        </div>
      </div>

      {/* Transactions Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50/90 text-slate-600 font-bold uppercase tracking-wider border-b border-slate-200">
              <tr>
                <th className="py-3.5 px-4">Timestamp</th>
                <th className="py-3.5 px-3">Product Name & SKU</th>
                <th className="py-3.5 px-3">Movement</th>
                <th className="py-3.5 px-3 text-right">Quantity</th>
                <th className="py-3.5 px-3 text-center">Stock Change</th>
                <th className="py-3.5 px-3">Reference No</th>
                <th className="py-3.5 px-3">Reason / Memo</th>
                <th className="py-3.5 px-4">Operator</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {isLoading ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400">
                    Loading audit transactions...
                  </td>
                </tr>
              ) : transactions.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400">
                    No transactions found for the specified criteria.
                  </td>
                </tr>
              ) : (
                transactions.map((tx) => (
                  <tr key={tx.id} className="hover:bg-slate-50/60 transition-colors">
                    {/* Timestamp */}
                    <td className="py-3.5 px-4 text-slate-500 whitespace-nowrap">
                      <div className="font-semibold text-slate-700">
                        {new Date(tx.created_at).toLocaleDateString()}
                      </div>
                      <div className="text-[10px] text-slate-400 font-mono">
                        {new Date(tx.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                      </div>
                    </td>

                    {/* Product */}
                    <td className="py-3.5 px-3">
                      <span className="font-bold text-slate-900 block truncate max-w-[180px]">
                        {tx.product_name}
                      </span>
                      <span className="font-mono text-[10px] text-indigo-600 bg-indigo-50 px-1 py-0.2 rounded font-semibold">
                        {tx.product_sku}
                      </span>
                    </td>

                    {/* Type */}
                    <td className="py-3.5 px-3">
                      <Badge status={tx.transaction_type === 'STOCK_IN' ? 'Stock In' : 'Stock Out'} />
                    </td>

                    {/* Quantity */}
                    <td className="py-3.5 px-3 text-right">
                      <span
                        className={`font-black text-sm ${
                          tx.transaction_type === 'STOCK_IN' ? 'text-emerald-600' : 'text-purple-600'
                        }`}
                      >
                        {tx.transaction_type === 'STOCK_IN' ? `+${tx.quantity}` : `-${tx.quantity}`}
                      </span>
                    </td>

                    {/* Stock Change (Prev -> New) */}
                    <td className="py-3.5 px-3 text-center font-mono">
                      <span className="text-slate-400">{tx.previous_stock}</span>
                      <span className="text-slate-300 mx-1.5">→</span>
                      <span className="font-bold text-slate-900">{tx.updated_stock}</span>
                    </td>

                    {/* Reference No */}
                    <td className="py-3.5 px-3 font-mono text-slate-700 font-medium">
                      {tx.reference_no || '—'}
                    </td>

                    {/* Notes */}
                    <td className="py-3.5 px-3 text-slate-500 max-w-[180px] truncate" title={tx.notes || tx.reason || ''}>
                      {tx.notes || tx.reason || '—'}
                    </td>

                    {/* Operator */}
                    <td className="py-3.5 px-4 text-slate-600 truncate max-w-[130px]">
                      {tx.created_by || tx.user_name || 'System'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Bar */}
        <div className="p-4 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500">
          <div>
            Showing <strong className="text-slate-900 font-bold">{transactions.length}</strong> of{' '}
            <strong className="text-slate-900 font-bold">{pagination.total}</strong> transactions (Page {pagination.page} of {pagination.totalPages})
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
              disabled={currentPage === 1}
              className="p-2 border border-slate-200 rounded-xl hover:bg-slate-50 text-slate-700 disabled:opacity-40 disabled:pointer-events-none transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="px-3 py-1 font-semibold text-slate-900">
              {currentPage} / {pagination.totalPages || 1}
            </span>
            <button
              onClick={() => setCurrentPage((prev) => Math.min(pagination.totalPages, prev + 1))}
              disabled={currentPage >= pagination.totalPages}
              className="p-2 border border-slate-200 rounded-xl hover:bg-slate-50 text-slate-700 disabled:opacity-40 disabled:pointer-events-none transition-colors"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
