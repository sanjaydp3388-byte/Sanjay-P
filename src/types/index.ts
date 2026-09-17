export interface User {
  id: number;
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  role: 'admin' | 'staff';
  avatar?: string;
  created_at?: string;
}

export interface Category {
  id: number;
  name: string;
  description: string;
  status: 'Active' | 'Inactive';
  product_count?: number;
  total_units?: number;
  created_at: string;
  updated_at?: string;
}

export interface Supplier {
  id: number;
  name: string;
  company_name: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  country: string;
  tax_id: string;
  status: 'Active' | 'Inactive';
  product_count?: number;
  total_units_supplied?: number;
  created_at: string;
  updated_at?: string;
}

export interface Product {
  id: number;
  name: string;
  sku: string;
  category_id: number;
  category_name?: string;
  supplier_id: number;
  supplier_name?: string;
  supplier_contact?: string;
  supplier_email?: string;
  supplier_phone?: string;
  description: string;
  unit_price: number;
  cost_price: number;
  quantity: number;
  min_stock: number;
  max_stock: number;
  unit: string;
  status: 'Active' | 'Inactive';
  stock_status: 'In Stock' | 'Low Stock' | 'Out of Stock';
  created_at: string;
  updated_at: string;
}

export interface InventoryTransaction {
  id: number;
  product_id: number;
  product_name: string;
  product_sku: string;
  product_unit?: string;
  transaction_type: 'STOCK_IN' | 'STOCK_OUT';
  quantity: number;
  previous_stock: number;
  updated_stock: number;
  unit_cost?: number;
  total_cost?: number;
  reason?: string;
  reference_no: string;
  notes?: string;
  supplier_id?: number;
  supplier_name?: string;
  user_id?: number;
  user_name?: string;
  created_by: string;
  created_at: string;
  status?: string;
}

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface DashboardSummary {
  totalProducts: number;
  totalCategories: number;
  totalSuppliers: number;
  totalStockUnits: number;
  lowStockCount: number;
  outOfStockCount: number;
  totalInventoryValue: number;
  totalCostValue: number;
  todayTransactions: number;
}

export interface DashboardData {
  summary: DashboardSummary;
  charts: {
    categoryStockChart: Array<{ category: string; total_quantity: number; product_count: number }>;
    stockMovementTrend: Array<{ month: string; stock_in: number; stock_out: number }>;
    categoryValueChart: Array<{ category: string; inventory_value: number; cost_value: number }>;
    topUsedProducts: Array<{ id: number; name: string; sku: string; unit: string; total_issued: number; current_stock: number }>;
    lowStockList: Array<{ id: number; name: string; sku: string; quantity: number; min_stock: number; unit: string; supplier_name: string; category_name: string; status: string }>;
  };
  recentActivity: InventoryTransaction[];
}

export interface ToastMessage {
  id: string;
  type: 'success' | 'error' | 'info' | 'warning';
  message: string;
  timestamp?: number;
}
