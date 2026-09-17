import {
  Product,
  Category,
  Supplier,
  InventoryTransaction,
  PaginationMeta,
  DashboardData,
  User,
} from '../types/index.ts';

const BASE_URL = '/api';

function getAuthHeaders(): HeadersInit {
  const token = localStorage.getItem('inventory_auth_token');
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return headers;
}

async function handleResponse<T>(response: Response): Promise<T> {
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data.error || `HTTP error ${response.status}: ${response.statusText}`);
  }
  return data as T;
}

export const api = {
  // Auth
  auth: {
    login: async (identifier: string, password: string): Promise<{ token: string; user: User; message: string }> => {
      const res = await fetch(`${BASE_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: identifier, password }),
      });
      return handleResponse(res);
    },
    me: async (): Promise<{ user: User }> => {
      const res = await fetch(`${BASE_URL}/auth/me`, {
        headers: getAuthHeaders(),
      });
      return handleResponse(res);
    },
    logout: async () => {
      await fetch(`${BASE_URL}/auth/logout`, {
        method: 'POST',
        headers: getAuthHeaders(),
      });
    },
  },

  // Dashboard
  dashboard: {
    getStats: async (): Promise<DashboardData> => {
      const res = await fetch(`${BASE_URL}/dashboard`, {
        headers: getAuthHeaders(),
      });
      return handleResponse<DashboardData>(res);
    },
  },

  // Products
  products: {
    getAll: async (params: {
      search?: string;
      category_id?: string;
      supplier_id?: string;
      status?: string;
      stock_status?: string;
      sort_by?: string;
      order?: string;
      page?: number;
      limit?: number;
    } = {}): Promise<{ data: Product[]; pagination: PaginationMeta }> => {
      const query = new URLSearchParams();
      Object.entries(params).forEach(([key, val]) => {
        if (val !== undefined && val !== '') query.append(key, String(val));
      });
      const res = await fetch(`${BASE_URL}/products?${query.toString()}`, {
        headers: getAuthHeaders(),
      });
      return handleResponse(res);
    },

    getById: async (id: number): Promise<{ product: Product; transactions: InventoryTransaction[] }> => {
      const res = await fetch(`${BASE_URL}/products/${id}`, {
        headers: getAuthHeaders(),
      });
      return handleResponse(res);
    },

    create: async (productData: Partial<Product>): Promise<{ message: string; product: Product }> => {
      const res = await fetch(`${BASE_URL}/products`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(productData),
      });
      return handleResponse(res);
    },

    update: async (id: number, productData: Partial<Product>): Promise<{ message: string; product: Product }> => {
      const res = await fetch(`${BASE_URL}/products/${id}`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify(productData),
      });
      return handleResponse(res);
    },

    delete: async (id: number): Promise<{ message: string; deletedId: number }> => {
      const res = await fetch(`${BASE_URL}/products/${id}`, {
        method: 'DELETE',
        headers: getAuthHeaders(),
      });
      return handleResponse(res);
    },
  },

  // Categories
  categories: {
    getAll: async (search?: string, status?: string): Promise<Category[]> => {
      const query = new URLSearchParams();
      if (search) query.append('search', search);
      if (status) query.append('status', status);
      const res = await fetch(`${BASE_URL}/categories?${query.toString()}`, {
        headers: getAuthHeaders(),
      });
      return handleResponse(res);
    },

    create: async (categoryData: { name: string; description?: string; status?: string }): Promise<{ message: string; category: Category }> => {
      const res = await fetch(`${BASE_URL}/categories`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(categoryData),
      });
      return handleResponse(res);
    },

    update: async (id: number, categoryData: { name: string; description?: string; status?: string }): Promise<{ message: string; category: Category }> => {
      const res = await fetch(`${BASE_URL}/categories/${id}`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify(categoryData),
      });
      return handleResponse(res);
    },

    delete: async (id: number): Promise<{ message: string; deletedId: number }> => {
      const res = await fetch(`${BASE_URL}/categories/${id}`, {
        method: 'DELETE',
        headers: getAuthHeaders(),
      });
      return handleResponse(res);
    },
  },

  // Suppliers
  suppliers: {
    getAll: async (search?: string, status?: string): Promise<Supplier[]> => {
      const query = new URLSearchParams();
      if (search) query.append('search', search);
      if (status) query.append('status', status);
      const res = await fetch(`${BASE_URL}/suppliers?${query.toString()}`, {
        headers: getAuthHeaders(),
      });
      return handleResponse(res);
    },

    getById: async (id: number): Promise<{ supplier: Supplier; products: Product[] }> => {
      const res = await fetch(`${BASE_URL}/suppliers/${id}`, {
        headers: getAuthHeaders(),
      });
      return handleResponse(res);
    },

    create: async (supplierData: Partial<Supplier>): Promise<{ message: string; supplier: Supplier }> => {
      const res = await fetch(`${BASE_URL}/suppliers`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(supplierData),
      });
      return handleResponse(res);
    },

    update: async (id: number, supplierData: Partial<Supplier>): Promise<{ message: string; supplier: Supplier }> => {
      const res = await fetch(`${BASE_URL}/suppliers/${id}`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify(supplierData),
      });
      return handleResponse(res);
    },

    delete: async (id: number): Promise<{ message: string; deletedId: number }> => {
      const res = await fetch(`${BASE_URL}/suppliers/${id}`, {
        method: 'DELETE',
        headers: getAuthHeaders(),
      });
      return handleResponse(res);
    },
  },

  // Inventory & Stock
  inventory: {
    getAll: async (params: {
      product_id?: string;
      transaction_type?: string;
      search?: string;
      date_from?: string;
      date_to?: string;
      page?: number;
      limit?: number;
    } = {}): Promise<{ data: InventoryTransaction[]; pagination: PaginationMeta }> => {
      const query = new URLSearchParams();
      Object.entries(params).forEach(([key, val]) => {
        if (val !== undefined && val !== '') query.append(key, String(val));
      });
      const res = await fetch(`${BASE_URL}/inventory?${query.toString()}`, {
        headers: getAuthHeaders(),
      });
      return handleResponse(res);
    },

    getLowStock: async (): Promise<any[]> => {
      const res = await fetch(`${BASE_URL}/inventory/low-stock`, {
        headers: getAuthHeaders(),
      });
      return handleResponse(res);
    },

    stockIn: async (data: {
      product_id: number;
      supplier_id?: number;
      quantity: number;
      unit_cost?: number;
      reference_no?: string;
      notes?: string;
      created_by?: string;
    }): Promise<{ message: string; transaction: InventoryTransaction; updated_stock: number }> => {
      const res = await fetch(`${BASE_URL}/inventory/stock-in`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(data),
      });
      return handleResponse(res);
    },

    stockOut: async (data: {
      product_id: number;
      quantity: number;
      reason: string;
      reference_no?: string;
      notes?: string;
      created_by?: string;
    }): Promise<{ message: string; transaction: InventoryTransaction; updated_stock: number }> => {
      const res = await fetch(`${BASE_URL}/inventory/stock-out`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(data),
      });
      return handleResponse(res);
    },
  },

  // Reports
  reports: {
    getInventoryReport: async (category_id?: string): Promise<any[]> => {
      const query = category_id && category_id !== 'all' ? `?category_id=${category_id}` : '';
      const res = await fetch(`${BASE_URL}/reports/inventory${query}`, {
        headers: getAuthHeaders(),
      });
      return handleResponse(res);
    },
    getStockMovementReport: async (params: { date_from?: string; date_to?: string; product_id?: string } = {}): Promise<any[]> => {
      const query = new URLSearchParams();
      if (params.date_from) query.append('date_from', params.date_from);
      if (params.date_to) query.append('date_to', params.date_to);
      if (params.product_id && params.product_id !== 'all') query.append('product_id', params.product_id);
      const res = await fetch(`${BASE_URL}/reports/stock-movement?${query.toString()}`, {
        headers: getAuthHeaders(),
      });
      return handleResponse(res);
    },
    getLowStockReport: async (): Promise<any[]> => {
      const res = await fetch(`${BASE_URL}/reports/low-stock`, {
        headers: getAuthHeaders(),
      });
      return handleResponse(res);
    },
    getSupplierReport: async (): Promise<any[]> => {
      const res = await fetch(`${BASE_URL}/reports/suppliers`, {
        headers: getAuthHeaders(),
      });
      return handleResponse(res);
    },
  },

  // Seed / Reset
  seed: {
    reset: async (): Promise<{ message: string }> => {
      const res = await fetch(`${BASE_URL}/seed/reset`, {
        method: 'POST',
        headers: getAuthHeaders(),
      });
      return handleResponse(res);
    },
  },
};
