import express from 'express';
import path from 'path';
import { 
  initDB, 
  verifyToken, 
  dbUsers, 
  dbProducts, 
  dbOrders, 
  dbReviews, 
  seedDemoProducts, 
  generateToken, 
  verifyPassword, 
  hashPassword 
} from './db';

declare global {
  namespace Express {
    interface Request {
      user?: any;
    }
  }
}

async function startServer() {
  // Initialize file-based local database
  initDB();

  const app = express();
  const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

  app.use(express.json());

  // JWT Auth Middleware
  function authenticateToken(req: any, res: any, next: any) {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    if (!token) return res.status(401).json({ error: 'Access token required' });
    
    const decoded = verifyToken(token);
    if (!decoded) return res.status(403).json({ error: 'Invalid or expired token' });
    
    req.user = decoded;
    next();
  }

  // Admin Verification Middleware
  function requireAdmin(req: any, res: any, next: any) {
    if (req.user?.role !== 'admin') {
      return res.status(403).json({ error: 'Access Denied: Admins only.' });
    }
    next();
  }

  // ==========================================
  // AUTHENTICATION ENDPOINTS
  // ==========================================

  app.post('/api/auth/signup', (req, res) => {
    const { name, email, password, role } = req.body;
    if (!name || !email || !password || !role) {
      return res.status(400).json({ error: 'Name, email, password, and role are required' });
    }
    
    const existing = dbUsers.getByEmail(email);
    if (existing) {
      return res.status(400).json({ error: 'This email is already registered.' });
    }
    
    // Auto upgrade to admin if Ashish
    const isAdmin = email.toLowerCase() === 'ashishgupta75080@gmail.com';
    const finalRole = isAdmin ? 'admin' : role;
    
    const uid = 'user_' + Math.random().toString(36).substring(2, 9);
    const newUser = {
      id: uid,
      name,
      email,
      role: finalRole,
      wishlist: [],
      createdAt: Date.now(),
      passwordHash: hashPassword(password)
    };
    
    dbUsers.create(newUser);
    
    const token = generateToken({ id: uid, email, role: finalRole });
    res.json({
      token,
      user: {
        id: uid,
        name,
        email,
        role: finalRole,
        wishlist: [],
        createdAt: newUser.createdAt
      }
    });
  });

  app.post('/api/auth/login', (req, res) => {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }
    
    const user = dbUsers.getByEmail(email);
    if (!user || !verifyPassword(password, user.passwordHash)) {
      return res.status(400).json({ error: 'Invalid email or password.' });
    }
    
    // Auto upgrade to admin if Ashish
    if (email.toLowerCase() === 'ashishgupta75080@gmail.com' && user.role !== 'admin') {
      dbUsers.update(user.id, { role: 'admin' });
      user.role = 'admin';
    }
    
    const token = generateToken({ id: user.id, email: user.email, role: user.role });
    res.json({
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        address: user.address || '',
        wishlist: user.wishlist || [],
        createdAt: user.createdAt
      }
    });
  });

  app.get('/api/auth/profile', authenticateToken, (req, res) => {
    const user = dbUsers.getById(req.user.id);
    if (!user) return res.status(404).json({ error: 'User profile not found.' });
    
    res.json({
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      address: user.address || '',
      wishlist: user.wishlist || [],
      createdAt: user.createdAt
    });
  });

  app.post('/api/auth/profile/update', authenticateToken, (req, res) => {
    const { name, address } = req.body;
    const updateData: any = {};
    if (name !== undefined) updateData.name = name;
    if (address !== undefined) updateData.address = address;

    const updated = dbUsers.update(req.user.id, updateData);
    if (!updated) return res.status(404).json({ error: 'User profile not found.' });

    res.json({
      id: updated.id,
      name: updated.name,
      email: updated.email,
      role: updated.role,
      address: updated.address || '',
      wishlist: updated.wishlist || [],
      createdAt: updated.createdAt
    });
  });

  app.post('/api/auth/wishlist', authenticateToken, (req, res) => {
    const { wishlist } = req.body;
    if (!Array.isArray(wishlist)) {
      return res.status(400).json({ error: 'Wishlist must be an array of product IDs' });
    }
    
    const updated = dbUsers.update(req.user.id, { wishlist });
    if (!updated) return res.status(404).json({ error: 'User profile not found.' });
    
    res.json({
      id: updated.id,
      name: updated.name,
      email: updated.email,
      role: updated.role,
      wishlist: updated.wishlist || [],
      createdAt: updated.createdAt
    });
  });

  app.get('/api/wishlist', authenticateToken, (req, res) => {
    const user = dbUsers.getById(req.user.id);
    if (!user) return res.status(404).json({ error: 'User profile not found.' });
    
    const wishlistIds = user.wishlist || [];
    const products = wishlistIds.map(id => dbProducts.getById(id)).filter(Boolean);
    res.json(products);
  });

  // ==========================================
  // PRODUCTS ENDPOINTS
  // ==========================================

  app.get('/api/products', (req, res) => {
    const products = dbProducts.getAll();
    res.json(products);
  });

  app.get('/api/products/:id', (req, res) => {
    const product = dbProducts.getById(req.params.id);
    if (!product) return res.status(404).json({ error: 'Product not found.' });
    res.json(product);
  });

  app.post('/api/products', authenticateToken, requireAdmin, (req, res) => {
    const { name, description, price, category, imageUrl, stock } = req.body;
    const newProduct = {
      id: 'prod_' + Math.random().toString(36).substring(2, 9),
      name,
      description,
      price: Number(price),
      currency: 'INR',
      category,
      imageUrl,
      stock: Number(stock),
      createdAt: Date.now(),
      updatedAt: Date.now()
    };
    dbProducts.create(newProduct);
    res.json(newProduct);
  });

  app.put('/api/products/:id', authenticateToken, requireAdmin, (req, res) => {
    const updated = dbProducts.update(req.params.id, req.body);
    if (!updated) return res.status(404).json({ error: 'Product not found.' });
    res.json(updated);
  });

  app.delete('/api/products/:id', authenticateToken, requireAdmin, (req, res) => {
    const deleted = dbProducts.delete(req.params.id);
    if (!deleted) return res.status(404).json({ error: 'Product not found.' });
    res.json({ success: true });
  });

  app.post('/api/products/seed', authenticateToken, requireAdmin, (req, res) => {
    seedDemoProducts();
    res.json({ success: true, products: dbProducts.getAll() });
  });

  // ==========================================
  // ORDERS ENDPOINTS
  // ==========================================

  app.get('/api/orders', authenticateToken, (req, res) => {
    if (req.user.role === 'admin') {
      const orders = dbOrders.getAll().sort((a, b) => b.createdAt - a.createdAt);
      res.json(orders);
    } else {
      const orders = dbOrders.getByUserId(req.user.id).sort((a, b) => b.createdAt - a.createdAt);
      res.json(orders);
    }
  });

  app.post('/api/orders', authenticateToken, (req, res) => {
    const orderData = req.body;
    
    // Decrement stock for purchased items
    for (const item of orderData.items) {
      const prod = dbProducts.getById(item.productId);
      if (prod) {
        const newStock = Math.max(0, prod.stock - item.quantity);
        dbProducts.update(item.productId, { stock: newStock });
      }
    }
    
    const userProfile = dbUsers.getById(req.user.id);
    const userName = userProfile?.name || orderData.userName || req.user.email?.split('@')[0] || 'User';
    
    const newOrder = {
      ...orderData,
      userId: req.user.id,
      userEmail: req.user.email,
      userName,
      createdAt: Date.now()
    };
    
    dbOrders.create(newOrder);
    res.json(newOrder);
  });

  app.put('/api/orders/:id', authenticateToken, requireAdmin, (req, res) => {
    const { status } = req.body;
    const updated = dbOrders.update(req.params.id, { status });
    if (!updated) return res.status(404).json({ error: 'Order not found.' });
    res.json(updated);
  });

  // ==========================================
  // REVIEWS ENDPOINTS
  // ==========================================

  app.get('/api/reviews/:productId', (req, res) => {
    const reviews = dbReviews.getByProductId(req.params.productId);
    res.json(reviews.sort((a, b) => b.createdAt - a.createdAt));
  });

  app.post('/api/reviews', authenticateToken, (req, res) => {
    const { productId, rating, comment } = req.body;
    if (!productId || rating === undefined || !comment) {
      return res.status(400).json({ error: 'productId, rating, and comment are required.' });
    }
    
    const userProfile = dbUsers.getById(req.user.id);
    const userName = userProfile?.name || req.user.email?.split('@')[0] || 'User';
    
    const newReview = {
      id: 'rev_' + Math.random().toString(36).substring(2, 9),
      productId,
      userId: req.user.id,
      userName,
      rating: Number(rating),
      comment,
      createdAt: Date.now()
    };
    
    dbReviews.create(newReview);
    res.json(newReview);
  });

  app.delete('/api/reviews/:id', authenticateToken, (req, res) => {
    const review = dbReviews.getById(req.params.id);
    if (!review) return res.status(404).json({ error: 'Review not found.' });
    
    if (review.userId !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Access Denied: Unauthorized to delete this review.' });
    }
    
    dbReviews.delete(req.params.id);
    res.json({ success: true });
  });

  // ==========================================
  // ORIGINAL MOCKS & VITE
  // ==========================================

  // MOCK Stripe Checkout Session
  app.post('/api/create-checkout-session', (req, res) => {
    const { items, currency = 'inr' } = req.body;
    const totalAmount = items.reduce((sum: number, item: any) => sum + (item.price * item.quantity), 0);
    const mockOrderId = "order_" + Math.random().toString(36).substring(2, 9);
    
    res.json({
      id: "cs_test_" + Math.random().toString(36).substring(2, 9),
      url: `/checkout/processing?orderId=${mockOrderId}&amount=${totalAmount}&currency=${currency}`
    });
  });

  // Example Email Confirmation Endpoint
  app.post('/api/send-email', async (req, res) => {
    const { email, orderId, totalAmount } = req.body;
    try {
      if (process.env.RESEND_API_KEY) {
        await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${process.env.RESEND_API_KEY}`
          },
          body: JSON.stringify({
            from: 'Acme Store <onboarding@resend.dev>',
            to: email,
            subject: `Order Confirmation - ${orderId}`,
            html: `<h1>Thank you for your order!</h1>
                   <p>Your order <strong>${orderId}</strong> has been successfully placed.</p>
                   <p>Total amount: INR ${totalAmount.toFixed(2)}</p>
                   <p>We will notify you when it ships.</p>`
          })
        });
        console.log(`[Email] Sent real confirmation email to ${email}`);
      } else {
        console.log(`[Email] Mock email sent to ${email} for order ${orderId} (total: INR ${totalAmount})`);
      }
      res.json({ success: true });
    } catch (err) {
      console.error('Failed to send email:', err);
      res.status(500).json({ error: 'Failed to send email' });
    }
  });

  // In production, serve the frontend static files
  if (process.env.NODE_ENV === 'production') {
    const distPath = path.join(process.cwd(), '../frontend/dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on port ${PORT}`);
  });
}

startServer();

