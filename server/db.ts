import initSqlJs from 'sql.js';
import fs from 'fs';
import path from 'path';

let db: any = null;
const DATA_DIR = path.join(process.cwd(), 'data');
const DB_PATH = path.join(DATA_DIR, 'inventory.sqlite3');

export async function getDb() {
  if (db) return db;

  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }

  const SQL = await initSqlJs();

  if (fs.existsSync(DB_PATH)) {
    try {
      const fileBuffer = fs.readFileSync(DB_PATH);
      db = new SQL.Database(fileBuffer);
    } catch (e) {
      console.error('Error loading existing sqlite database, creating new:', e);
      db = new SQL.Database();
    }
  } else {
    db = new SQL.Database();
  }

  // Enable foreign keys
  db.run('PRAGMA foreign_keys = ON;');

  // Initialize schema
  initSchema(db);
  seedIfEmpty(db);
  persistDb();

  return db;
}

export function persistDb() {
  if (!db) return;
  try {
    const data = db.export();
    const buffer = Buffer.from(data);
    fs.writeFileSync(DB_PATH, buffer);
  } catch (err) {
    console.error('Failed to persist sqlite db to disk:', err);
  }
}

function initSchema(database: any) {
  database.run(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      email TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      first_name TEXT NOT NULL,
      last_name TEXT NOT NULL,
      role TEXT NOT NULL DEFAULT 'staff',
      avatar TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS categories (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT UNIQUE NOT NULL,
      description TEXT,
      status TEXT NOT NULL DEFAULT 'Active',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS suppliers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      company_name TEXT NOT NULL,
      email TEXT NOT NULL,
      phone TEXT NOT NULL,
      address TEXT,
      city TEXT,
      state TEXT,
      country TEXT DEFAULT 'USA',
      tax_id TEXT,
      status TEXT NOT NULL DEFAULT 'Active',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS products (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      sku TEXT UNIQUE NOT NULL,
      category_id INTEGER NOT NULL REFERENCES categories(id) ON DELETE RESTRICT,
      supplier_id INTEGER NOT NULL REFERENCES suppliers(id) ON DELETE RESTRICT,
      description TEXT,
      unit_price REAL NOT NULL DEFAULT 0.0,
      cost_price REAL NOT NULL DEFAULT 0.0,
      quantity INTEGER NOT NULL DEFAULT 0,
      min_stock INTEGER NOT NULL DEFAULT 10,
      max_stock INTEGER NOT NULL DEFAULT 500,
      unit TEXT NOT NULL DEFAULT 'pcs',
      status TEXT NOT NULL DEFAULT 'Active',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS inventory_transactions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
      transaction_type TEXT NOT NULL, -- 'STOCK_IN' or 'STOCK_OUT'
      quantity INTEGER NOT NULL,
      previous_stock INTEGER NOT NULL,
      updated_stock INTEGER NOT NULL,
      unit_cost REAL DEFAULT 0.0,
      total_cost REAL DEFAULT 0.0,
      reason TEXT,
      reference_no TEXT,
      notes TEXT,
      supplier_id INTEGER REFERENCES suppliers(id),
      user_id INTEGER REFERENCES users(id),
      created_by TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);
}

export function queryAll<T = any>(sql: string, params: any[] = []): T[] {
  if (!db) throw new Error('Database not initialized');
  const stmt = db.prepare(sql);
  if (params && params.length > 0) {
    stmt.bind(params);
  }
  const results: T[] = [];
  while (stmt.step()) {
    results.push(stmt.getAsObject() as T);
  }
  stmt.free();
  return results;
}

export function queryGet<T = any>(sql: string, params: any[] = []): T | null {
  const all = queryAll<T>(sql, params);
  return all.length > 0 ? all[0] : null;
}

export function execute(sql: string, params: any[] = []): { lastInsertRowid: number; changes: number } {
  if (!db) throw new Error('Database not initialized');
  db.run(sql, params);
  const rowidRes = db.exec('SELECT last_insert_rowid() as id, changes() as changes;');
  let lastInsertRowid = 0;
  let changes = 0;
  if (rowidRes && rowidRes.length > 0 && rowidRes[0].values && rowidRes[0].values.length > 0) {
    lastInsertRowid = Number(rowidRes[0].values[0][0]) || 0;
    changes = Number(rowidRes[0].values[0][1]) || 0;
  }
  persistDb();
  return { lastInsertRowid, changes };
}

export function seedIfEmpty(database: any) {
  const userCountRes = database.exec('SELECT COUNT(*) as c FROM users;');
  const userCount = userCountRes[0]?.values[0][0] || 0;
  if (userCount === 0) {
    seedDatabase(database);
  }
}

export function seedDatabase(database = db) {
  if (!database) return;
  database.run('PRAGMA foreign_keys = OFF;');
  database.run('DELETE FROM inventory_transactions;');
  database.run('DELETE FROM products;');
  database.run('DELETE FROM categories;');
  database.run('DELETE FROM suppliers;');
  database.run('DELETE FROM users;');
  database.run('PRAGMA foreign_keys = ON;');

  // 1. Users
  database.run(`
    INSERT INTO users (id, username, email, password, first_name, last_name, role, avatar) VALUES
    (1, 'admin', 'admin@inventory.com', 'admin123', 'Alex', 'Mercer', 'admin', 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80'),
    (2, 'staff', 'staff@inventory.com', 'staff123', 'Sarah', 'Jenkins', 'staff', 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80');
  `);

  // 2. Categories
  database.run(`
    INSERT INTO categories (id, name, description, status) VALUES
    (1, 'Electronics & Computers', 'Computing hardware, laptops, screens and desktop electronics', 'Active'),
    (2, 'Peripherals & Accessories', 'Keyboards, mice, webcams, audio cables and hubs', 'Active'),
    (3, 'Office Equipment & Furniture', 'Printers, shredders, ergonomic chairs and standing desks', 'Active'),
    (4, 'Storage & Components', 'NVMe SSDs, external hard drives, RAM and flash drives', 'Active'),
    (5, 'Networking & Telecom', 'Routers, switches, patch panels and ethernet equipment', 'Active');
  `);

  // 3. Suppliers
  database.run(`
    INSERT INTO suppliers (id, name, company_name, email, phone, address, city, state, country, tax_id, status) VALUES
    (1, 'Marcus Vance', 'Apex Electronics Inc', 'orders@apexelectronics.com', '+1 (415) 890-2341', '104 Market Street, Suite 400', 'San Francisco', 'CA', 'USA', 'TAX-US-982143', 'Active'),
    (2, 'Elena Rostova', 'Silicon Valley Components', 'sales@svcomponents.io', '+1 (408) 555-0199', '2240 Component Way', 'San Jose', 'CA', 'USA', 'TAX-US-554109', 'Active'),
    (3, 'David Chen', 'Pacific Hardware Supplies', 'distribution@pacifichw.com', '+1 (206) 777-3829', '88 Harbor Boulevard', 'Seattle', 'WA', 'USA', 'TAX-US-338901', 'Active'),
    (4, 'Rachel Green', 'ErgoOffice Solutions Ltd', 'contact@ergooffice.com', '+1 (312) 441-9988', '500 Michigan Ave', 'Chicago', 'IL', 'USA', 'TAX-US-882312', 'Active'),
    (5, 'Thomas Wright', 'TechDistro Global Logistics', 'support@techdistroglobal.com', '+1 (212) 998-4450', '350 5th Avenue', 'New York', 'NY', 'USA', 'TAX-US-771402', 'Active');
  `);

  // 4. Products (including normal, low stock, out of stock)
  database.run(`
    INSERT INTO products (id, name, sku, category_id, supplier_id, description, unit_price, cost_price, quantity, min_stock, max_stock, unit, status) VALUES
    (1, 'Dell XPS 15 High Performance Laptop', 'PRD-ELEC-001', 1, 1, '15.6 inch 4K OLED, Intel Core i9, 32GB RAM, 1TB SSD enterprise workstation', 1899.99, 1450.00, 24, 10, 100, 'pcs', 'Active'),
    (2, 'Logitech MX Master 3S Wireless Mouse', 'PRD-ACC-002', 2, 1, 'Quiet electromagnetic scroll wheel, 8000 DPI sensor, ergonomic hand contour', 99.99, 65.00, 42, 15, 200, 'pcs', 'Active'),
    (3, 'Keychron K2 Pro Mechanical Keyboard', 'PRD-ACC-003', 2, 2, 'Wireless Bluetooth/Wired mechanical keyboard with hot-swappable tactile switches', 119.00, 78.00, 18, 10, 150, 'pcs', 'Active'),
    (4, 'Dell UltraSharp 27" 4K UHD Monitor', 'PRD-ELEC-004', 1, 1, 'IPS panel with 99% sRGB color calibration and 90W USB-C power delivery', 549.99, 390.00, 7, 10, 80, 'pcs', 'Active'),
    (5, 'Anker USB-C Braided Heavy Duty Cable 6ft', 'PRD-ACC-005', 2, 3, '100W PD charging certified, double nylon braided reinforcement', 19.99, 8.50, 92, 25, 300, 'pcs', 'Active'),
    (6, 'HP LaserJet Pro MFP Wireless Printer', 'PRD-OFF-006', 3, 5, 'High-speed duplex monochrome laser printer with auto document feeder', 329.99, 230.00, 5, 8, 40, 'pcs', 'Active'),
    (7, 'Herman Miller Style Ergonomic Task Chair', 'PRD-FUR-007', 3, 4, 'Breathable mesh back with adjustable lumbar support and 3D armrests', 489.00, 310.00, 14, 5, 50, 'pcs', 'Active'),
    (8, 'Samsung T7 Shield 2TB Portable SSD', 'PRD-STO-008', 4, 2, 'Rugged IP65 water/dust resistant USB 3.2 Gen 2 up to 1050MB/s', 199.99, 135.00, 36, 12, 150, 'pcs', 'Active'),
    (9, 'Cisco Business 24-Port Gigabit Managed Switch', 'PRD-NET-009', 5, 3, '24x GbE ports + 4x 10G SFP+ uplink ports with VLAN QoS management', 389.00, 260.00, 0, 6, 30, 'pcs', 'Active'),
    (10, 'Seagate IronWolf 8TB NAS Internal HDD', 'PRD-STO-010', 4, 2, '7200 RPM 256MB Cache SATA 6Gb/s CMR for multi-bay storage environments', 189.50, 130.00, 12, 8, 60, 'pcs', 'Active'),
    (11, 'Dual-Motor Electric Standing Desk Frame', 'PRD-FUR-011', 3, 4, 'Heavy duty steel frame with 4 programmable memory height presets', 349.00, 220.00, 8, 4, 30, 'pcs', 'Active'),
    (12, 'Apple iPad Air 11" M2 Wi-Fi 128GB', 'PRD-ELEC-012', 1, 5, 'Liquid Retina display with True Tone, M2 chip, Landscape stereo speakers', 599.00, 470.00, 19, 8, 80, 'pcs', 'Active'),
    (13, 'Sony WH-1000XM5 Noise Canceling Headphones', 'PRD-ACC-013', 2, 1, 'Industry-leading noise cancellation with two processors and 8 microphones', 399.99, 275.00, 22, 10, 75, 'pcs', 'Active'),
    (14, 'Cat6 Snagless Ethernet Patch Cable 50ft', 'PRD-NET-014', 5, 3, '550MHz UTP stranded copper cable with RJ45 gold-plated connectors', 14.99, 5.00, 110, 30, 250, 'pcs', 'Active'),
    (15, 'Crucial Pro 64GB (2x32GB) DDR5 5600MHz RAM', 'PRD-STO-015', 4, 2, 'Dual channel desktop memory with Intel XMP 3.0 and AMD EXPO support', 174.99, 115.00, 3, 10, 60, 'pcs', 'Active');
  `);

  // 5. Recent Inventory Transactions
  database.run(`
    INSERT INTO inventory_transactions (id, product_id, transaction_type, quantity, previous_stock, updated_stock, unit_cost, total_cost, reason, reference_no, notes, supplier_id, user_id, created_by, created_at) VALUES
    (1, 1, 'STOCK_IN', 30, 0, 30, 1450.00, 43500.00, 'Initial bulk procurement', 'PO-2026-001', 'Direct delivery from Apex warehouse', 1, 1, 'Alex Mercer (Admin)', datetime('now', '-25 days')),
    (2, 1, 'STOCK_OUT', 6, 30, 24, 0.0, 0.0, 'Corporate client workstation rollout', 'SO-2026-104', 'Shipped to Engineering division', NULL, 1, 'Alex Mercer (Admin)', datetime('now', '-22 days')),
    (3, 2, 'STOCK_IN', 50, 0, 50, 65.00, 3250.00, 'Supplier stock delivery', 'PO-2026-003', 'Verified intact packaging', 1, 2, 'Sarah Jenkins (Staff)', datetime('now', '-20 days')),
    (4, 2, 'STOCK_OUT', 8, 50, 42, 0.0, 0.0, 'Sales Order fulfillment', 'SO-2026-118', 'Fulfilled online retail order', NULL, 2, 'Sarah Jenkins (Staff)', datetime('now', '-18 days')),
    (5, 4, 'STOCK_IN', 15, 0, 15, 390.00, 5850.00, 'Restock shipment', 'PO-2026-008', 'Dock receipt #8911', 1, 1, 'Alex Mercer (Admin)', datetime('now', '-15 days')),
    (6, 4, 'STOCK_OUT', 8, 15, 7, 0.0, 0.0, 'Office setup expansion', 'SO-2026-142', 'Deployed to design floor - stock dropped below minimum threshold', NULL, 2, 'Sarah Jenkins (Staff)', datetime('now', '-12 days')),
    (7, 6, 'STOCK_IN', 10, 0, 10, 230.00, 2300.00, 'Quarterly inventory batch', 'PO-2026-012', 'Warehouse shelf Bay B-4', 5, 1, 'Alex Mercer (Admin)', datetime('now', '-10 days')),
    (8, 6, 'STOCK_OUT', 5, 10, 5, 0.0, 0.0, 'Branch office dispatch', 'SO-2026-189', 'Transferred to West Coast hub', NULL, 2, 'Sarah Jenkins (Staff)', datetime('now', '-8 days')),
    (9, 9, 'STOCK_IN', 10, 0, 10, 260.00, 2600.00, 'Procurement order', 'PO-2026-020', 'Network upgrade inventory', 3, 1, 'Alex Mercer (Admin)', datetime('now', '-6 days')),
    (10, 9, 'STOCK_OUT', 10, 10, 0, 0.0, 0.0, 'Datacenter migration deployment', 'SO-2026-210', 'All units allocated to core server racks - product currently out of stock', NULL, 1, 'Alex Mercer (Admin)', datetime('now', '-4 days')),
    (11, 8, 'STOCK_IN', 40, 0, 40, 135.00, 5400.00, 'New model stock arrival', 'PO-2026-025', 'Storage catalog update', 2, 2, 'Sarah Jenkins (Staff)', datetime('now', '-3 days')),
    (12, 8, 'STOCK_OUT', 4, 40, 36, 0.0, 0.0, 'Video production team supply', 'SO-2026-244', 'Internal equipment issue', NULL, 2, 'Sarah Jenkins (Staff)', datetime('now', '-2 days')),
    (13, 15, 'STOCK_IN', 15, 0, 15, 115.00, 1725.00, 'Memory upgrade shipment', 'PO-2026-030', 'Received from Silicon Valley Components', 2, 1, 'Alex Mercer (Admin)', datetime('now', '-1 days')),
    (14, 15, 'STOCK_OUT', 12, 15, 3, 0.0, 0.0, 'Server upgrade rollout', 'SO-2026-260', 'Urgent low stock alert triggered', NULL, 1, 'Alex Mercer (Admin)', datetime('now', '-12 hours')),
    (15, 5, 'STOCK_IN', 100, 0, 100, 8.50, 850.00, 'Bulk accessory restock', 'PO-2026-035', 'Stocked in Accessories bin A-12', 3, 2, 'Sarah Jenkins (Staff)', datetime('now', '-4 hours')),
    (16, 5, 'STOCK_OUT', 8, 100, 92, 0.0, 0.0, 'Customer sales batch', 'SO-2026-285', 'Packed for delivery', NULL, 2, 'Sarah Jenkins (Staff)', datetime('now', '-1 hour'));
  `);

  persistDb();
}
