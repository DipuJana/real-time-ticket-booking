import stripe from '../../config/stripe.js';
import {
    createPaymentSession,
    handlePaymentSuccess,
    handlePaymentFailure,
} from './payment.service.js';

// POST /api/payments/checkout-session   body: { bookingId }
export const createPayment = async (req, res) => {
    try {
        const { bookingId } = req.body;

        if (!bookingId) {
            return res.status(400).json({ message: 'bookingId is required' });
        }

        const result = await createPaymentSession(bookingId, req.user.id);

        return res.status(200).json(result);
    } catch (error) {
        console.error('Create payment error:', error);

        return res.status(error.statusCode || 500).json({
            message: error.message,
        });
    }
};

// POST /api/payments/webhook   (needs the RAW body, see payment.routes.js)
export const stripeWebhook = async (req, res) => {
    const signature = req.headers['stripe-signature'];

    let event;

    try {
        event = stripe.webhooks.constructEvent(
            req.body,
            signature,
            process.env.STRIPE_WEBHOOK_SECRET
        );
    } catch (error) {
        console.error('Stripe webhook verification failed:', error.message);
        return res.status(400).send(`Webhook Error: ${error.message}`);
    }

    try {
        const checkoutSession = event.data.object;
        const { bookingId, paymentId } = checkoutSession.metadata || {};

        // Not one of our checkout sessions: acknowledge so Stripe stops retrying
        if (!bookingId || !paymentId) {
            return res.status(200).json({ received: true });
        }

        switch (event.type) {
            case 'checkout.session.completed':
            case 'checkout.session.async_payment_succeeded': {
                // "completed" can arrive before the money is received
                // (delayed payment methods), so only confirm when paid.
                if (checkoutSession.payment_status === 'paid') {
                    await handlePaymentSuccess(
                        bookingId,
                        paymentId,
                        checkoutSession.payment_intent
                    );
                }
                break;
            }

            case 'checkout.session.expired':
            case 'checkout.session.async_payment_failed': {
                await handlePaymentFailure(bookingId, paymentId);
                break;
            }

            default:
                console.log(`Unhandled Stripe event: ${event.type}`);
        }

        return res.status(200).json({ received: true });
    } catch (error) {
        console.error('Stripe webhook processing error:', error);

        // 500 makes Stripe retry the webhook later
        return res.status(500).json({ message: error.message });
    }
};

