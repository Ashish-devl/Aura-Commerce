import 'dotenv/config';
import crypto from 'crypto';
import pg from 'pg';
import { UserProfile, Product, Order, Review } from './types';

const { Pool } = pg;

// Native Password Hashing Helpers using Node.js crypto
export function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.pbkdf2Sync(password, salt, 1000, 64, 'sha512').toString('hex');
  return `${salt}:${hash}`;
}

export function verifyPassword(password: string, storedHash: string): boolean {
  const [salt, hash] = storedHash.split(':');
  if (!salt || !hash) return false;
  const verifyHash = crypto.pbkdf2Sync(password, salt, 1000, 64, 'sha512').toString('hex');
  return hash === verifyHash;
}

// Native JWT token generator/verifier
const JWT_SECRET = process.env.JWT_SECRET || 'aura-commerce-secret-key-12345';

export function generateToken(payload: object): string {
  const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url');
  // Expire in 30 days
  const exp = Math.floor(Date.now() / 1000) + (30 * 24 * 60 * 60);
  const body = Buffer.from(JSON.stringify({ ...payload, exp })).toString('base64url');
  
  const signatureInput = `${header}.${body}`;
  const signature = crypto.createHmac('sha256', JWT_SECRET).update(signatureInput).digest('base64url');
  
  return `${signatureInput}.${signature}`;
}

export function verifyToken(token: string): any {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    
    const [header, body, signature] = parts;
    const signatureInput = `${header}.${body}`;
    const expectedSignature = crypto.createHmac('sha256', JWT_SECRET).update(signatureInput).digest('base64url');
    
    if (signature !== expectedSignature) return null;
    
    const payload = JSON.parse(Buffer.from(body, 'base64url').toString('utf8'));
    if (payload.exp && Date.now() / 1000 > payload.exp) {
      return null; // Expired
    }
    
    return payload;
  } catch (e) {
    return null;
  }
}

// Initialize PostgreSQL Connection Pool
const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  console.warn("WARNING: DATABASE_URL environment variable is not defined! Please configure it in a .env file or environment.");
}

export const pool = new Pool({
  connectionString,
  ssl: connectionString ? { rejectUnauthorized: false } : false
});

// Interface for Users in backend database (UserProfile + password hash)
export interface DBUser extends UserProfile {
  passwordHash: string;
}

// DB Row Mapping Helpers
function mapUserFromDB(row: any): DBUser {
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    role: row.role as 'admin' | 'customer',
    wishlist: row.wishlist || [],
    createdAt: Number(row.created_at),
    address: row.address || '',
    passwordHash: row.password_hash
  };
}

function mapProductFromDB(row: any): Product {
  return {
    id: row.id,
    name: row.name,
    description: row.description,
    price: Number(row.price),
    currency: row.currency,
    category: row.category,
    imageUrl: row.image_url,
    stock: Number(row.stock),
    createdAt: Number(row.created_at),
    updatedAt: Number(row.updated_at)
  };
}

function mapOrderFromDB(row: any): Order {
  return {
    id: row.id,
    userId: row.user_id,
    userEmail: row.user_email || undefined,
    userName: row.user_name || undefined,
    items: typeof row.items === 'string' ? JSON.parse(row.items) : row.items,
    totalAmount: Number(row.total_amount),
    status: row.status as 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled',
    shippingAddress: row.shipping_address,
    paymentStatus: row.payment_status as 'pending' | 'completed' | 'failed',
    createdAt: Number(row.created_at)
  };
}

function mapReviewFromDB(row: any): Review {
  return {
    id: row.id,
    productId: row.product_id,
    userId: row.user_id,
    userName: row.user_name,
    rating: Number(row.rating),
    comment: row.comment,
    createdAt: Number(row.created_at)
  };
}

