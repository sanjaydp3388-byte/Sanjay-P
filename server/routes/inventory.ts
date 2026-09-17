import { Router, Request, Response } from 'express';
import { queryAll, queryGet, execute } from '../db.ts';

export const inventoryRouter = Router();

// GET /api/inventory/ (Transaction history)
inventoryRouter.get('/', (req: Request, res: Response) => {
  try {
    const {
      product_id,
      transaction_type, // 'STOCK_IN' or 'STOCK_OUT'
      search = '',
      date_from,
      date_to,
      page = '1',
      limit = '15',
    } = req.query;

    const pageNum = Math.max(1, parseInt(page as string, 10) || 1);
    const limitNum = Math.max(1, parseInt(limit as string, 10) || 15);
    const offset = (pageNum - 1) * limitNum;

    let whereClauses: string[] = [];
    let params: any[] = [];

    if (product_id && product_id !== 'all') {
      whereClauses.push('t.product_id = ?');
      params.push(product_id);
    }

    if (transaction_type && transaction_type !== 'all') {
      whereClauses.push('t.transaction_type = ?');
      params.push(transaction_type);
    }

    if (search) {
      whereClauses.push('(p.name LIKE ? OR p.sku LIKE ? OR t.reference_no LIKE ? OR t.reason LIKE ? OR t.created_by LIKE ?)');
      const s = `%${search}%`;
      params.push(s, s, s, s, s);
    }

    if (date_from) {
      whereClauses.push("date(t.created_at) >= date(?)");
      params.push(date_from);
    }

    if (date_to) {
      whereClauses.push("date(t.created_at) <= date(?)");
      params.push(date_to);
    }

    const whereSql = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : '';

    const countSql = `
      SELECT COUNT(*) as total 
      FROM inventory_transactions t
      LEFT JOIN products p ON t.product_id = p.id
      ${whereSql}
    `;
    const countRes = queryGet<{ total: number }>(countSql, params);
    const total = countRes ? countRes.total : 0;

    const dataSql = `
      SELECT 
        t.id,
        t.product_id,
        p.name as product_name,
        p.sku as product_sku,
        p.unit as product_unit,
        t.transaction_type,
        t.quantity,
        t.previous_stock,
        t.updated_stock,
        t.unit_cost,
        t.total_cost,
        t.reason,
        t.reference_no,
        t.notes,
        t.supplier_id,
        s.company_name as supplier_name,
        t.user_id,
        t.created_by,
        t.created_at
      FROM inventory_transactions t
      LEFT JOIN products p ON t.product_id = p.id
      LEFT JOIN suppliers s ON t.supplier_id = s.id
      ${whereSql}
      ORDER BY t.created_at DESC, t.id DESC
      LIMIT ? OFFSET ?
    `;

    const transactions = queryAll(dataSql, [...params, limitNum, offset]);

    return res.json({
      data: transactions,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages: Math.ceil(total / limitNum) || 1,
      },
    });
  } catch (err: any) {
    return res.status(500).json({ error: 'Failed to retrieve transactions: ' + err.message });
  }
});

