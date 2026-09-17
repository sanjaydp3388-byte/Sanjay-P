import { Router, Request, Response } from 'express';
import { seedDatabase } from '../db.ts';

export const seedRouter = Router();

// POST /api/seed/reset
seedRouter.post('/reset', (req: Request, res: Response) => {
  try {
    seedDatabase();
    return res.json({
      message: 'Database successfully reset and re-seeded with realistic sample products, categories, suppliers, and transactions.',
    });
  } catch (err: any) {
    return res.status(500).json({ error: 'Failed to reset database: ' + err.message });
  }
});
