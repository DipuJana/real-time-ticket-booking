import stripe from '../../config/stripe.js';
import Booking from '../booking/booking.model.js';
import Payment from './payment.model.js';
import { confirmBooking, cancelBooking } from '../booking/booking.service.js';

// Keep in sync with HOLD_TIME in booking.service.js (milliseconds here)
const HOLD_TIME_MS = 5 * 60 * 1000;

// Stripe Checkout sessions cannot live less than 30 minutes
const STRIPE_SESSION_MINUTES = 30;

const httpError = (message, statusCode) => {
    const error = new Error(message);
    error.statusCode = statusCode;
    return error;
};

// Money was taken but we can't give the seats -> give the money back.
// Returns true if the refund was created, false if it failed.
const refundPayment = async (paymentIntentId) => {
    if (!paymentIntentId) return false;

    try {
        await stripe.refunds.create(
            { payment_intent: paymentIntentId },
            { idempotencyKey: `refund_${paymentIntentId}` }
        );
        return true;
    } catch (err) {
        // Log loudly: this needs manual follow-up if it fails
        console.error(`REFUND FAILED for ${paymentIntentId}:`, err);
        return false;
    }
};

/* -------------------------------------------------------------------------- */
/* Create Stripe Checkout Session                                             */
/* -------------------------------------------------------------------------- */

export const createPaymentSession = async (bookingId, userId) => {
    // Booking statuses are UPPERCASE in the booking service ("PENDING")
    const booking = await Booking.findOne({
        _id: bookingId,
        userId,
        status: 'PENDING',
    });

    if (!booking) {
        throw httpError('Booking not found or cannot be paid', 404);
    }

    // Don't let the user pay for seats that are no longer held
    if (Date.now() - new Date(booking.createdAt).getTime() > HOLD_TIME_MS) {
        throw httpError('Seat hold has expired. Please select seats again.', 409);
    }

    const payment = await Payment.findOne({
        bookingId: booking._id,
        status: 'PENDING',
    });

    if (!payment) {
        throw httpError('Payment not found', 404);
    }

    const metadata = {
        bookingId: booking._id.toString(),
        paymentId: payment._id.toString(),
    };

    const checkoutSession = await stripe.checkout.sessions.create({
        mode: 'payment',
        client_reference_id: booking._id.toString(),

        line_items: [
            {
                price_data: {
                    currency: 'inr',
                    product_data: { name: 'Movie Ticket' },
                    unit_amount: Math.round(payment.amount * 100),
                },
                quantity: 1,
            },
        ],

        metadata,
        payment_intent_data: { metadata },

        expires_at: Math.floor(Date.now() / 1000) + STRIPE_SESSION_MINUTES * 60,

        success_url: `${process.env.FRONTEND_URL}/payment/success?bookingId=${booking._id}`,
        cancel_url: `${process.env.FRONTEND_URL}/payment/cancel?bookingId=${booking._id}`,
    });

    return {
        sessionId: checkoutSession.id,
        checkoutUrl: checkoutSession.url,
    };
};

/* -------------------------------------------------------------------------- */
/* Payment successful (called from the webhook)                               */
/* -------------------------------------------------------------------------- */

export const handlePaymentSuccess = async (bookingId, paymentId, transactionId) => {
    const payment = await Payment.findOne({ _id: paymentId, bookingId });

    if (!payment) {
        throw httpError('Payment not found', 404);
    }

    // Webhook retry, or the same booking paid twice via two sessions
    if (payment.status === 'SUCCESS') {
        if (payment.transactionId && payment.transactionId !== transactionId) {
            await refundPayment(transactionId);
            return { success: true, message: 'Duplicate payment refunded' };
        }
        return { success: true, message: 'Payment already processed' };
    }

    // Payment was already marked FAILED (booking expired or cancelled),
    // but the customer paid anyway -> refund.
    if (payment.status !== 'PENDING') {
        const refunded = await refundPayment(transactionId);

        if (refunded) {
            await Payment.updateOne(
                { _id: payment._id, status: 'FAILED' },
                { $set: { status: 'REFUNDED', transactionId } }
            );
        }

        return { success: true, message: 'Payment refunded: booking no longer active' };
    }

    try {
        /*
            confirmBooking (booking service) does all of this in one transaction:
              Booking : PENDING -> CONFIRMED
              Seats   : HELD    -> BOOKED
              Payment : PENDING -> SUCCESS (+ transactionId)
        */
        await confirmBooking(bookingId, transactionId);
    } catch (error) {
        // 5xx = our problem: let the webhook fail so Stripe retries it.
        if (!error.statusCode || error.statusCode >= 500) {
            throw error;
        }

        // 4xx = seats lost (hold expired etc.) but the customer already paid.
        const refunded = await refundPayment(transactionId);

        await Payment.updateOne(
            { _id: payment._id, status: 'PENDING' },
            { $set: { status: refunded ? 'REFUNDED' : 'FAILED', transactionId } }
        );

        return {
            success: true,
            message: `Booking could not be confirmed (${error.message}). Payment refunded.`,
        };
    }

    return {
        success: true,
        bookingId,
        paymentId,
        status: 'SUCCESS',
    };
};

/* -------------------------------------------------------------------------- */
/* Payment failed / checkout expired                                          */
/* -------------------------------------------------------------------------- */

export const handlePaymentFailure = async (bookingId, paymentId) => {
    const payment = await Payment.findOne({
        _id: paymentId,
        bookingId,
        status: 'PENDING',
    });

    if (!payment) {
        return { success: true, message: 'Payment already processed' };
    }

    const booking = await Booking.findById(bookingId);

    if (booking && booking.status === 'PENDING') {
        // Releases the HELD seats, sets booking CANCELLED, payment FAILED
        await cancelBooking(bookingId, booking.userId);
    } else {
        await Payment.updateOne(
            { _id: payment._id, status: 'PENDING' },
            { $set: { status: 'FAILED' } }
        );
    }

    return {
        success: true,
        bookingId,
        paymentId,
        status: 'FAILED',
    };
};

