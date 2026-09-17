import React, { useState, useEffect } from 'react';
import { Category } from '../types/index.ts';
import { api } from '../services/api.ts';
import { useAuth } from '../context/AuthContext.tsx';
import { useToast } from '../context/ToastContext.tsx';
import { Badge } from '../components/common/Badge.tsx';
import { ConfirmModal } from '../components/common/ConfirmModal.tsx';
import {
  Layers,
  Plus,
  Search,
  Edit2,
  Trash2,
  Package,
  Boxes,
} from 'lucide-react';

interface CategoriesPageProps {
  onOpenAddCategory: () => void;
  onOpenEditCategory: (category: Category) => void;
  refreshKey: number;
  onSelectCategoryFilter: (categoryId: number) => void;
}

export const CategoriesPage: React.FC<CategoriesPageProps> = ({
  onOpenAddCategory,
  onOpenEditCategory,
  refreshKey,
  onSelectCategoryFilter,
}) => {
  const { isAdmin } = useAuth();
  const { showToast } = useToast();

  const [categories, setCategories] = useState<Category[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [categoryToDelete, setCategoryToDelete] = useState<Category | null>(null);

  const fetchCategories = async () => {
    setIsLoading(true);
    try {
      const data = await api.categories.getAll(searchTerm);
      setCategories(data);
    } catch (err: any) {
      showToast(err.message || 'Failed to load categories.', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, [searchTerm, refreshKey]);

  const handleDeleteClick = (cat: Category) => {
    if (!isAdmin) {
      showToast('Only Administrators can delete product categories.', 'warning');
      return;
    }
    setCategoryToDelete(cat);
    setDeleteModalOpen(true);
  };

  const confirmDelete = async () => {
    if (!categoryToDelete) return;
    try {
      const res = await api.categories.delete(categoryToDelete.id);
      showToast(res.message, 'success');
      setDeleteModalOpen(false);
      setCategoryToDelete(null);
      fetchCategories();
    } catch (err: any) {
      showToast(err.message || 'Failed to delete category.', 'error');
    }
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">Category Management</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Organize products into structured inventory departments and categories
          </p>
        </div>
        <button
          onClick={onOpenAddCategory}
          id="categories-add-new-btn"
          className="flex items-center justify-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-bold shadow-md shadow-indigo-600/20 transition-all cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Add New Category</span>
        </button>
      </div>

      {/* Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            id="categories-search-input"
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search categories by name or keyword..."
            className="w-full pl-9 pr-3.5 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-medium text-slate-900 focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all"
          />
        </div>
        <span className="text-xs font-bold text-slate-500">{categories.length} Categories</span>
      </div>

      {/* Categories Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {isLoading ? (
          <div className="col-span-full py-12 text-center text-slate-400 text-sm">Loading categories...</div>
        ) : categories.length === 0 ? (
          <div className="col-span-full py-12 text-center text-slate-400 text-sm">No categories found.</div>
        ) : (
          categories.map((cat) => (
            <div
              key={cat.id}
              className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs flex flex-col justify-between hover:shadow-md transition-shadow"
            >
              <div>
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center border border-indigo-100">
                      <Layers className="w-4.5 h-4.5" />
                    </div>
                    <div>
                      <h3 className="text-base font-bold text-slate-900 leading-tight">{cat.name}</h3>
                      <span className="text-[11px] font-medium text-slate-400">ID: #{cat.id}</span>
                    </div>
                  </div>
                  <Badge status={cat.status || 'Active'} />
                </div>

                <p className="mt-3 text-xs text-slate-600 line-clamp-2 min-h-[32px] leading-relaxed">
                  {cat.description || 'No detailed description provided for this category.'}
                </p>

                {/* Metrics */}
                <div className="mt-4 grid grid-cols-2 gap-2 p-2.5 bg-slate-50 rounded-xl border border-slate-100 text-xs">
                  <div className="flex items-center gap-2">
                    <Package className="w-3.5 h-3.5 text-indigo-500" />
                    <div>
                      <span className="text-[10px] text-slate-400 uppercase font-semibold block">Products</span>
                      <strong className="text-slate-900 font-bold">{cat.product_count || 0} items</strong>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Boxes className="w-3.5 h-3.5 text-emerald-500" />
                    <div>
                      <span className="text-[10px] text-slate-400 uppercase font-semibold block">Total Stock</span>
                      <strong className="text-slate-900 font-bold">{cat.total_stock || 0} units</strong>
                    </div>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                <button
                  onClick={() => onSelectCategoryFilter(cat.id)}
                  className="text-xs font-bold text-indigo-600 hover:text-indigo-800 transition-colors"
                >
                  View Products →
                </button>

                <div className="flex items-center gap-1">
                  <button
                    onClick={() => onOpenEditCategory(cat)}
                    className="p-1.5 text-slate-500 hover:bg-slate-100 rounded-lg transition-colors"
                    title="Edit Category"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDeleteClick(cat)}
                    className={`p-1.5 rounded-lg transition-colors ${
                      isAdmin ? 'text-rose-500 hover:bg-rose-50' : 'text-slate-300 cursor-not-allowed'
                    }`}
                    title={isAdmin ? 'Delete Category' : 'Admin only'}
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={deleteModalOpen}
        title="Delete Category"
        message={`Are you sure you want to delete category "${categoryToDelete?.name}"? You can only delete categories that contain no active products.`}
        confirmLabel="Yes, Delete Category"
        cancelLabel="Cancel"
        isDestructive={true}
        onConfirm={confirmDelete}
        onCancel={() => {
          setDeleteModalOpen(false);
          setCategoryToDelete(null);
        }}
      />
    </div>
  );
};
