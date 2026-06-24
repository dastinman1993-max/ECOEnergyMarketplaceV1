import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Body parser middleware
  app.use(express.json());

  // API Route: Send Order
  // Matches the exact JSON structure defined in the requirements
  app.post('/api/send-order', (req, res) => {
    try {
      const orderData = req.body;

      // Validate core elements
      if (!orderData.buyer || !orderData.seller_telegram_id || !orderData.items || !orderData.items.length) {
        return res.status(400).json({
          success: false,
          error: 'Invalid order structure. Missing buyer, seller_telegram_id, or items.',
        });
      }

      console.log('--- RECEIVED ORDER FOR SELLER ID:', orderData.seller_telegram_id, '---');
      console.log(JSON.stringify(orderData, null, 2));
      console.log('--------------------------------------------------');

      // The production Telegram bot would be called here:
      // const TELEGRAM_BOT_WEBHOOK = process.env.TELEGRAM_BOT_WEBHOOK;
      // if (TELEGRAM_BOT_WEBHOOK) {
      //   await fetch(TELEGRAM_BOT_WEBHOOK, { method: 'POST', body: JSON.stringify(orderData) });
      // }

      return res.status(200).json({
        success: true,
        message: `✅ Замовлення успішно сформовано та надіслано продавцю @${orderData.items[0]?.seller_username || 'telegram'}`,
        orderId: `order-${Math.floor(100000 + Math.random() * 900000)}`,
        seller_telegram_id: orderData.seller_telegram_id,
        timestamp: new Date().toISOString(),
      });
    } catch (err: any) {
      console.error('Error handling order:', err);
      return res.status(500).json({
        success: false,
        error: 'Внутрішня помилка сервера при обробці замовлення.',
      });
    }
  });

  // Health check endpoint
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', rpc: 'active' });
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    // Serve static files in production
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[EcoMessenger Server] Running at http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((error) => {
  console.error('Fatal server startup error:', error);
});
