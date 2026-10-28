   import express from 'express';
import { createPayment, stripeWebhook } from './payment.controller.js';
import { protect } from '../middleware/auth.middleware.js'; // <- use your own auth middleware

// Normal JSON routes
const router = express.Router();
router.post('/checkout-session', protect, createPayment);

// Webhook router: needs the RAW body, so it must be mounted BEFORE express.json()
export const webhookRouter = express.Router();
webhookRouter.post('/', express.raw({ type: 'application/json' }), stripeWebhook);

export default router;

/*
  In app.js the ORDER matters:

  import paymentRoutes, { webhookRouter } from './modules/payment/payment.routes.js';

  app.use('/api/payments/webhook', webhookRouter);   // 1. raw body, BEFORE express.json()
  app.use(express.json());                           // 2.
  app.use('/api/payments', paymentRoutes);           // 3.

  .env:
    STRIPE_SECRET_KEY=sk_test_...
    STRIPE_WEBHOOK_SECRET=whsec_...
    FRONTEND_URL=http://localhost:5173

  Local webhook testing:
    stripe listen --forward-to localhost:5000/api/payments/webhook
*/
