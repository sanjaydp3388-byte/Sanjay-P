import React, { useState, useEffect, useCallback } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext.tsx';
import { ToastProvider, useToast } from './context/ToastContext.tsx';
import { api } from './services/api.ts';
import { Product, Category, Supplier, DashboardData } from './types/index.ts';

// Layout components
import { Sidebar } from './components/layout/Sidebar.tsx';
import { Header } from './components/layout/Header.tsx';
import { ConfirmModal } from './components/common/ConfirmModal.tsx';

// Pages
import { LoginPage } from './pages/LoginPage.tsx';
import { DashboardPage } from './pages/DashboardPage.tsx';
import { ProductsPage } from './pages/ProductsPage.tsx';
import { CategoriesPage } from './pages/CategoriesPage.tsx';
import { SuppliersPage } from './pages/SuppliersPage.tsx';
import { InventoryPage } from './pages/InventoryPage.tsx';
import { LowStockPage } from './pages/LowStockPage.tsx';
import { ReportsPage } from './pages/ReportsPage.tsx';
import { ApiDocsPage } from './pages/ApiDocsPage.tsx';

// Modals
import { StockInModal } from './components/inventory/StockInModal.tsx';
import { StockOutModal } from './components/inventory/StockOutModal.tsx';
import { ProductModal } from './components/products/ProductModal.tsx';
import { ProductDetailModal } from './components/products/ProductDetailModal.tsx';
import { CategoryModal } from './components/categories/CategoryModal.tsx';
import { SupplierModal } from './components/suppliers/SupplierModal.tsx';

