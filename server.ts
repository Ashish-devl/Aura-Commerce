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

    // Generate a mock order ID
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
        // Send email using Resend API if key is provided
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
        // Mock sending an email
        console.log(`[Email] Mock email sent to ${email} for order ${orderId} (total: INR ${totalAmount})`);
      }
      res.json({ success: true });
    } catch (err) {
      console.error('Failed to send email:', err);
      res.status(500).json({ error: 'Failed to send email' });
    }
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
