import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { UserProfile, Product, Order, Review } from './types';

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

// Database paths setup
const DATA_DIR = path.join(process.cwd(), 'data');
const USERS_FILE = path.join(DATA_DIR, 'users.json');
const PRODUCTS_FILE = path.join(DATA_DIR, 'products.json');
const ORDERS_FILE = path.join(DATA_DIR, 'orders.json');
const REVIEWS_FILE = path.join(DATA_DIR, 'reviews.json');

// Interface for Users in backend database (UserProfile + password hash)
export interface DBUser extends UserProfile {
  passwordHash: string;
}

// Ensure database files exist
export function initDB() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  
  if (!fs.existsSync(USERS_FILE)) {
    fs.writeFileSync(USERS_FILE, JSON.stringify([], null, 2));
  }
  
  if (!fs.existsSync(PRODUCTS_FILE)) {
    fs.writeFileSync(PRODUCTS_FILE, JSON.stringify([], null, 2));
  }
  
  if (!fs.existsSync(ORDERS_FILE)) {
    fs.writeFileSync(ORDERS_FILE, JSON.stringify([], null, 2));
  }
  
  if (!fs.existsSync(REVIEWS_FILE)) {
    fs.writeFileSync(REVIEWS_FILE, JSON.stringify([], null, 2));
  }
  
  // Seed demo data if necessary
  seedDefaultData();
}

function readJSON<T>(filePath: string): T {
  try {
    const content = fs.readFileSync(filePath, 'utf-8');
    return JSON.parse(content) as T;
  } catch (e) {
    return [] as unknown as T;
  }
}

function writeJSON<T>(filePath: string, data: T): void {
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf-8');
}

// User CRUD operations
export const dbUsers = {
  getAll: () => readJSON<DBUser[]>(USERS_FILE),
  getByEmail: (email: string) => readJSON<DBUser[]>(USERS_FILE).find(u => u.email.toLowerCase() === email.toLowerCase()),
  getById: (id: string) => readJSON<DBUser[]>(USERS_FILE).find(u => u.id === id),
  create: (user: DBUser) => {
    const users = readJSON<DBUser[]>(USERS_FILE);
    users.push(user);
    writeJSON(USERS_FILE, users);
    return user;
  },
  update: (id: string, updates: Partial<DBUser>) => {
    const users = readJSON<DBUser[]>(USERS_FILE);
    const index = users.findIndex(u => u.id === id);
    if (index !== -1) {
      users[index] = { ...users[index], ...updates };
      writeJSON(USERS_FILE, users);
      return users[index];
    }
    return null;
  }
};

// Product CRUD operations
export const dbProducts = {
  getAll: () => readJSON<Product[]>(PRODUCTS_FILE),
  getById: (id: string) => readJSON<Product[]>(PRODUCTS_FILE).find(p => p.id === id),
  create: (product: Product) => {
    const products = readJSON<Product[]>(PRODUCTS_FILE);
    products.push(product);
    writeJSON(PRODUCTS_FILE, products);
    return product;
  },
  update: (id: string, updates: Partial<Product>) => {
    const products = readJSON<Product[]>(PRODUCTS_FILE);
    const index = products.findIndex(p => p.id === id);
    if (index !== -1) {
      products[index] = { ...products[index], ...updates, updatedAt: Date.now() };
      writeJSON(PRODUCTS_FILE, products);
      return products[index];
    }
    return null;
  },
  delete: (id: string) => {
    const products = readJSON<Product[]>(PRODUCTS_FILE);
    const filtered = products.filter(p => p.id !== id);
    writeJSON(PRODUCTS_FILE, filtered);
    return true;
  }
};

// Order CRUD operations
export const dbOrders = {
  getAll: () => readJSON<Order[]>(ORDERS_FILE),
  getByUserId: (userId: string) => readJSON<Order[]>(ORDERS_FILE).filter(o => o.userId === userId),
  getById: (id: string) => readJSON<Order[]>(ORDERS_FILE).find(o => o.id === id),
  create: (order: Order) => {
    const orders = readJSON<Order[]>(ORDERS_FILE);
    orders.push(order);
    writeJSON(ORDERS_FILE, orders);
    return order;
  },
  update: (id: string, updates: Partial<Order>) => {
    const orders = readJSON<Order[]>(ORDERS_FILE);
    const index = orders.findIndex(o => o.id === id);
    if (index !== -1) {
      orders[index] = { ...orders[index], ...updates };
      writeJSON(ORDERS_FILE, orders);
      return orders[index];
    }
    return null;
  }
};

// Review CRUD operations
export const dbReviews = {
  getByProductId: (productId: string) => readJSON<Review[]>(REVIEWS_FILE).filter(r => r.productId === productId),
  create: (review: Review) => {
    const reviews = readJSON<Review[]>(REVIEWS_FILE);
    reviews.push(review);
    writeJSON(REVIEWS_FILE, reviews);
    return review;
  },
  delete: (id: string) => {
    const reviews = readJSON<Review[]>(REVIEWS_FILE);
    const filtered = reviews.filter(r => r.id !== id);
    writeJSON(REVIEWS_FILE, filtered);
    return true;
  },
  getById: (id: string) => readJSON<Review[]>(REVIEWS_FILE).find(r => r.id === id)
};

// Default seeding function
export function seedDefaultData() {
  // Check if users empty, seed admin and customer
  const users = dbUsers.getAll();
  if (users.length === 0) {
    // Admin
    dbUsers.create({
      id: 'admin-id-default',
      name: 'Admin User',
      email: 'admin@aura.demo',
      role: 'admin',
      wishlist: [],
      createdAt: Date.now(),
      passwordHash: hashPassword('admin123')
    });
    // Customer
    dbUsers.create({
      id: 'customer-id-default',
      name: 'Customer User',
      email: 'customer@aura.demo',
      role: 'customer',
      wishlist: [],
      createdAt: Date.now(),
      passwordHash: hashPassword('customer123')
    });
  }

  // Seed products
  const products = dbProducts.getAll();
  if (products.length === 0) {
    seedDemoProducts();
  }
}

export function seedDemoProducts() {
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

  // Clear products list
  writeJSON(PRODUCTS_FILE, []);

  // Generate 36 products by cloning the templates and slightly varying them
  for (let i = 0; i < 36; i++) {
    const template = demoTemplates[i % demoTemplates.length];
    const isDuplicate = i >= demoTemplates.length;
    const variantSuffix = isDuplicate ? ` (Variant ${Math.floor(i / demoTemplates.length) + 1})` : '';
    
    dbProducts.create({
      id: `prod_${i + 1}`,
      name: `${template.name}${variantSuffix}`,
      description: `A quality ${template.item.toLowerCase()} perfect for any occasion. Designed with comfort in mind.`,
      price: template.price,
      currency: 'INR',
      category: template.category,
      imageUrl: template.image,
      stock: Math.floor(Math.random() * 100) + 10,
      createdAt: Date.now() - (36 - i) * 60 * 60 * 1000, // staggered times
      updatedAt: Date.now()
    });
  }
}