function MainApp() {
  const { user, isLoading: isAuthLoading } = useAuth();
  const { showToast } = useToast();

  const [activeTab, setActiveTab] = useState<string>('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Global shared state
  const [categories, setCategories] = useState<Category[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [allProducts, setAllProducts] = useState<Product[]>([]);
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [lowStockItems, setLowStockItems] = useState<Product[]>([]);
  const [isDataLoading, setIsDataLoading] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  // Modals state
  const [stockInModalOpen, setStockInModalOpen] = useState(false);
  const [stockInProductId, setStockInProductId] = useState<number | undefined>(undefined);

  const [stockOutModalOpen, setStockOutModalOpen] = useState(false);
  const [stockOutProductId, setStockOutProductId] = useState<number | undefined>(undefined);

  const [productModalOpen, setProductModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  const [detailProductId, setDetailProductId] = useState<number | null>(null);

  const [categoryModalOpen, setCategoryModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);

  const [supplierModalOpen, setSupplierModalOpen] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null);

  const [resetDbModalOpen, setResetDbModalOpen] = useState(false);

  // Load shared data
  const loadSharedData = useCallback(async () => {
    if (!user) return;
    setIsDataLoading(true);
    try {
      const [cats, sups, dash, prods, lowStock] = await Promise.all([
        api.categories.getAll(),
        api.suppliers.getAll(),
        api.dashboard.getStats(),
        api.products.getAll({ limit: 100 }),
        api.inventory.getLowStock(),
      ]);

      setCategories(cats);
      setSuppliers(sups);
      setDashboardData(dash);
      setAllProducts(prods.data);
      setLowStockItems(lowStock);
    } catch (err: any) {
      console.error('Failed to fetch shared app data:', err);
    } finally {
      setIsDataLoading(false);
    }
  }, [user]);

  useEffect(() => {
    loadSharedData();
  }, [loadSharedData, refreshKey]);

  const triggerRefresh = () => {
    setRefreshKey((k) => k + 1);
  };

  // Reset database demo handler
  const handleResetDatabase = async () => {
    try {
      const res = await api.seed.reset();
      showToast(res.message || 'Demo database reset to initial seeded records!', 'success');
      setResetDbModalOpen(false);
      triggerRefresh();
    } catch (err: any) {
      showToast(err.message || 'Failed to reset database.', 'error');
    }
  };

  if (isAuthLoading) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center gap-3 text-slate-300">
        <div className="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
        <p className="text-xs font-semibold tracking-wider uppercase text-slate-400">Loading Inventory Portal...</p>
      </div>
    );
  }

  if (!user) {
    return <LoginPage />;
  }

  return (
    <div className="min-h-screen bg-slate-100 flex text-slate-800">
      {/* Sidebar Navigation */}
      <Sidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        lowStockCount={lowStockItems.length}
        onResetDb={() => setResetDbModalOpen(true)}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 lg:pl-72 transition-all">
        {/* Top Header */}
        <Header
          onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
          activeTab={activeTab}
          lowStockItems={lowStockItems}
          onOpenStockIn={() => {
            setStockInProductId(undefined);
            setStockInModalOpen(true);
          }}
          onOpenStockOut={() => {
            setStockOutProductId(undefined);
            setStockOutModalOpen(true);
          }}
          onNavigateToTab={(tab) => setActiveTab(tab)}
        />

        {/* Tab Page Views */}
        <main className="flex-1 pb-16">
          {activeTab === 'dashboard' && (
            <DashboardPage
              data={dashboardData}
              isLoading={isDataLoading}
              onOpenStockIn={() => {
                setStockInProductId(undefined);
                setStockInModalOpen(true);
              }}
              onOpenStockOut={() => {
                setStockOutProductId(undefined);
                setStockOutModalOpen(true);
              }}
              onOpenAddProduct={() => {
                setEditingProduct(null);
                setProductModalOpen(true);
              }}
              onOpenAddSupplier={() => {
                setEditingSupplier(null);
                setSupplierModalOpen(true);
              }}
              onNavigateTab={(tab) => setActiveTab(tab)}
              onViewProductDetail={(id) => setDetailProductId(id)}
            />
          )}

          {activeTab === 'products' && (
            <ProductsPage
              categories={categories}
              suppliers={suppliers}
              onOpenAddProduct={() => {
                setEditingProduct(null);
                setProductModalOpen(true);
              }}
              onOpenEditProduct={(prod) => {
                setEditingProduct(prod);
                setProductModalOpen(true);
              }}
              onViewProductDetail={(id) => setDetailProductId(id)}
              onOpenStockIn={(id) => {
                setStockInProductId(id);
                setStockInModalOpen(true);
              }}
              onOpenStockOut={(id) => {
                setStockOutProductId(id);
                setStockOutModalOpen(true);
              }}
              refreshKey={refreshKey}
            />
          )}

          {activeTab === 'categories' && (
            <CategoriesPage
              onOpenAddCategory={() => {
                setEditingCategory(null);
                setCategoryModalOpen(true);
              }}
              onOpenEditCategory={(cat) => {
                setEditingCategory(cat);
                setCategoryModalOpen(true);
              }}
              refreshKey={refreshKey}
              onSelectCategoryFilter={() => setActiveTab('products')}
            />
          )}

          {activeTab === 'suppliers' && (
            <SuppliersPage
              onOpenAddSupplier={() => {
                setEditingSupplier(null);
                setSupplierModalOpen(true);
              }}
              onOpenEditSupplier={(sup) => {
                setEditingSupplier(sup);
                setSupplierModalOpen(true);
              }}
              refreshKey={refreshKey}
            />
          )}

          {activeTab === 'inventory' && (
            <InventoryPage
              products={allProducts}
              onOpenStockIn={() => {
                setStockInProductId(undefined);
                setStockInModalOpen(true);
              }}
              onOpenStockOut={() => {
                setStockOutProductId(undefined);
                setStockOutModalOpen(true);
              }}
              refreshKey={refreshKey}
            />
          )}

          {activeTab === 'low-stock' && (
            <LowStockPage
              lowStockItems={lowStockItems}
              onStockIn={(id) => {
                setStockInProductId(id);
                setStockInModalOpen(true);
              }}
              onViewProductDetail={(id) => setDetailProductId(id)}
            />
          )}

          {activeTab === 'reports' && (
            <ReportsPage categories={categories} />
          )}

          {activeTab === 'api-docs' && (
            <ApiDocsPage />
          )}
        </main>
      </div>

      {/* Shared Modals */}
      <StockInModal
        isOpen={stockInModalOpen}
        onClose={() => setStockInModalOpen(false)}
        onSuccess={triggerRefresh}
        products={allProducts}
        suppliers={suppliers}
        initialProductId={stockInProductId}
      />

      <StockOutModal
        isOpen={stockOutModalOpen}
        onClose={() => setStockOutModalOpen(false)}
        onSuccess={triggerRefresh}
        products={allProducts}
        initialProductId={stockOutProductId}
      />

      <ProductModal
        isOpen={productModalOpen}
        onClose={() => setProductModalOpen(false)}
        onSuccess={triggerRefresh}
        categories={categories}
        suppliers={suppliers}
        editingProduct={editingProduct}
      />

      <ProductDetailModal
        productId={detailProductId}
        onClose={() => setDetailProductId(null)}
        onStockIn={(id) => {
          setStockInProductId(id);
          setStockInModalOpen(true);
        }}
        onStockOut={(id) => {
          setStockOutProductId(id);
          setStockOutModalOpen(true);
        }}
      />

      <CategoryModal
        isOpen={categoryModalOpen}
        onClose={() => setCategoryModalOpen(false)}
        onSuccess={triggerRefresh}
        editingCategory={editingCategory}
      />

      <SupplierModal
        isOpen={supplierModalOpen}
        onClose={() => setSupplierModalOpen(false)}
        onSuccess={triggerRefresh}
        editingSupplier={editingSupplier}
      />

      <ConfirmModal
        isOpen={resetDbModalOpen}
        title="Reset Demo Database"
        message="This will repopulate the SQLite database with standard test categories, suppliers, electronics/accessories products, and audit transaction records. Do you wish to continue?"
        confirmLabel="Reset to Seed Data"
        cancelLabel="Cancel"
        isDestructive={false}
        onConfirm={handleResetDatabase}
        onCancel={() => setResetDbModalOpen(false)}
      />
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <ToastProvider>
        <MainApp />
      </ToastProvider>
    </AuthProvider>
  );
}
