import React, { useState, useEffect } from 'react';
import { Product, Category, Supplier, PaginationMeta } from '../types/index.ts';
import { api } from '../services/api.ts';
import { useAuth } from '../context/AuthContext.tsx';
import { useToast } from '../context/ToastContext.tsx';
import { Badge } from '../components/common/Badge.tsx';
import { ConfirmModal } from '../components/common/ConfirmModal.tsx';
import {
  Package,
  Plus,
  Search,
  Filter,
  ArrowUpDown,
  Eye,
  Edit2,
  Trash2,
  ArrowDownLeft,
  ArrowUpRight,
  ChevronLeft,
  ChevronRight,
  SlidersHorizontal,
  RotateCcw,
} from 'lucide-react';

interface ProductsPageProps {
  categories: Category[];
  suppliers: Supplier[];
  onOpenAddProduct: () => void;
  onOpenEditProduct: (product: Product) => void;
  onViewProductDetail: (id: number) => void;
  onOpenStockIn: (productId: number) => void;
  onOpenStockOut: (productId: number) => void;
  refreshKey: number;
}

export const ProductsPage: React.FC<ProductsPageProps> = ({
  categories,
  suppliers,
  onOpenAddProduct,
  onOpenEditProduct,
  onViewProductDetail,
  onOpenStockIn,
  onOpenStockOut,
  refreshKey,
}) => {
  const { isAdmin } = useAuth();
  const { showToast } = useToast();

  const [products, setProducts] = useState<Product[]>([]);
  const [pagination, setPagination] = useState<PaginationMeta>({
    total: 0,
    page: 1,
    limit: 10,
    totalPages: 1,
  });
  const [isLoading, setIsLoading] = useState(false);

  // Filters & Search
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedSupplier, setSelectedSupplier] = useState('');
  const [stockStatus, setStockStatus] = useState('');
  const [sortBy, setSortBy] = useState('created_at');
  const [order, setOrder] = useState('desc');
  const [currentPage, setCurrentPage] = useState(1);

  // Delete modal state
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [productToDelete, setProductToDelete] = useState<Product | null>(null);

  const fetchProducts = async () => {
    setIsLoading(true);
    try {
      const res = await api.products.getAll({
        search: searchTerm,
        category_id: selectedCategory,
        supplier_id: selectedSupplier,
        stock_status: stockStatus,
        sort_by: sortBy,
        order,
        page: currentPage,
        limit: 10,
      });
      setProducts(res.data);
      setPagination(res.pagination);
    } catch (err: any) {
      showToast(err.message || 'Failed to load products.', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, [searchTerm, selectedCategory, selectedSupplier, stockStatus, sortBy, order, currentPage, refreshKey]);

  const handleDeleteClick = (product: Product) => {
    if (!isAdmin) {
      showToast('Only Administrators have permission to delete catalog products.', 'warning');
      return;
    }
    setProductToDelete(product);
    setDeleteModalOpen(true);
  };

  const confirmDelete = async () => {
    if (!productToDelete) return;
    try {
      const res = await api.products.delete(productToDelete.id);
      showToast(res.message, 'success');
      setDeleteModalOpen(false);
      setProductToDelete(null);
      fetchProducts();
    } catch (err: any) {
      showToast(err.message || 'Failed to delete product.', 'error');
    }
  };

  const handleResetFilters = () => {
    setSearchTerm('');
    setSelectedCategory('');
    setSelectedSupplier('');
    setStockStatus('');
    setSortBy('created_at');
    setOrder('desc');
    setCurrentPage(1);
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Top Header & Add button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">Product Catalog</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Total {pagination.total} product items tracked in system
          </p>
        </div>
        <button
          onClick={onOpenAddProduct}
          id="products-add-new-btn"
          className="flex items-center justify-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-bold shadow-md shadow-indigo-600/20 transition-all cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Add New Product</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* Search bar */}
          <div className="relative sm:col-span-2 lg:col-span-1">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              id="products-search-input"
              type="text"
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
              placeholder="Search by name or SKU..."
              className="w-full pl-9 pr-3.5 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-medium text-slate-900 focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all"
            />
          </div>

          {/* Category Filter */}
          <div>
            <select
              id="products-category-filter"
              value={selectedCategory}
              onChange={(e) => {
                setSelectedCategory(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-medium text-slate-900 focus:bg-white focus:ring-2 focus:ring-indigo-500 transition-all"
            >
              <option value="">All Categories</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          {/* Stock Level Filter */}
          <div>
            <select
              id="products-stock-filter"
              value={stockStatus}
              onChange={(e) => {
                setStockStatus(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-medium text-slate-900 focus:bg-white focus:ring-2 focus:ring-indigo-500 transition-all"
            >
              <option value="">All Stock Statuses</option>
              <option value="in_stock">In Stock (Normal)</option>
              <option value="low_stock">Low Stock (Alert)</option>
              <option value="out_of_stock">Out of Stock (Depleted)</option>
            </select>
          </div>

          {/* Sort By Filter */}
          <div className="flex items-center gap-2">
            <select
              id="products-sort-filter"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="flex-1 px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-medium text-slate-900 focus:bg-white focus:ring-2 focus:ring-indigo-500 transition-all"
            >
              <option value="created_at">Date Created</option>
              <option value="name">Product Name</option>
              <option value="quantity">Stock Quantity</option>
              <option value="unit_price">Selling Price</option>
            </select>
            <button
              onClick={() => setOrder(order === 'asc' ? 'desc' : 'asc')}
              className="p-2 border border-slate-300 bg-slate-50 hover:bg-slate-100 rounded-xl text-slate-600 transition-colors"
              title={`Sorting ${order.toUpperCase()}`}
            >
              <ArrowUpDown className="w-4 h-4" />
            </button>
            {(searchTerm || selectedCategory || selectedSupplier || stockStatus) && (
              <button
                onClick={handleResetFilters}
                className="p-2 text-rose-600 hover:bg-rose-50 border border-rose-200 rounded-xl transition-colors"
                title="Reset filters"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Products Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50/90 text-slate-600 font-bold uppercase tracking-wider border-b border-slate-200">
              <tr>
                <th className="py-3.5 px-4">Item & SKU</th>
                <th className="py-3.5 px-3">Category</th>
                <th className="py-3.5 px-3">Supplier</th>
                <th className="py-3.5 px-3 text-right">In Stock</th>
                <th className="py-3.5 px-3 text-right">Unit Price</th>
                <th className="py-3.5 px-3 text-right">Cost Price</th>
                <th className="py-3.5 px-3">Status</th>
                <th className="py-3.5 px-4 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {isLoading ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400">
                    Loading inventory products...
                  </td>
                </tr>
              ) : products.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400">
                    No products matched the current search criteria.
                  </td>
                </tr>
              ) : (
                products.map((p) => {
                  return (
                    <tr key={p.id} className="hover:bg-slate-50/70 transition-colors">
                      {/* Product Name & SKU */}
                      <td className="py-3.5 px-4">
                        <span
                          onClick={() => onViewProductDetail(p.id)}
                          className="font-bold text-slate-900 block hover:text-indigo-600 transition-colors cursor-pointer"
                        >
                          {p.name}
                        </span>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="font-mono text-[11px] text-indigo-600 font-semibold bg-indigo-50 px-1.5 py-0.2 rounded">
                            {p.sku}
                          </span>
                          <span className="text-[11px] text-slate-400">Min: {p.min_stock}</span>
                        </div>
                      </td>

                      {/* Category */}
                      <td className="py-3.5 px-3 font-semibold text-slate-700">
                        {p.category_name}
                      </td>

                      {/* Supplier */}
                      <td className="py-3.5 px-3 text-slate-600 max-w-[130px] truncate">
                        {p.supplier_name}
                      </td>

                      {/* Quantity */}
                      <td className="py-3.5 px-3 text-right">
                        <div className="flex flex-col items-end">
                          <span className={`font-black text-sm ${
                            p.quantity <= 0 ? 'text-rose-600' : p.quantity <= p.min_stock ? 'text-amber-600' : 'text-slate-900'
                          }`}>
                            {p.quantity} <span className="text-[11px] font-normal text-slate-500">{p.unit}</span>
                          </span>
                        </div>
                      </td>

                      {/* Unit Price */}
                      <td className="py-3.5 px-3 text-right font-extrabold text-slate-900">
                        ${p.unit_price.toFixed(2)}
                      </td>

                      {/* Cost Price */}
                      <td className="py-3.5 px-3 text-right text-slate-600 font-medium">
                        ${p.cost_price.toFixed(2)}
                      </td>

                      {/* Status */}
                      <td className="py-3.5 px-3">
                        <Badge status={p.stock_status} />
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center justify-center gap-1.5">
                          {/* Quick Stock In */}
                          <button
                            onClick={() => onOpenStockIn(p.id)}
                            title="Receive stock"
                            className="p-1.5 text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors cursor-pointer"
                          >
                            <ArrowDownLeft className="w-4 h-4" />
                          </button>

                          {/* Quick Stock Out */}
                          <button
                            onClick={() => onOpenStockOut(p.id)}
                            title="Issue stock"
                            className="p-1.5 text-purple-600 hover:bg-purple-50 rounded-lg transition-colors cursor-pointer"
                          >
                            <ArrowUpRight className="w-4 h-4" />
                          </button>

                          {/* View Detail */}
                          <button
                            onClick={() => onViewProductDetail(p.id)}
                            title="View full specs and audit trail"
                            className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer"
                          >
                            <Eye className="w-4 h-4" />
                          </button>

                          {/* Edit Product */}
                          <button
                            onClick={() => onOpenEditProduct(p)}
                            title="Edit product"
                            className="p-1.5 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>

                          {/* Delete Product (Admin only) */}
                          <button
                            onClick={() => handleDeleteClick(p)}
                            title={isAdmin ? 'Delete product' : 'Admin privilege required'}
                            className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                              isAdmin ? 'text-rose-500 hover:bg-rose-50' : 'text-slate-300 opacity-50 cursor-not-allowed'
                            }`}
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Bar */}
        <div className="p-4 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500">
          <div>
            Showing <strong className="text-slate-900 font-bold">{products.length}</strong> of{' '}
            <strong className="text-slate-900 font-bold">{pagination.total}</strong> products (Page {pagination.page} of {pagination.totalPages})
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

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={deleteModalOpen}
        title="Delete Product"
        message={`Are you sure you want to permanently delete "${productToDelete?.name}" (${productToDelete?.sku})? This will also remove its associated transaction history.`}
        confirmLabel="Yes, Delete Product"
        cancelLabel="Cancel"
        isDestructive={true}
        onConfirm={confirmDelete}
        onCancel={() => {
          setDeleteModalOpen(false);
          setProductToDelete(null);
        }}
      />
    </div>
  );
};