// Ensure database tables exist and seed default data
export async function initDB() {
  if (!connectionString) {
    return;
  }

  // Create Users table
  await pool.query(`
    CREATE TABLE IF NOT EXISTS users (
      id VARCHAR(50) PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      email VARCHAR(255) UNIQUE NOT NULL,
      role VARCHAR(20) NOT NULL,
      wishlist TEXT[] DEFAULT '{}',
      created_at BIGINT NOT NULL,
      address TEXT,
      password_hash VARCHAR(255) NOT NULL
    );
  `);

  // Create Products table
  await pool.query(`
    CREATE TABLE IF NOT EXISTS products (
      id VARCHAR(50) PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      description TEXT NOT NULL,
      price INT NOT NULL,
      currency VARCHAR(10) NOT NULL,
      category VARCHAR(100) NOT NULL,
      image_url TEXT NOT NULL,
      stock INT NOT NULL,
      created_at BIGINT NOT NULL,
      updated_at BIGINT NOT NULL
    );
  `);

  // Create Orders table
  await pool.query(`
    CREATE TABLE IF NOT EXISTS orders (
      id VARCHAR(50) PRIMARY KEY,
      user_id VARCHAR(50) NOT NULL REFERENCES users(id),
      user_email VARCHAR(255),
      user_name VARCHAR(255),
      items JSONB NOT NULL,
      total_amount INT NOT NULL,
      status VARCHAR(50) NOT NULL,
      shipping_address TEXT NOT NULL,
      payment_status VARCHAR(50) NOT NULL,
      created_at BIGINT NOT NULL
    );
  `);

  // Create Reviews table
  await pool.query(`
    CREATE TABLE IF NOT EXISTS reviews (
      id VARCHAR(50) PRIMARY KEY,
      product_id VARCHAR(50) NOT NULL REFERENCES products(id) ON DELETE CASCADE,
      user_id VARCHAR(50) NOT NULL REFERENCES users(id),
      user_name VARCHAR(255) NOT NULL,
      rating INT NOT NULL,
      comment TEXT NOT NULL,
      created_at BIGINT NOT NULL
    );
  `);

  // Seed demo data if necessary
  await seedDefaultData();
}

// User CRUD operations
export const dbUsers = {
  getAll: async (): Promise<DBUser[]> => {
    const res = await pool.query('SELECT * FROM users');
    return res.rows.map(mapUserFromDB);
  },
  getByEmail: async (email: string): Promise<DBUser | undefined> => {
    const res = await pool.query('SELECT * FROM users WHERE LOWER(email) = LOWER($1)', [email]);
    return res.rows[0] ? mapUserFromDB(res.rows[0]) : undefined;
  },
  getById: async (id: string): Promise<DBUser | undefined> => {
    const res = await pool.query('SELECT * FROM users WHERE id = $1', [id]);
    return res.rows[0] ? mapUserFromDB(res.rows[0]) : undefined;
  },
  create: async (user: DBUser): Promise<DBUser> => {
    const res = await pool.query(
      `INSERT INTO users (id, name, email, role, wishlist, created_at, address, password_hash)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING *`,
      [user.id, user.name, user.email, user.role, user.wishlist, user.createdAt, user.address || '', user.passwordHash]
    );
    return mapUserFromDB(res.rows[0]);
  },
  update: async (id: string, updates: Partial<DBUser>): Promise<DBUser | null> => {
    const fields: string[] = [];
    const values: any[] = [];
    let index = 1;
    if (updates.name !== undefined) {
      fields.push(`name = $${index++}`);
      values.push(updates.name);
    }
    if (updates.address !== undefined) {
      fields.push(`address = $${index++}`);
      values.push(updates.address);
    }
    if (updates.wishlist !== undefined) {
      fields.push(`wishlist = $${index++}`);
      values.push(updates.wishlist);
    }
    if (updates.role !== undefined) {
      fields.push(`role = $${index++}`);
      values.push(updates.role);
    }
    if (fields.length === 0) return (await dbUsers.getById(id)) || null;
    
    values.push(id);
    const res = await pool.query(
      `UPDATE users SET ${fields.join(', ')} WHERE id = $${index} RETURNING *`,
      values
    );
    return res.rows[0] ? mapUserFromDB(res.rows[0]) : null;
  }
};

