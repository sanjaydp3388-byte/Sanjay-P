import { Router, Request, Response } from 'express';
import { queryGet, queryAll } from '../db.ts';

export const authRouter = Router();

// POST /api/auth/login
authRouter.post('/login', (req: Request, res: Response) => {
  try {
    const { username, email, password } = req.body;
    const identifier = (username || email || '').trim();

    if (!identifier || !password) {
      return res.status(400).json({ error: 'Username/email and password are required.' });
    }

    const user = queryGet(
      'SELECT id, username, email, password, first_name, last_name, role, avatar FROM users WHERE username = ? OR email = ?',
      [identifier, identifier]
    );

    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials. User not found.' });
    }

    if (user.password !== password) {
      return res.status(401).json({ error: 'Invalid password. Please check your credentials.' });
    }

    const { password: _, ...safeUser } = user;
    // Generate a simple bearer session token for demo & API testing
    const token = `token_${safeUser.id}_${safeUser.role}_${Buffer.from(safeUser.username).toString('base64')}`;

    return res.json({
      message: 'Login successful',
      token,
      user: safeUser,
    });
  } catch (err: any) {
    console.error('Login error:', err);
    return res.status(500).json({ error: 'Internal server error during authentication.' });
  }
});

// GET /api/auth/me
authRouter.get('/me', (req: Request, res: Response) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized. No authorization header provided.' });
  }

  const token = authHeader.split(' ')[1];
  const parts = token.split('_');
  const userId = Number(parts[1]);

  if (!userId) {
    return res.status(401).json({ error: 'Invalid authentication token.' });
  }

  const user = queryGet(
    'SELECT id, username, email, first_name, last_name, role, avatar, created_at FROM users WHERE id = ?',
    [userId]
  );

  if (!user) {
    return res.status(401).json({ error: 'User account not found.' });
  }

  return res.json({ user });
});

// GET /api/auth/users (Admin only)
authRouter.get('/users', (req: Request, res: Response) => {
  try {
    const users = queryAll(
      'SELECT id, username, email, first_name, last_name, role, avatar, created_at FROM users ORDER BY id ASC'
    );
    return res.json(users);
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

// POST /api/auth/logout
authRouter.post('/logout', (req: Request, res: Response) => {
  return res.json({ message: 'Successfully logged out.' });
});
