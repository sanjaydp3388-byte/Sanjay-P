import { Router, Request, Response } from 'express';
import { queryAll, queryGet, execute } from '../db.ts';

export const suppliersRouter = Router();

// Email regex validator
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// GET /api/suppliers/
suppliersRouter.get('/', (req: Request, res: Response) => {
  try {
    const { search = '', status = 'all' } = req.query;
    let whereClauses: string[] = [];
    let params: any[] = [];

    if (search) {
      whereClauses.push('(s.name LIKE ? OR s.company_name LIKE ? OR s.email LIKE ? OR s.phone LIKE ? OR s.city LIKE ? OR s.tax_id LIKE ?)');
      params.push(`%${search}%`, `%${search}%`, `%${search}%`, `%${search}%`, `%${search}%`, `%${search}%`);
    }

    if (status && status !== 'all') {
      whereClauses.push('s.status = ?');
      params.push(status);
    }

    const whereSql = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : '';

    const suppliers = queryAll(
      `SELECT 
        s.*,
        COUNT(p.id) as product_count,
        COALESCE(SUM(p.quantity), 0) as total_units_supplied
      FROM suppliers s
      LEFT JOIN products p ON s.id = p.supplier_id
      ${whereSql}
      GROUP BY s.id
      ORDER BY s.company_name ASC`,
      params
    );

    return res.json(suppliers);
  } catch (err: any) {
    return res.status(500).json({ error: 'Failed to retrieve suppliers: ' + err.message });
  }
});

// GET /api/suppliers/:id
suppliersRouter.get('/:id', (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id, 10);
    const supplier = queryGet('SELECT * FROM suppliers WHERE id = ?', [id]);
    if (!supplier) {
      return res.status(404).json({ error: 'Supplier not found.' });
    }
    const products = queryAll('SELECT id, name, sku, quantity, unit_price, status FROM products WHERE supplier_id = ?', [id]);
    return res.json({ supplier, products });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

// POST /api/suppliers/
suppliersRouter.post('/', (req: Request, res: Response) => {
  try {
    const {
      name,
      company_name,
      email,
      phone,
      address = '',
      city = '',
      state = '',
      country = 'USA',
      tax_id = '',
      status = 'Active',
    } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({ error: 'Contact person name is required.' });
    }
    if (!company_name || !company_name.trim()) {
      return res.status(400).json({ error: 'Company name is required.' });
    }
    if (!email || !email.trim()) {
      return res.status(400).json({ error: 'Email address is required.' });
    }
    if (!EMAIL_REGEX.test(email.trim())) {
      return res.status(400).json({ error: 'Please enter a valid email address (e.g. supplier@company.com).' });
    }
    if (!phone || !phone.trim()) {
      return res.status(400).json({ error: 'Phone number is required.' });
    }

    const result = execute(
      `INSERT INTO suppliers 
      (name, company_name, email, phone, address, city, state, country, tax_id, status, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))`,
      [name.trim(), company_name.trim(), email.trim(), phone.trim(), address.trim(), city.trim(), state.trim(), country.trim(), tax_id.trim(), status]
    );

    const created = queryGet('SELECT * FROM suppliers WHERE id = ?', [result.lastInsertRowid]);
    return res.status(201).json({
      message: 'Supplier created successfully',
      supplier: created,
    });
  } catch (err: any) {
    return res.status(500).json({ error: 'Failed to create supplier: ' + err.message });
  }
});

// PUT /api/suppliers/:id
suppliersRouter.put('/:id', (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id, 10);
    const existing = queryGet('SELECT id FROM suppliers WHERE id = ?', [id]);
    if (!existing) {
      return res.status(404).json({ error: 'Supplier not found.' });
    }

    const {
      name,
      company_name,
      email,
      phone,
      address = '',
      city = '',
      state = '',
      country = 'USA',
      tax_id = '',
      status = 'Active',
    } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({ error: 'Contact person name is required.' });
    }
    if (!company_name || !company_name.trim()) {
      return res.status(400).json({ error: 'Company name is required.' });
    }
    if (!email || !email.trim()) {
      return res.status(400).json({ error: 'Email is required.' });
    }
    if (!EMAIL_REGEX.test(email.trim())) {
      return res.status(400).json({ error: 'Please enter a valid email address.' });
    }
    if (!phone || !phone.trim()) {
      return res.status(400).json({ error: 'Phone is required.' });
    }

    execute(
      `UPDATE suppliers 
      SET name = ?, company_name = ?, email = ?, phone = ?, address = ?, city = ?, state = ?, country = ?, tax_id = ?, status = ?, updated_at = datetime('now')
      WHERE id = ?`,
      [name.trim(), company_name.trim(), email.trim(), phone.trim(), address.trim(), city.trim(), state.trim(), country.trim(), tax_id.trim(), status, id]
    );

    const updated = queryGet('SELECT * FROM suppliers WHERE id = ?', [id]);
    return res.json({
      message: 'Supplier updated successfully',
      supplier: updated,
    });
  } catch (err: any) {
    return res.status(500).json({ error: 'Failed to update supplier: ' + err.message });
  }
});

// DELETE /api/suppliers/:id
suppliersRouter.delete('/:id', (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id, 10);
    const supplier = queryGet('SELECT id, company_name FROM suppliers WHERE id = ?', [id]);
    if (!supplier) {
      return res.status(404).json({ error: 'Supplier not found.' });
    }

    // Check if supplier has assigned products
    const productCount = queryGet<{ count: number }>('SELECT COUNT(*) as count FROM products WHERE supplier_id = ?', [id]);
    if (productCount && productCount.count > 0) {
      return res.status(400).json({
        error: `Cannot delete supplier "${supplier.company_name}". They supply ${productCount.count} product(s). Please reassign those products first.`,
      });
    }

    execute('DELETE FROM suppliers WHERE id = ?', [id]);
    return res.json({
      message: `Supplier "${supplier.company_name}" deleted successfully.`,
      deletedId: id,
    });
  } catch (err: any) {
    return res.status(500).json({ error: 'Failed to delete supplier: ' + err.message });
  }
});
