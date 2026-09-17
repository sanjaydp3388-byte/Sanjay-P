import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext.tsx';
import {
  Menu,
  Bell,
  Search,
  ArrowDownLeft,
  ArrowUpRight,
  ShieldCheck,
  UserCheck,
  AlertTriangle,
} from 'lucide-react';

interface HeaderProps {
  onToggleSidebar: () => void;
  activeTab: string;
  lowStockItems: any[];
  onOpenStockIn: () => void;
  onOpenStockOut: () => void;
  onNavigateToTab: (tab: string) => void;
  onGlobalSearch?: (term: string) => void;
}

export const Header: React.FC<HeaderProps> = ({
  onToggleSidebar,
  activeTab,
  lowStockItems,
  onOpenStockIn,
  onOpenStockOut,
  onNavigateToTab,
}) => {
  const { user, isAdmin } = useAuth();
  const [showNotifications, setShowNotifications] = useState(false);

  const tabTitles: Record<string, { title: string; subtitle: string }> = {
    dashboard: { title: 'Executive Dashboard', subtitle: 'Overview of stock valuation, movements & key inventory metrics' },
    products: { title: 'Product Catalog', subtitle: 'Manage stock items, SKU numbers, prices, and categories' },
    categories: { title: 'Category Management', subtitle: 'Organize products into structured inventory categories' },
    suppliers: { title: 'Supplier Directory', subtitle: 'Manage vendor contacts, companies, tax identifiers and orders' },
    inventory: { title: 'Inventory Transactions', subtitle: 'Record inbound shipments, sales orders, and audit history' },
    'low-stock': { title: 'Stock Alert Center', subtitle: 'Products requiring immediate reordering or critical replenishment' },
    reports: { title: 'Reports & Export', subtitle: 'Inventory valuation, stock movement history, and CSV data export' },
    'api-docs': { title: 'REST API & Viva Guide', subtitle: 'Postman endpoint definitions, request/response models & viva Q&A' },
  };

  const currentInfo = tabTitles[activeTab] || { title: 'Inventory Management', subtitle: 'Operations portal' };

  return (
    <header className="sticky top-0 z-30 bg-white/90 backdrop-blur-md border-b border-slate-200/80 px-4 lg:px-8 py-3.5 transition-all">
      <div className="flex items-center justify-between gap-4">
        {/* Left: Mobile hamburger & breadcrumb */}
        <div className="flex items-center gap-3.5">
          <button
            onClick={onToggleSidebar}
            className="lg:hidden p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition-colors"
            id="mobile-sidebar-toggle"
          >
            <Menu className="w-5 h-5" />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-indigo-600 uppercase tracking-wider">Inventory</span>
              <span className="text-slate-300">/</span>
              <h2 className="text-lg lg:text-xl font-extrabold text-slate-900 tracking-tight leading-tight">
                {currentInfo.title}
              </h2>
            </div>
            <p className="hidden sm:block text-xs text-slate-500 mt-0.5">{currentInfo.subtitle}</p>
          </div>
        </div>

        {/* Right Action buttons */}
        <div className="flex items-center gap-2.5 sm:gap-3">
          {/* Quick Action: Stock In */}
          <button
            onClick={onOpenStockIn}
            id="header-stock-in-btn"
            className="flex items-center gap-1.5 px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs sm:text-sm font-semibold shadow-sm transition-colors"
            title="Receive incoming goods into inventory"
          >
            <ArrowDownLeft className="w-4 h-4" />
            <span className="hidden sm:inline">Stock In</span>
          </button>

          {/* Quick Action: Stock Out */}
          <button
            onClick={onOpenStockOut}
            id="header-stock-out-btn"
            className="flex items-center gap-1.5 px-3 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs sm:text-sm font-semibold shadow-sm transition-colors"
            title="Issue goods for sales or dispatch"
          >
            <ArrowUpRight className="w-4 h-4" />
            <span className="hidden sm:inline">Stock Out</span>
          </button>

          {/* Low Stock Notification Bell */}
          <div className="relative">
            <button
              onClick={() => setShowNotifications(!showNotifications)}
              id="header-notification-bell"
              className="relative p-2.5 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition-colors"
              title="Stock Alerts"
            >
              <Bell className="w-5 h-5" />
              {lowStockItems.length > 0 && (
                <span className="absolute top-1.5 right-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-rose-500 text-[10px] font-bold text-white shadow-xs animate-pulse">
                  {lowStockItems.length}
                </span>
              )}
            </button>

            {/* Notification Popover Dropdown */}
            {showNotifications && (
              <div
                className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-2xl shadow-2xl border border-slate-200/90 py-3 z-50 animate-in fade-in slide-in-from-top-2 duration-150"
                id="header-notifications-dropdown"
              >
                <div className="flex items-center justify-between px-4 pb-2.5 border-b border-slate-100">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-rose-500" />
                    <span className="text-sm font-bold text-slate-900">Low Stock Notifications</span>
                  </div>
                  <span className="text-xs font-semibold px-2 py-0.5 bg-rose-50 text-rose-600 rounded-full">
                    {lowStockItems.length} alerts
                  </span>
                </div>

                <div className="max-h-72 overflow-y-auto divide-y divide-slate-100">
                  {lowStockItems.length === 0 ? (
                    <div className="p-6 text-center text-xs text-slate-500">
                      All inventory products are above minimum stock levels.
                    </div>
                  ) : (
                    lowStockItems.slice(0, 5).map((item) => (
                      <div
                        key={item.id}
                        className="p-3.5 hover:bg-slate-50 flex items-center justify-between gap-3 transition-colors cursor-pointer"
                        onClick={() => {
                          setShowNotifications(false);
                          onNavigateToTab('low-stock');
                        }}
                      >
                        <div className="min-w-0">
                          <p className="text-xs font-bold text-slate-900 truncate">{item.name}</p>
                          <p className="text-[11px] text-slate-500">
                            SKU: {item.sku} • Min: {item.min_stock} {item.unit}
                          </p>
                        </div>
                        <div className="shrink-0 text-right">
                          <span
                            className={`inline-block px-2 py-0.5 rounded text-[11px] font-bold ${
                              item.quantity <= 0
                                ? 'bg-rose-100 text-rose-700'
                                : 'bg-amber-100 text-amber-700'
                            }`}
                          >
                            {item.quantity <= 0 ? 'Out of Stock' : `${item.quantity} left`}
                          </span>
                        </div>
                      </div>
                    ))
                  )}
                </div>

                <div className="pt-2 px-4 border-t border-slate-100 text-center">
                  <button
                    onClick={() => {
                      setShowNotifications(false);
                      onNavigateToTab('low-stock');
                    }}
                    className="text-xs font-bold text-indigo-600 hover:text-indigo-800 transition-colors"
                  >
                    View All Stock Alerts →
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* User Role Pill */}
          <div className="hidden md:flex items-center gap-2 pl-2 border-l border-slate-200">
            <span
              className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold ${
                isAdmin
                  ? 'bg-indigo-50 text-indigo-700 border border-indigo-200/80'
                  : 'bg-emerald-50 text-emerald-700 border border-emerald-200/80'
              }`}
            >
              {isAdmin ? <ShieldCheck className="w-3.5 h-3.5" /> : <UserCheck className="w-3.5 h-3.5" />}
              <span>{isAdmin ? 'Admin Mode' : 'Staff Mode'}</span>
            </span>
          </div>
        </div>
      </div>
    </header>
  );
};
