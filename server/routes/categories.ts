import { Router, Request, Response } from 'express';
import { queryAll, queryGet, execute } from '../db.ts';

export const categoriesRouter = Router();

// GET /api/categories/
categoriesRouter.get('/', (req: Request, res: Response) => {
  try {
    const { search = '', status = 'all' } = req.query;
    let whereClauses: string[] = [];
    let params: any[] = [];

    if (search) {
      whereClauses.push('(name LIKE ? OR description LIKE ?)');
      params.push(`%${search}%`, `%${search}%`);
    }

    if (status && status !== 'all') {
      whereClauses.push('status = ?');
      params.push(status);
    }

    const whereSql = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : '';

    const categories = queryAll(
      `SELECT 
        c.*,
        COUNT(p.id) as product_count,
        COALESCE(SUM(p.quantity), 0) as total_units
      FROM categories c
      LEFT JOIN products p ON c.id = p.category_id
      ${whereSql}
      GROUP BY c.id
      ORDER BY c.name ASC`,
      params
    );

    return res.json(categories);
  } catch (err: any) {
    return res.status(500).json({ error: 'Failed to retrieve categories: ' + err.message });
  }
});

// GET /api/categories/:id
categoriesRouter.get('/:id', (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id, 10);
    const category = queryGet('SELECT * FROM categories WHERE id = ?', [id]);
    if (!category) {
      return res.status(404).json({ error: 'Category not found.' });
    }
    return res.json(category);
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

// POST /api/categories/
categoriesRouter.post('/', (req: Request, res: Response) => {
  try {
    const { name, description = '', status = 'Active' } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({ error: 'Category name is required.' });
    }

    const trimmedName = name.trim();

    // Prevent duplicate category names
    const existing = queryGet('SELECT id FROM categories WHERE LOWER(name) = LOWER(?)', [trimmedName]);
    if (existing) {
      return res.status(400).json({ error: `Category "${trimmedName}" already exists. Category names must be unique.` });
    }

    const result = execute(
      'INSERT INTO categories (name, description, status, created_at, updated_at) VALUES (?, ?, ?, datetime("now"), datetime("now"))',
      [trimmedName, description.trim(), status]
    );

    const created = queryGet('SELECT * FROM categories WHERE id = ?', [result.lastInsertRowid]);
    return res.status(201).json({
      message: 'Category created successfully',
      category: created,
    });
  } catch (err: any) {
    return res.status(500).json({ error: 'Failed to create category: ' + err.message });
  }
});

// PUT /api/categories/:id
categoriesRouter.put('/:id', (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id, 10);
    const { name, description = '', status = 'Active' } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({ error: 'Category name is required.' });
    }

    const trimmedName = name.trim();
    const existing = queryGet('SELECT id FROM categories WHERE id = ?', [id]);
    if (!existing) {
      return res.status(404).json({ error: 'Category not found.' });
    }

    // Check duplicate name
    const duplicate = queryGet('SELECT id FROM categories WHERE LOWER(name) = LOWER(?) AND id != ?', [trimmedName, id]);
    if (duplicate) {
      return res.status(400).json({ error: `Category "${trimmedName}" already exists.` });
    }

    execute(
      'UPDATE categories SET name = ?, description = ?, status = ?, updated_at = datetime("now") WHERE id = ?',
      [trimmedName, description.trim(), status, id]
    );

    const updated = queryGet('SELECT * FROM categories WHERE id = ?', [id]);
    return res.json({
      message: 'Category updated successfully',
      category: updated,
    });
  } catch (err: any) {
    return res.status(500).json({ error: 'Failed to update category: ' + err.message });
  }
});

// DELETE /api/categories/:id
categoriesRouter.delete('/:id', (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id, 10);
    const category = queryGet('SELECT id, name FROM categories WHERE id = ?', [id]);
    if (!category) {
      return res.status(404).json({ error: 'Category not found.' });
    }

    // Check if any products are using this category
    const productCount = queryGet<{ count: number }>('SELECT COUNT(*) as count FROM products WHERE category_id = ?', [id]);
    if (productCount && productCount.count > 0) {
      return res.status(400).json({
        error: `Cannot delete category "${category.name}". It is assigned to ${productCount.count} product(s). Please reassign or delete these products first.`,
      });
    }

    execute('DELETE FROM categories WHERE id = ?', [id]);
    return res.json({
      message: `Category "${category.name}" deleted successfully.`,
      deletedId: id,
    });
  } catch (err: any) {
    return res.status(500).json({ error: 'Failed to delete category: ' + err.message });
  }
});