// Product CRUD operations
export const dbProducts = {
  getAll: async (): Promise<Product[]> => {
    const res = await pool.query('SELECT * FROM products');
    return res.rows.map(mapProductFromDB);
  },
  getById: async (id: string): Promise<Product | undefined> => {
    const res = await pool.query('SELECT * FROM products WHERE id = $1', [id]);
    return res.rows[0] ? mapProductFromDB(res.rows[0]) : undefined;
  },
  create: async (product: Product): Promise<Product> => {
    const res = await pool.query(
      `INSERT INTO products (id, name, description, price, currency, category, image_url, stock, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
       RETURNING *`,
      [product.id, product.name, product.description, product.price, product.currency, product.category, product.imageUrl, product.stock, product.createdAt, product.updatedAt]
    );
    return mapProductFromDB(res.rows[0]);
  },
  update: async (id: string, updates: Partial<Product>): Promise<Product | null> => {
    const fields: string[] = [];
    const values: any[] = [];
    let index = 1;
    if (updates.name !== undefined) {
      fields.push(`name = $${index++}`);
      values.push(updates.name);
    }
    if (updates.description !== undefined) {
      fields.push(`description = $${index++}`);
      values.push(updates.description);
    }
    if (updates.price !== undefined) {
      fields.push(`price = $${index++}`);
      values.push(updates.price);
    }
    if (updates.category !== undefined) {
      fields.push(`category = $${index++}`);
      values.push(updates.category);
    }
    if (updates.imageUrl !== undefined) {
      fields.push(`image_url = $${index++}`);
      values.push(updates.imageUrl);
    }
    if (updates.stock !== undefined) {
      fields.push(`stock = $${index++}`);
      values.push(updates.stock);
    }
    
    fields.push(`updated_at = $${index++}`);
    values.push(Date.now());
    
    values.push(id);
    const res = await pool.query(
      `UPDATE products SET ${fields.join(', ')} WHERE id = $${index} RETURNING *`,
      values
    );
    return res.rows[0] ? mapProductFromDB(res.rows[0]) : null;
  },
  delete: async (id: string): Promise<boolean> => {
    await pool.query('DELETE FROM products WHERE id = $1', [id]);
    return true;
  }
};

// Order CRUD operations
export const dbOrders = {
  getAll: async (): Promise<Order[]> => {
    const res = await pool.query('SELECT * FROM orders');
    return res.rows.map(mapOrderFromDB);
  },
  getByUserId: async (userId: string): Promise<Order[]> => {
    const res = await pool.query('SELECT * FROM orders WHERE user_id = $1', [userId]);
    return res.rows.map(mapOrderFromDB);
  },
  getById: async (id: string): Promise<Order | undefined> => {
    const res = await pool.query('SELECT * FROM orders WHERE id = $1', [id]);
    return res.rows[0] ? mapOrderFromDB(res.rows[0]) : undefined;
  },
  create: async (order: Order): Promise<Order> => {
    const res = await pool.query(
      `INSERT INTO orders (id, user_id, user_email, user_name, items, total_amount, status, shipping_address, payment_status, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
       RETURNING *`,
      [order.id, order.userId, order.userEmail || null, order.userName || null, JSON.stringify(order.items), order.totalAmount, order.status, order.shippingAddress, order.paymentStatus, order.createdAt]
    );
    return mapOrderFromDB(res.rows[0]);
  },
  update: async (id: string, updates: Partial<Order>): Promise<Order | null> => {
    const fields: string[] = [];
    const values: any[] = [];
    let index = 1;
    if (updates.status !== undefined) {
      fields.push(`status = $${index++}`);
      values.push(updates.status);
    }
    if (updates.paymentStatus !== undefined) {
      fields.push(`payment_status = $${index++}`);
      values.push(updates.paymentStatus);
    }
    if (fields.length === 0) return (await dbOrders.getById(id)) || null;
    
    values.push(id);
    const res = await pool.query(
      `UPDATE orders SET ${fields.join(', ')} WHERE id = $${index} RETURNING *`,
      values
    );
    return res.rows[0] ? mapOrderFromDB(res.rows[0]) : null;
  }
};

