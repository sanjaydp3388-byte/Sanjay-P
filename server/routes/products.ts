import { Router, Request, Response } from 'express';
import { queryAll, queryGet, execute } from '../db.ts';

export const productsRouter = Router();

// GET /api/products/
productsRouter.get('/', (req: Request, res: Response) => {
  try {
    const {
      search = '',
      category_id,
      supplier_id,
      status,
      stock_status, // 'all', 'normal', 'low', 'out'
      sort_by = 'id',
      order = 'DESC',
      page = '1',
      limit = '10',
    } = req.query;

    const pageNum = Math.max(1, parseInt(page as string, 10) || 1);
    const limitNum = Math.max(1, parseInt(limit as string, 10) || 10);
    const offset = (pageNum - 1) * limitNum;

    let whereClauses: string[] = [];
    let params: any[] = [];

    if (search) {
      const searchTerm = `%${search}%`;
      whereClauses.push('(p.name LIKE ? OR p.sku LIKE ? OR c.name LIKE ? OR s.company_name LIKE ? OR p.description LIKE ?)');
      params.push(searchTerm, searchTerm, searchTerm, searchTerm, searchTerm);
    }

    if (category_id && category_id !== 'all') {
      whereClauses.push('p.category_id = ?');
      params.push(category_id);
    }

    if (supplier_id && supplier_id !== 'all') {
      whereClauses.push('p.supplier_id = ?');
      params.push(supplier_id);
    }

    if (status && status !== 'all') {
      whereClauses.push('p.status = ?');
      params.push(status);
    }

    if (stock_status === 'low') {
      whereClauses.push('p.quantity > 0 AND p.quantity <= p.min_stock');
    } else if (stock_status === 'out') {
      whereClauses.push('p.quantity <= 0');
    } else if (stock_status === 'normal') {
      whereClauses.push('p.quantity > p.min_stock');
    }

    const whereSql = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : '';

    // Validate sorting column to prevent SQL injection
    const allowedSortFields: Record<string, string> = {
      id: 'p.id',
      name: 'p.name',
      sku: 'p.sku',
      quantity: 'p.quantity',
      unit_price: 'p.unit_price',
      cost_price: 'p.cost_price',
      category: 'c.name',
      supplier: 's.company_name',
      created_at: 'p.created_at',
    };
    const sortField = allowedSortFields[sort_by as string] || 'p.id';
    const sortOrder = (order as string).toUpperCase() === 'ASC' ? 'ASC' : 'DESC';

    // Count total
    const countSql = `
      SELECT COUNT(*) as total
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      LEFT JOIN suppliers s ON p.supplier_id = s.id
      ${whereSql}
    `;
    const totalCountRes = queryGet<{ total: number }>(countSql, params);
    const total = totalCountRes ? totalCountRes.total : 0;

    // Fetch data with joins
    const dataSql = `
      SELECT 
        p.id,
        p.name,
        p.sku,
        p.category_id,
        c.name as category_name,
        p.supplier_id,
        s.name as supplier_contact,
        s.company_name as supplier_name,
        p.description,
        p.unit_price,
        p.cost_price,
        p.quantity,
        p.min_stock,
        p.max_stock,
        p.unit,
        p.status,
        p.created_at,
        p.updated_at,
        CASE
          WHEN p.quantity <= 0 THEN 'Out of Stock'
          WHEN p.quantity <= p.min_stock THEN 'Low Stock'
          ELSE 'In Stock'
        END as stock_status
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      LEFT JOIN suppliers s ON p.supplier_id = s.id
      ${whereSql}
      ORDER BY ${sortField} ${sortOrder}
      LIMIT ? OFFSET ?
    `;

    const products = queryAll(dataSql, [...params, limitNum, offset]);

    return res.json({
      data: products,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages: Math.ceil(total / limitNum) || 1,
      },
    });
  } catch (err: any) {
    console.error('Fetch products error:', err);
    return res.status(500).json({ error: 'Failed to retrieve products: ' + err.message });
  }
});

