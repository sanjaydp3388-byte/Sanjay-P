import React, { useState, useEffect } from 'react';
import { Supplier } from '../types/index.ts';
import { api } from '../services/api.ts';
import { useAuth } from '../context/AuthContext.tsx';
import { useToast } from '../context/ToastContext.tsx';
import { Badge } from '../components/common/Badge.tsx';
import { ConfirmModal } from '../components/common/ConfirmModal.tsx';
import {
  Truck,
  Plus,
  Search,
  Mail,
  Phone,
  MapPin,
  FileText,
  Edit2,
  Trash2,
  Package,
} from 'lucide-react';

interface SuppliersPageProps {
  onOpenAddSupplier: () => void;
  onOpenEditSupplier: (supplier: Supplier) => void;
  refreshKey: number;
}

export const SuppliersPage: React.FC<SuppliersPageProps> = ({
  onOpenAddSupplier,
  onOpenEditSupplier,
  refreshKey,
}) => {
  const { isAdmin } = useAuth();
  const { showToast } = useToast();

  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [supplierToDelete, setSupplierToDelete] = useState<Supplier | null>(null);

  const fetchSuppliers = async () => {
    setIsLoading(true);
    try {
      const data = await api.suppliers.getAll(searchTerm);
      setSuppliers(data);
    } catch (err: any) {
      showToast(err.message || 'Failed to load suppliers.', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchSuppliers();
  }, [searchTerm, refreshKey]);

  const handleDeleteClick = (supplier: Supplier) => {
    if (!isAdmin) {
      showToast('Only Administrators have permission to delete suppliers.', 'warning');
      return;
    }
    setSupplierToDelete(supplier);
    setDeleteModalOpen(true);
  };

  const confirmDelete = async () => {
    if (!supplierToDelete) return;
    try {
      const res = await api.suppliers.delete(supplierToDelete.id);
      showToast(res.message, 'success');
      setDeleteModalOpen(false);
      setSupplierToDelete(null);
      fetchSuppliers();
    } catch (err: any) {
      showToast(err.message || 'Failed to delete supplier.', 'error');
    }
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">Supplier Directory</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Manage authorized vendors, procurement contracts, and contact profiles
          </p>
        </div>
        <button
          onClick={onOpenAddSupplier}
          id="suppliers-add-new-btn"
          className="flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-bold shadow-md shadow-blue-600/20 transition-all cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Register New Supplier</span>
        </button>
      </div>

      {/* Search & Counter */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            id="suppliers-search-input"
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by vendor name, contact person or email..."
            className="w-full pl-9 pr-3.5 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-medium text-slate-900 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
          />
        </div>
        <span className="text-xs font-bold text-slate-500">{suppliers.length} Active Vendors</span>
      </div>

      {/* Supplier Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {isLoading ? (
          <div className="col-span-full py-12 text-center text-slate-400 text-sm">Loading suppliers...</div>
        ) : suppliers.length === 0 ? (
          <div className="col-span-full py-12 text-center text-slate-400 text-sm">No suppliers found.</div>
        ) : (
          suppliers.map((sup) => (
            <div
              key={sup.id}
              className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs flex flex-col justify-between hover:shadow-md transition-shadow"
            >
              <div>
                {/* Top header */}
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center border border-blue-100 shrink-0">
                      <Truck className="w-5 h-5" />
                    </div>
                    <div className="min-w-0">
                      <h3 className="text-base font-bold text-slate-900 truncate leading-tight">
                        {sup.company_name}
                      </h3>
                      <p className="text-xs text-slate-500 truncate mt-0.5">Attn: {sup.name}</p>
                    </div>
                  </div>
                  <Badge status={sup.status || 'Active'} />
                </div>

                {/* Contact items */}
                <div className="mt-4 space-y-2 text-xs text-slate-600">
                  <div className="flex items-center gap-2">
                    <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <a href={`mailto:${sup.email}`} className="text-indigo-600 hover:underline truncate">
                      {sup.email}
                    </a>
                  </div>

                  <div className="flex items-center gap-2">
                    <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span className="font-mono text-slate-700">{sup.phone}</span>
                  </div>

                  <div className="flex items-center gap-2">
                    <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span className="truncate">
                      {[sup.city, sup.state, sup.country].filter(Boolean).join(', ') || 'Global Distribution'}
                    </span>
                  </div>

                  {sup.tax_id && (
                    <div className="flex items-center gap-2">
                      <FileText className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span className="font-mono text-[11px] text-slate-500">Tax ID: {sup.tax_id}</span>
                    </div>
                  )}
                </div>

                {/* Products supplied pill */}
                <div className="mt-4 p-2.5 bg-slate-50 rounded-xl border border-slate-100 flex items-center justify-between text-xs">
                  <span className="text-slate-500">Products Supplied:</span>
                  <span className="font-bold text-slate-900 flex items-center gap-1">
                    <Package className="w-3 h-3 text-blue-500" />
                    {sup.product_count || 0} catalog item(s)
                  </span>
                </div>
              </div>

              {/* Actions */}
              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  onClick={() => onOpenEditSupplier(sup)}
                  className="flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                  <span>Edit</span>
                </button>
                <button
                  onClick={() => handleDeleteClick(sup)}
                  className={`flex items-center gap-1 px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
                    isAdmin
                      ? 'text-rose-600 hover:bg-rose-50'
                      : 'text-slate-300 cursor-not-allowed opacity-50'
                  }`}
                  title={isAdmin ? 'Delete Supplier' : 'Admin privilege required'}
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Delete</span>
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={deleteModalOpen}
        title="Delete Supplier"
        message={`Are you sure you want to delete supplier "${supplierToDelete?.company_name}"? This action cannot be undone.`}
        confirmLabel="Yes, Delete Supplier"
        cancelLabel="Cancel"
        isDestructive={true}
        onConfirm={confirmDelete}
        onCancel={() => {
          setDeleteModalOpen(false);
          setSupplierToDelete(null);
        }}
      />
    </div>
  );
};