// Review CRUD operations
export const dbReviews = {
  getByProductId: async (productId: string): Promise<Review[]> => {
    const res = await pool.query('SELECT * FROM reviews WHERE product_id = $1', [productId]);
    return res.rows.map(mapReviewFromDB);
  },
  create: async (review: Review): Promise<Review> => {
    const res = await pool.query(
      `INSERT INTO reviews (id, product_id, user_id, user_name, rating, comment, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
      [review.id, review.productId, review.userId, review.userName, review.rating, review.comment, review.createdAt]
    );
    return mapReviewFromDB(res.rows[0]);
  },
  delete: async (id: string): Promise<boolean> => {
    await pool.query('DELETE FROM reviews WHERE id = $1', [id]);
    return true;
  },
  getById: async (id: string): Promise<Review | undefined> => {
    const res = await pool.query('SELECT * FROM reviews WHERE id = $1', [id]);
    return res.rows[0] ? mapReviewFromDB(res.rows[0]) : undefined;
  }
};

// Default seeding function
export async function seedDefaultData() {
  const usersRes = await pool.query('SELECT COUNT(*) FROM users');
  const userCount = parseInt(usersRes.rows[0].count, 10);
  
  if (userCount === 0) {
    // Admin
    await dbUsers.create({
      id: 'admin-id-default',
      name: 'Admin User',
      email: 'admin@aura.demo',
      role: 'admin',
      wishlist: [],
      createdAt: Date.now(),
      passwordHash: hashPassword('admin123')
    });
    // Customer
    await dbUsers.create({
      id: 'customer-id-default',
      name: 'Customer User',
      email: 'customer@aura.demo',
      role: 'customer',
      wishlist: [],
      createdAt: Date.now(),
      passwordHash: hashPassword('customer123')
    });
  }

  const productsRes = await pool.query('SELECT COUNT(*) FROM products');
  const productCount = parseInt(productsRes.rows[0].count, 10);
  
  if (productCount === 0) {
    await seedDemoProducts();
  }
}

export async function seedDemoProducts() {
  const demoTemplates = [
    { name: "Classic White Tee", category: "T-Shirts", item: "T-Shirt", image: "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?auto=format&fit=crop&q=80&w=800", price: 1499 },
    { name: "Urban Winter Jacket", category: "Outerwear", item: "Jacket", image: "https://images.unsplash.com/photo-1576871337622-98d48d1cf531?auto=format&fit=crop&q=80&w=800", price: 4599 },
    { name: "Essential Grey Hoodie", category: "Sweatshirts", item: "Hoodie", image: "https://images.unsplash.com/photo-1556821840-3a63f95609a7?auto=format&fit=crop&q=80&w=800", price: 2999 },
    { name: "Premium Blue Denim", category: "Pants", item: "Jeans", image: "https://images.unsplash.com/photo-1542272604-787c3835535d?auto=format&fit=crop&q=80&w=800", price: 3499 },
    { name: "Vintage Leather Backpack", category: "Accessories", item: "Backpack", image: "https://images.unsplash.com/photo-1548036328-c9fa89d128fa?auto=format&fit=crop&q=80&w=800", price: 5999 },
    { name: "Activewear Running Shorts", category: "Activewear", item: "Shorts", image: "https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?auto=format&fit=crop&q=80&w=800", price: 1299 },
    { name: "Casual Striped Sweater", category: "Sweatshirts", item: "Sweater", image: "https://images.unsplash.com/photo-1434389651855-32eab9eeea86?auto=format&fit=crop&q=80&w=800", price: 2499 },
    { name: "Sleek Black Cap", category: "Accessories", item: "Cap", image: "https://images.unsplash.com/photo-1588850561407-ed78c282e89b?auto=format&fit=crop&q=80&w=800", price: 899 },
    { name: "Cozy Knit Socks", category: "Accessories", item: "Socks", image: "https://images.unsplash.com/photo-1582966772680-860e372bb558?auto=format&fit=crop&q=80&w=800", price: 499 },
    { name: "Modern Chino Pants", category: "Pants", item: "Chinos", image: "https://images.unsplash.com/photo-1624378439575-d8705ad7ae80?auto=format&fit=crop&q=80&w=800", price: 2799 },
    { name: "Graphic Print Tee", category: "T-Shirts", item: "T-Shirt", image: "https://images.unsplash.com/photo-1503342394128-c104d54dba01?auto=format&fit=crop&q=80&w=800", price: 1699 },
    { name: "Windbreaker Pullover", category: "Outerwear", item: "Windbreaker", image: "https://images.unsplash.com/photo-1605518216938-7c31b7b14ad0?auto=format&fit=crop&q=80&w=800", price: 3299 }
  ];

  // Clear products table
  await pool.query('TRUNCATE TABLE products CASCADE');

  // Generate 36 products by cloning the templates and slightly varying them
  for (let i = 0; i < 36; i++) {
    const template = demoTemplates[i % demoTemplates.length];
    const isDuplicate = i >= demoTemplates.length;
    const variantSuffix = isDuplicate ? ` (Variant ${Math.floor(i / demoTemplates.length) + 1})` : '';
    
    await dbProducts.create({
      id: `prod_${i + 1}`,
      name: `${template.name}${variantSuffix}`,
      description: `A quality ${template.item.toLowerCase()} perfect for any occasion. Designed with comfort in mind.`,
      price: template.price,
      currency: 'INR',
      category: template.category,
      imageUrl: template.image,
      stock: Math.floor(Math.random() * 100) + 10,
      createdAt: Date.now() - (36 - i) * 60 * 60 * 1000,
      updatedAt: Date.now()
    });
  }
}
