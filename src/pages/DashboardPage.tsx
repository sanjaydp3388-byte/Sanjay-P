import React from 'react';
import { DashboardData } from '../types/index.ts';
import { Badge } from '../components/common/Badge.tsx';
import {
  Package,
  Layers,
  Truck,
  Boxes,
  AlertTriangle,
  XCircle,
  DollarSign,
  ArrowDownUp,
  ArrowDownLeft,
  ArrowUpRight,
  TrendingUp,
  Plus,
  Clock,
  ChevronRight,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
  AreaChart,
  Area,
} from 'recharts';

interface DashboardPageProps {
  data: DashboardData | null;
  isLoading: boolean;
  onOpenStockIn: () => void;
  onOpenStockOut: () => void;
  onOpenAddProduct: () => void;
  onOpenAddSupplier: () => void;
  onNavigateTab: (tab: string) => void;
  onViewProductDetail: (id: number) => void;
}

const COLORS = ['#6366f1', '#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899', '#14b8a6'];

export const DashboardPage: React.FC<DashboardPageProps> = ({
  data,
  isLoading,
  onOpenStockIn,
  onOpenStockOut,
  onOpenAddProduct,
  onOpenAddSupplier,
  onNavigateTab,
  onViewProductDetail,
}) => {
  if (isLoading || !data) {
    return (
      <div className="p-6 lg:p-8 space-y-6 animate-pulse">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="h-28 bg-slate-200/80 rounded-2xl" />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="h-80 bg-slate-200/80 rounded-2xl" />
          <div className="h-80 bg-slate-200/80 rounded-2xl" />
        </div>
      </div>
    );
  }

  const metrics = (data as any).metrics || (data as any).summary || {
    totalProducts: 0,
    totalCategories: 0,
    totalSuppliers: 0,
    totalStockUnits: 0,
    lowStockCount: 0,
    outOfStockCount: 0,
    totalInventoryValue: 0,
    totalCostValue: 0,
    todayTransactions: 0,
  };

  const rawCharts = data.charts || ({} as any);
  const categoryStock = rawCharts.categoryStock || (rawCharts.categoryStockChart ? rawCharts.categoryStockChart.map((c: any) => ({
    category: c.category,
    stock: Number(c.total_quantity) || 0,
    products: Number(c.product_count) || 0,
  })) : []);

  const monthlyMovements = rawCharts.monthlyMovements || (rawCharts.stockMovementTrend ? rawCharts.stockMovementTrend.map((m: any) => ({
    month: m.month,
    stockIn: Number(m.stock_in) || 0,
    stockOut: Number(m.stock_out) || 0,
  })) : []);

  const charts = {
    ...rawCharts,
    categoryStock,
    monthlyMovements,
  };

  const lowStockProducts: any[] = (data as any).lowStockProducts || rawCharts.lowStockList || [];
  const recentTransactions: any[] = (data as any).recentTransactions || (data as any).recentActivity || [];

  const kpis = [
    {
      label: 'Total Products',
      value: metrics.totalProducts ?? 0,
      sub: `${metrics.totalCategories ?? 0} active categories`,
      icon: Package,
      color: 'text-indigo-600',
      bg: 'bg-indigo-50 border-indigo-100',
      onClick: () => onNavigateTab('products'),
    },
    {
      label: 'Total Categories',
      value: metrics.totalCategories ?? 0,
      sub: 'Organized hierarchy',
      icon: Layers,
      color: 'text-blue-600',
      bg: 'bg-blue-50 border-blue-100',
      onClick: () => onNavigateTab('categories'),
    },
    {
      label: 'Total Suppliers',
      value: metrics.totalSuppliers ?? 0,
      sub: 'Verified vendors',
      icon: Truck,
      color: 'text-sky-600',
      bg: 'bg-sky-50 border-sky-100',
      onClick: () => onNavigateTab('suppliers'),
    },
    {
      label: 'Total Stock Units',
      value: (metrics.totalStockUnits ?? 0).toLocaleString(),
      sub: 'Physical inventory units',
      icon: Boxes,
      color: 'text-emerald-600',
      bg: 'bg-emerald-50 border-emerald-100',
      onClick: () => onNavigateTab('products'),
    },
    {
      label: 'Low Stock Items',
      value: metrics.lowStockCount ?? 0,
      sub: 'Require reordering',
      icon: AlertTriangle,
      color: (metrics.lowStockCount ?? 0) > 0 ? 'text-amber-600' : 'text-slate-600',
      bg: (metrics.lowStockCount ?? 0) > 0 ? 'bg-amber-50 border-amber-200' : 'bg-slate-50 border-slate-200',
      highlight: (metrics.lowStockCount ?? 0) > 0,
      onClick: () => onNavigateTab('low-stock'),
    },
    {
      label: 'Out of Stock',
      value: metrics.outOfStockCount ?? 0,
      sub: 'Zero stock available',
      icon: XCircle,
      color: (metrics.outOfStockCount ?? 0) > 0 ? 'text-rose-600' : 'text-slate-600',
      bg: (metrics.outOfStockCount ?? 0) > 0 ? 'bg-rose-50 border-rose-200' : 'bg-slate-50 border-slate-200',
      highlight: (metrics.outOfStockCount ?? 0) > 0,
      onClick: () => onNavigateTab('low-stock'),
    },
    {
      label: 'Inventory Valuation',
      value: `$${(metrics.totalInventoryValue ?? 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
      sub: 'Based on selling price',
      icon: DollarSign,
      color: 'text-emerald-700',
      bg: 'bg-emerald-50/80 border-emerald-200',
      onClick: () => onNavigateTab('reports'),
    },
    {
      label: "Today's Operations",
      value: metrics.todayTransactions ?? 0,
      sub: 'Inbound & outbound orders',
      icon: ArrowDownUp,
      color: 'text-purple-600',
      bg: 'bg-purple-50 border-purple-100',
      onClick: () => onNavigateTab('inventory'),
    },
  ];

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Quick Action Ribbon */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-4 bg-white rounded-2xl border border-slate-200/80 shadow-xs">
        <div className="flex items-center gap-2 text-xs font-bold text-slate-500 uppercase tracking-wider">
          <TrendingUp className="w-4 h-4 text-indigo-600" />
          <span>Quick Actions</span>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={onOpenAddProduct}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-xs transition-colors cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Product</span>
          </button>
          <button
            onClick={onOpenStockIn}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-xs transition-colors cursor-pointer"
          >
            <ArrowDownLeft className="w-3.5 h-3.5" />
            <span>Receive Stock In</span>
          </button>
          <button
            onClick={onOpenStockOut}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold shadow-xs transition-colors cursor-pointer"
          >
            <ArrowUpRight className="w-3.5 h-3.5" />
            <span>Issue Stock Out</span>
          </button>
          <button
            onClick={onOpenAddSupplier}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-colors cursor-pointer"
          >
            <Truck className="w-3.5 h-3.5 text-slate-500" />
            <span>Add Supplier</span>
          </button>
        </div>
      </div>

      {/* Low stock alert banner */}
      {metrics.lowStockCount > 0 && (
        <div className="p-4 bg-gradient-to-r from-amber-50 via-amber-50 to-orange-50 border border-amber-200/90 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-xs">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-amber-500 text-white rounded-xl shrink-0 shadow-sm shadow-amber-500/20">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-amber-950">
                Low Stock Warning: {metrics.lowStockCount} item{metrics.lowStockCount > 1 ? 's' : ''} below minimum threshold
              </h4>
              <p className="text-xs text-amber-800/80 mt-0.5">
                {metrics.outOfStockCount > 0 ? `${metrics.outOfStockCount} item(s) are completely out of stock.` : 'Immediate supplier purchase orders are recommended to avoid shortages.'}
              </p>
            </div>
          </div>
          <button
            onClick={() => onNavigateTab('low-stock')}
            className="px-3.5 py-1.5 bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold rounded-xl shadow-xs transition-colors shrink-0 cursor-pointer"
          >
            Manage Stock Alerts →
          </button>
        </div>
      )}

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {kpis.map((kpi, idx) => {
          const Icon = kpi.icon;
          return (
            <div
              key={idx}
              onClick={kpi.onClick}
              className={`p-4 sm:p-5 rounded-2xl border transition-all duration-150 cursor-pointer hover:shadow-md hover:-translate-y-0.5 ${
                kpi.highlight ? 'bg-white ring-2 ring-rose-300 shadow-xs' : 'bg-white border-slate-200/80 shadow-xs'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">{kpi.label}</span>
                <div className={`p-2 rounded-xl border ${kpi.bg}`}>
                  <Icon className={`w-4 h-4 ${kpi.color}`} />
                </div>
              </div>
              <div className="mt-3">
                <div className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight leading-none">
                  {kpi.value}
                </div>
                <p className="text-[11px] font-medium text-slate-400 mt-1.5 truncate">{kpi.sub}</p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Analytics Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Chart 1: Stock Quantity by Category */}
        <div className="p-5 bg-white rounded-2xl border border-slate-200/80 shadow-xs flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-extrabold text-slate-900">Stock Levels by Category</h3>
              <p className="text-xs text-slate-400">Total units on hand across active categories</p>
            </div>
            <span className="text-xs font-semibold text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-full">
              Category Distribution
            </span>
          </div>
          <div className="h-72 w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={charts.categoryStock} margin={{ top: 10, right: 10, left: -20, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                <XAxis
                  dataKey="category"
                  tick={{ fontSize: 11, fill: '#64748b' }}
                  angle={-15}
                  textAnchor="end"
                  interval={0}
                />
                <YAxis tick={{ fontSize: 11, fill: '#64748b' }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0f172a',
                    border: 'none',
                    borderRadius: '12px',
                    color: '#fff',
                    fontSize: '12px',
                  }}
                  formatter={(value: any) => [`${value} units`, 'Stock Units']}
                />
                <Bar dataKey="stock" fill="#6366f1" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 2: Monthly Stock Flow (In vs Out) */}
        <div className="p-5 bg-white rounded-2xl border border-slate-200/80 shadow-xs flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-extrabold text-slate-900">Stock Movement Trends</h3>
              <p className="text-xs text-slate-400">Purchases (Stock In) vs Sales/Dispatches (Stock Out)</p>
            </div>
            <span className="text-xs font-semibold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full">
              6-Month Flow
            </span>
          </div>
          <div className="h-72 w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={charts.monthlyMovements} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorIn" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="colorOut" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#64748b' }} />
                <YAxis tick={{ fontSize: 11, fill: '#64748b' }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0f172a',
                    border: 'none',
                    borderRadius: '12px',
                    color: '#fff',
                    fontSize: '12px',
                  }}
                />
                <Area type="monotone" dataKey="stockIn" name="Stock In" stroke="#10b981" strokeWidth={2} fillOpacity={1} fill="url(#colorIn)" />
                <Area type="monotone" dataKey="stockOut" name="Stock Out" stroke="#8b5cf6" strokeWidth={2} fillOpacity={1} fill="url(#colorOut)" />
                <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Lower Section: Recent Inventory Movements & Low Stock Watchlist */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Transactions Table (2 cols on large) */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
          <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-extrabold text-slate-900">Recent Inventory Activity</h3>
              <p className="text-xs text-slate-400">Live operational transactions & audit records</p>
            </div>
            <button
              onClick={() => onNavigateTab('inventory')}
              className="text-xs font-bold text-indigo-600 hover:text-indigo-800 transition-colors flex items-center gap-1 cursor-pointer"
            >
              <span>View All</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50/80 text-slate-500 font-bold uppercase tracking-wider border-b border-slate-100">
                <tr>
                  <th className="py-3 px-4">Item & SKU</th>
                  <th className="py-3 px-3">Type</th>
                  <th className="py-3 px-3 text-right">Quantity</th>
                  <th className="py-3 px-3">Reference</th>
                  <th className="py-3 px-3">Date</th>
                  <th className="py-3 px-4">User</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {recentTransactions.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-slate-400">
                      No recent inventory movements recorded.
                    </td>
                  </tr>
                ) : (
                  recentTransactions.map((tx) => (
                    <tr key={tx.id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="py-3 px-4">
                        <span className="font-bold text-slate-900 block truncate max-w-[160px]">
                          {tx.product_name}
                        </span>
                        <span className="font-mono text-[10px] text-slate-400">{tx.product_sku}</span>
                      </td>
                      <td className="py-3 px-3">
                        <Badge status={tx.transaction_type === 'STOCK_IN' ? 'Stock In' : 'Stock Out'} />
                      </td>
                      <td className={`py-3 px-3 text-right font-bold ${tx.transaction_type === 'STOCK_IN' ? 'text-emerald-600' : 'text-purple-600'}`}>
                        {tx.transaction_type === 'STOCK_IN' ? `+${tx.quantity}` : `-${tx.quantity}`}
                      </td>
                      <td className="py-3 px-3 font-mono text-slate-600">
                        {tx.reference_no || '—'}
                      </td>
                      <td className="py-3 px-3 text-slate-500">
                        {new Date(tx.created_at).toLocaleDateString()}
                      </td>
                      <td className="py-3 px-4 text-slate-600 truncate max-w-[120px]">
                        {tx.created_by || 'System'}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Low Stock Watchlist card */}
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs flex flex-col overflow-hidden">
          <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-extrabold text-slate-900">Low Stock Watchlist</h3>
              <p className="text-xs text-slate-400">Items nearing replenishment threshold</p>
            </div>
            <button
              onClick={() => onNavigateTab('low-stock')}
              className="text-xs font-bold text-amber-600 hover:text-amber-700 transition-colors flex items-center gap-1 cursor-pointer"
            >
              <span>Alerts</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="p-4 flex-1 divide-y divide-slate-100 overflow-y-auto max-h-[380px]">
            {lowStockProducts.length === 0 ? (
              <div className="py-12 text-center text-xs text-slate-400">
                All inventory products have sufficient stock levels!
              </div>
            ) : (
              lowStockProducts.map((p) => (
                <div
                  key={p.id}
                  onClick={() => onViewProductDetail(p.id)}
                  className="py-3 first:pt-0 last:pb-0 flex items-center justify-between gap-3 hover:bg-slate-50/80 p-2 rounded-xl transition-colors cursor-pointer"
                >
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-slate-900 truncate">{p.name}</p>
                    <p className="text-[11px] text-slate-400">
                      SKU: {p.sku} • Min: {p.min_stock} {p.unit}
                    </p>
                  </div>
                  <div className="shrink-0 text-right">
                    <span
                      className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-bold ${
                        p.quantity <= 0
                          ? 'bg-rose-100 text-rose-700 border border-rose-200'
                          : 'bg-amber-100 text-amber-700 border border-amber-200'
                      }`}
                    >
                      {p.quantity <= 0 ? 'Out of Stock' : `${p.quantity} ${p.unit}`}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>

          <div className="p-3.5 bg-slate-50 border-t border-slate-100 text-center">
            <button
              onClick={onOpenStockIn}
              className="w-full py-2 bg-white hover:bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-xl text-xs font-bold transition-colors flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
            >
              <ArrowDownLeft className="w-3.5 h-3.5" />
              <span>Record Bulk Stock Replenishment</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
