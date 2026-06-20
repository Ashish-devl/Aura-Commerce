import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';

async function startServer() {
  const app = express();
  const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

  app.use(express.json());

  // MOCK Stripe Checkout Session
  app.post('/api/create-checkout-session', (req, res) => {
    const { items, currency = 'inr' } = req.body;
    
    // Calculate total
    const totalAmount = items.reduce((sum: number, item: any) => sum + (item.price * item.quantity), 0);

    // In a real app, you would use stripe.checkout.sessions.create(...)
    // Returning a mock URL that we'll handle in our app
    // e.g. /checkout/success
    
    // Generate a mock order ID
    const mockOrderId = "order_" + Math.random().toString(36).substring(2, 9);
    
    res.json({
      id: "cs_test_" + Math.random().toString(36).substring(2, 9),
      url: `/checkout/processing?orderId=${mockOrderId}&amount=${totalAmount}&currency=${currency}`
    });
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
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