// GET /api/products/:id (with detailed specs & stock history)
productsRouter.get('/:id', (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) {
      return res.status(400).json({ error: 'Invalid product ID.' });
    }

    const product = queryGet(
      `SELECT 
        p.*,
        c.name as category_name,
        s.name as supplier_contact,
        s.company_name as supplier_name,
        s.email as supplier_email,
        s.phone as supplier_phone,
        CASE
          WHEN p.quantity <= 0 THEN 'Out of Stock'
          WHEN p.quantity <= p.min_stock THEN 'Low Stock'
          ELSE 'In Stock'
        END as stock_status
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      LEFT JOIN suppliers s ON p.supplier_id = s.id
      WHERE p.id = ?`,
      [id]
    );

    if (!product) {
      return res.status(404).json({ error: 'Product not found with ID ' + id });
    }

    // Get stock transaction history for this product
    const history = queryAll(
      `SELECT 
        t.*,
        u.first_name || ' ' || u.last_name as user_name
      FROM inventory_transactions t
      LEFT JOIN users u ON t.user_id = u.id
      WHERE t.product_id = ?
      ORDER BY t.created_at DESC`,
      [id]
    );

    return res.json({
      product,
      transactions: history,
    });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

// POST /api/products/
productsRouter.post('/', (req: Request, res: Response) => {
  try {
    const {
      name,
      sku,
      category_id,
      supplier_id,
      description = '',
      unit_price = 0,
      cost_price = 0,
      quantity = 0,
      min_stock = 10,
      max_stock = 500,
      unit = 'pcs',
      status = 'Active',
    } = req.body;

    // Validation
    if (!name || !name.trim()) {
      return res.status(400).json({ error: 'Product name is required.' });
    }
    if (!sku || !sku.trim()) {
      return res.status(400).json({ error: 'SKU is required.' });
    }
    if (!category_id) {
      return res.status(400).json({ error: 'Category is required.' });
    }
    if (!supplier_id) {
      return res.status(400).json({ error: 'Supplier is required.' });
    }

    const trimmedSku = sku.trim().toUpperCase();

    // Check duplicate SKU
    const existingSku = queryGet('SELECT id FROM products WHERE sku = ?', [trimmedSku]);
    if (existingSku) {
      return res.status(400).json({ error: `SKU "${trimmedSku}" already exists. Please choose a unique SKU.` });
    }

    const numUnitPrice = parseFloat(unit_price);
    const numCostPrice = parseFloat(cost_price);
    const numQty = parseInt(quantity, 10);
    const numMin = parseInt(min_stock, 10);
    const numMax = parseInt(max_stock, 10);

    if (isNaN(numUnitPrice) || numUnitPrice < 0) {
      return res.status(400).json({ error: 'Unit price cannot be negative.' });
    }
    if (isNaN(numCostPrice) || numCostPrice < 0) {
      return res.status(400).json({ error: 'Cost price cannot be negative.' });
    }
    if (isNaN(numQty) || numQty < 0) {
      return res.status(400).json({ error: 'Quantity cannot be negative.' });
    }
    if (isNaN(numMin) || numMin < 0) {
      return res.status(400).json({ error: 'Minimum stock cannot be negative.' });
    }
    if (numMax < numMin) {
      return res.status(400).json({ error: 'Maximum stock cannot be less than minimum stock.' });
    }

    const result = execute(
      `INSERT INTO products 
      (name, sku, category_id, supplier_id, description, unit_price, cost_price, quantity, min_stock, max_stock, unit, status, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))`,
      [name.trim(), trimmedSku, category_id, supplier_id, description.trim(), numUnitPrice, numCostPrice, numQty, numMin, numMax, unit.trim(), status]
    );

    const newProductId = result.lastInsertRowid;

    // If initial quantity > 0, record initial inventory transaction
    if (numQty > 0) {
      execute(
        `INSERT INTO inventory_transactions 
        (product_id, transaction_type, quantity, previous_stock, updated_stock, unit_cost, total_cost, reason, reference_no, notes, supplier_id, created_by, created_at)
        VALUES (?, 'STOCK_IN', ?, 0, ?, ?, ?, 'Initial inventory stock', 'INIT-' || ?, 'Initial stock recorded on product creation', ?, 'System Admin', datetime('now'))`,
        [newProductId, numQty, numQty, numCostPrice, numCostPrice * numQty, trimmedSku, supplier_id]
      );
    }

    const createdProduct = queryGet('SELECT * FROM products WHERE id = ?', [newProductId]);
    return res.status(201).json({
      message: 'Product created successfully',
      product: createdProduct,
    });
  } catch (err: any) {
    console.error('Create product error:', err);
    return res.status(500).json({ error: 'Failed to create product: ' + err.message });
  }
});

// PUT /api/products/:id
productsRouter.put('/:id', (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) {
      return res.status(400).json({ error: 'Invalid product ID.' });
    }

    const existing = queryGet('SELECT id, sku, quantity FROM products WHERE id = ?', [id]);
    if (!existing) {
      return res.status(404).json({ error: 'Product not found.' });
    }

    const {
      name,
      sku,
      category_id,
      supplier_id,
      description = '',
      unit_price,
      cost_price,
      quantity,
      min_stock,
      max_stock,
      unit,
      status,
    } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({ error: 'Product name is required.' });
    }
    if (!sku || !sku.trim()) {
      return res.status(400).json({ error: 'SKU is required.' });
    }

    const trimmedSku = sku.trim().toUpperCase();

    // Check SKU uniqueness if changed
    if (trimmedSku !== existing.sku) {
      const duplicateSku = queryGet('SELECT id FROM products WHERE sku = ? AND id != ?', [trimmedSku, id]);
      if (duplicateSku) {
        return res.status(400).json({ error: `SKU "${trimmedSku}" is already taken by another product.` });
      }
    }

    const numUnitPrice = parseFloat(unit_price);
    const numCostPrice = parseFloat(cost_price);
    const numQty = parseInt(quantity, 10);
    const numMin = parseInt(min_stock, 10);
    const numMax = parseInt(max_stock, 10);

    if (numUnitPrice < 0 || numCostPrice < 0 || numQty < 0 || numMin < 0) {
      return res.status(400).json({ error: 'Prices and stock quantities cannot be negative.' });
    }

    execute(
      `UPDATE products 
      SET name = ?, sku = ?, category_id = ?, supplier_id = ?, description = ?, unit_price = ?, cost_price = ?, quantity = ?, min_stock = ?, max_stock = ?, unit = ?, status = ?, updated_at = datetime('now')
      WHERE id = ?`,
      [name.trim(), trimmedSku, category_id, supplier_id, description.trim(), numUnitPrice, numCostPrice, numQty, numMin, numMax, unit || 'pcs', status || 'Active', id]
    );

    const updated = queryGet('SELECT * FROM products WHERE id = ?', [id]);
    return res.json({
      message: 'Product updated successfully',
      product: updated,
    });
  } catch (err: any) {
    return res.status(500).json({ error: 'Failed to update product: ' + err.message });
  }
});

// DELETE /api/products/:id
productsRouter.delete('/:id', (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) {
      return res.status(400).json({ error: 'Invalid product ID.' });
    }

    const product = queryGet('SELECT id, name, sku FROM products WHERE id = ?', [id]);
    if (!product) {
      return res.status(404).json({ error: 'Product not found.' });
    }

    // Delete transactions and product
    execute('DELETE FROM inventory_transactions WHERE product_id = ?', [id]);
    execute('DELETE FROM products WHERE id = ?', [id]);

    return res.json({
      message: `Product "${product.name}" (${product.sku}) deleted successfully.`,
      deletedId: id,
    });
  } catch (err: any) {
    return res.status(500).json({ error: 'Failed to delete product: ' + err.message });
  }
});
