import { Router, Request, Response } from 'express';
import { queryAll } from '../db.ts';

export const reportsRouter = Router();

// GET /api/reports/inventory
reportsRouter.get('/inventory', (req: Request, res: Response) => {
  try {
    const { category_id } = req.query;
    let where = 'WHERE p.status = "Active"';
    let params: any[] = [];
    if (category_id && category_id !== 'all') {
      where += ' AND p.category_id = ?';
      params.push(category_id);
    }

    const data = queryAll(`
      SELECT 
        p.id,
        p.name as product_name,
        p.sku,
        c.name as category_name,
        s.company_name as supplier_name,
        p.quantity as current_stock,
        p.unit,
        p.unit_price,
        p.cost_price,
        ROUND(p.quantity * p.unit_price, 2) as inventory_value,
        ROUND(p.quantity * p.cost_price, 2) as cost_value,
        ROUND((p.quantity * p.unit_price) - (p.quantity * p.cost_price), 2) as potential_profit
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      LEFT JOIN suppliers s ON p.supplier_id = s.id
      ${where}
      ORDER BY inventory_value DESC
    `, params);

    return res.json(data);
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

// GET /api/reports/stock-movement
reportsRouter.get('/stock-movement', (req: Request, res: Response) => {
  try {
    const { date_from, date_to, product_id } = req.query;
    let whereClauses: string[] = [];
    let params: any[] = [];

    if (date_from) {
      whereClauses.push("date(t.created_at) >= date(?)");
      params.push(date_from);
    }
    if (date_to) {
      whereClauses.push("date(t.created_at) <= date(?)");
      params.push(date_to);
    }
    if (product_id && product_id !== 'all') {
      whereClauses.push("t.product_id = ?");
      params.push(product_id);
    }

    const whereSql = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : '';

    const data = queryAll(`
      SELECT 
        t.id,
        t.created_at as date,
        p.name as product_name,
        p.sku,
        t.transaction_type,
        CASE WHEN t.transaction_type = 'STOCK_IN' THEN t.quantity ELSE 0 END as stock_in,
        CASE WHEN t.transaction_type = 'STOCK_OUT' THEN t.quantity ELSE 0 END as stock_out,
        t.previous_stock,
        t.updated_stock,
        t.reference_no,
        t.reason,
        t.created_by as user_name
      FROM inventory_transactions t
      LEFT JOIN products p ON t.product_id = p.id
      ${whereSql}
      ORDER BY t.created_at DESC
    `, params);

    return res.json(data);
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

// GET /api/reports/low-stock
reportsRouter.get('/low-stock', (req: Request, res: Response) => {
  try {
    const data = queryAll(`
      SELECT 
        p.id,
        p.name as product_name,
        p.sku,
        c.name as category_name,
        p.quantity as current_quantity,
        p.min_stock as minimum_quantity,
        (p.min_stock - p.quantity) as deficit,
        p.unit,
        s.company_name as supplier_name,
        s.email as supplier_email,
        s.phone as supplier_phone,
        CASE 
          WHEN p.quantity <= 0 THEN 'Out of Stock' 
          ELSE 'Low Stock Alert' 
        END as alert_status
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      LEFT JOIN suppliers s ON p.supplier_id = s.id
      WHERE p.quantity <= p.min_stock AND p.status = 'Active'
      ORDER BY p.quantity ASC, deficit DESC
    `);

    return res.json(data);
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

// GET /api/reports/suppliers
reportsRouter.get('/suppliers', (req: Request, res: Response) => {
  try {
    const data = queryAll(`
      SELECT 
        s.id,
        s.name as contact_person,
        s.company_name as supplier,
        s.email,
        s.phone,
        s.city,
        s.country,
        s.tax_id,
        COUNT(p.id) as number_of_products,
        COALESCE(SUM(p.quantity), 0) as total_stock,
        ROUND(COALESCE(SUM(p.quantity * p.cost_price), 0), 2) as total_valuation
      FROM suppliers s
      LEFT JOIN products p ON s.id = p.supplier_id AND p.status = 'Active'
      GROUP BY s.id
      ORDER BY number_of_products DESC, total_stock DESC
    `);

    return res.json(data);
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});