// GET /api/inventory/low-stock
inventoryRouter.get('/low-stock', (req: Request, res: Response) => {
  try {
    const lowStockProducts = queryAll(`
      SELECT 
        p.id,
        p.name,
        p.sku,
        p.quantity,
        p.min_stock,
        p.max_stock,
        p.unit,
        p.unit_price,
        p.cost_price,
        c.name as category_name,
        s.id as supplier_id,
        s.company_name as supplier_name,
        s.email as supplier_email,
        s.phone as supplier_phone,
        CASE
          WHEN p.quantity <= 0 THEN 'Out of Stock'
          ELSE 'Low Stock'
        END as alert_type,
        (p.min_stock - p.quantity) as deficit
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      LEFT JOIN suppliers s ON p.supplier_id = s.id
      WHERE p.quantity <= p.min_stock AND p.status = 'Active'
      ORDER BY p.quantity ASC, (p.min_stock - p.quantity) DESC
    `);

    return res.json(lowStockProducts);
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

// POST /api/inventory/stock-in
inventoryRouter.post('/stock-in', (req: Request, res: Response) => {
  try {
    const {
      product_id,
      supplier_id,
      quantity,
      unit_cost,
      reference_no,
      notes = '',
      created_by = 'Inventory Admin',
    } = req.body;

    const prodId = parseInt(product_id, 10);
    const qty = parseInt(quantity, 10);
    const cost = parseFloat(unit_cost) || 0;

    if (!prodId || isNaN(prodId)) {
      return res.status(400).json({ error: 'Product selection is required.' });
    }
    if (!qty || isNaN(qty) || qty <= 0) {
      return res.status(400).json({ error: 'Quantity must be a positive integer greater than zero.' });
    }
    if (cost < 0) {
      return res.status(400).json({ error: 'Unit cost cannot be negative.' });
    }

    const product = queryGet('SELECT id, name, sku, quantity, cost_price FROM products WHERE id = ?', [prodId]);
    if (!product) {
      return res.status(404).json({ error: 'Selected product does not exist.' });
    }

    const previous_stock = product.quantity;
    const updated_stock = previous_stock + qty;
    const total_cost = qty * cost;
    const ref = reference_no?.trim() || `PO-${Date.now().toString().slice(-6)}`;

    // Update product quantity and optionally cost price
    execute(
      `UPDATE products 
      SET quantity = ?, 
          cost_price = CASE WHEN ? > 0 THEN ? ELSE cost_price END,
          updated_at = datetime('now')
      WHERE id = ?`,
      [updated_stock, cost, cost, prodId]
    );

    // Record transaction
    const result = execute(
      `INSERT INTO inventory_transactions 
      (product_id, transaction_type, quantity, previous_stock, updated_stock, unit_cost, total_cost, reason, reference_no, notes, supplier_id, created_by, created_at)
      VALUES (?, 'STOCK_IN', ?, ?, ?, ?, ?, 'Stock Received', ?, ?, ?, ?, datetime('now'))`,
      [prodId, qty, previous_stock, updated_stock, cost, total_cost, ref, notes.trim(), supplier_id || null, created_by]
    );

    const createdTx = queryGet('SELECT * FROM inventory_transactions WHERE id = ?', [result.lastInsertRowid]);

    return res.status(201).json({
      message: `Successfully added ${qty} units of "${product.name}". New stock level: ${updated_stock}`,
      transaction: createdTx,
      updated_stock,
    });
  } catch (err: any) {
    return res.status(500).json({ error: 'Failed to process Stock In: ' + err.message });
  }
});

// POST /api/inventory/stock-out
inventoryRouter.post('/stock-out', (req: Request, res: Response) => {
  try {
    const {
      product_id,
      quantity,
      reason,
      reference_no,
      notes = '',
      created_by = 'Inventory Admin',
    } = req.body;

    const prodId = parseInt(product_id, 10);
    const qty = parseInt(quantity, 10);

    if (!prodId || isNaN(prodId)) {
      return res.status(400).json({ error: 'Product selection is required.' });
    }
    if (!qty || isNaN(qty) || qty <= 0) {
      return res.status(400).json({ error: 'Quantity must be a positive integer greater than zero.' });
    }
    if (!reason || !reason.trim()) {
      return res.status(400).json({ error: 'Reason for stock out is required (e.g. Sales, Damaged, Expired, Internal Issue).' });
    }

    const product = queryGet('SELECT id, name, sku, quantity, unit_price FROM products WHERE id = ?', [prodId]);
    if (!product) {
      return res.status(404).json({ error: 'Selected product does not exist.' });
    }

    // Critical validation: Stock-out CANNOT exceed available stock!
    if (qty > product.quantity) {
      return res.status(400).json({
        error: `Insufficient stock for "${product.name}". Available stock is ${product.quantity} units, but requested removal is ${qty} units.`,
        available_stock: product.quantity,
      });
    }

    const previous_stock = product.quantity;
    const updated_stock = previous_stock - qty;
    const ref = reference_no?.trim() || `SO-${Date.now().toString().slice(-6)}`;

    // Update product quantity
    execute(
      "UPDATE products SET quantity = ?, updated_at = datetime('now') WHERE id = ?",
      [updated_stock, prodId]
    );

    // Record transaction
    const result = execute(
      `INSERT INTO inventory_transactions 
      (product_id, transaction_type, quantity, previous_stock, updated_stock, unit_cost, total_cost, reason, reference_no, notes, created_by, created_at)
      VALUES (?, 'STOCK_OUT', ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))`,
      [prodId, qty, previous_stock, updated_stock, product.unit_price, product.unit_price * qty, reason.trim(), ref, notes.trim(), created_by]
    );

    const createdTx = queryGet('SELECT * FROM inventory_transactions WHERE id = ?', [result.lastInsertRowid]);

    return res.status(201).json({
      message: `Successfully issued ${qty} units of "${product.name}". Remaining stock: ${updated_stock}`,
      transaction: createdTx,
      updated_stock,
    });
  } catch (err: any) {
    return res.status(500).json({ error: 'Failed to process Stock Out: ' + err.message });
  }
});
