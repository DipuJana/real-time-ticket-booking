
import * as bookingService from './booking.service.js';

const sendError = (res, error, fallbackMessage) => {
    const statusCode = error.statusCode || 500;

    if (statusCode >= 500) {
        console.error(fallbackMessage, error);
    }

    return res.status(statusCode).json({
        success: false,
        message: statusCode >= 500 ? fallbackMessage : error.message,
        data: null,
    });
};

// POST /api/bookings
export const createBooking = async (req, res) => {
    try {
        const userId = req.user.id;
        const { showId, seatIds, totalAmount } = req.body;

        const booking = await bookingService.createBooking(
            userId,
            showId,
            seatIds,
            totalAmount
        );

        return res.status(201).json({
            success: true,
            message: 'Booking created successfully',
            data: booking,
        });
    } catch (error) {
        return sendError(res, error, 'Failed to create booking');
    }
};

// GET /api/bookings/:bookingId
export const getBookingById = async (req, res) => {
    try {
        const userId = req.user.id;
        const { bookingId } = req.params;

        // service signature is (bookingId, userId)
        const booking = await bookingService.getBookingById(bookingId, userId);

        return res.status(200).json({
            success: true,
            message: 'Booking fetched successfully',
            data: booking,
        });
    } catch (error) {
        return sendError(res, error, 'Failed to fetch booking');
    }
};

// GET /api/bookings
export const getMyBookings = async (req, res) => {
    try {
        const userId = req.user.id;
        const bookings = await bookingService.getMyBookings(userId);

        return res.status(200).json({
            success: true,
            message: 'My bookings fetched successfully',
            data: bookings,
        });
    } catch (error) {
        return sendError(res, error, 'Failed to fetch my bookings');
    }
};

// PATCH /api/bookings/:bookingId/cancel
export const cancelBooking = async (req, res) => {
    try {
        const userId = req.user.id;
        const { bookingId } = req.params;

        const result = await bookingService.cancelBooking(bookingId, userId);

        return res.status(200).json({
            success: true,
            message: result.message,
            data: result,
        });
    } catch (error) {
        return sendError(res, error, 'Failed to cancel booking');
    }
};

/*
  No public "confirm booking" endpoint on purpose.
  Bookings are confirmed only by the Stripe webhook
  (payment.service -> handlePaymentSuccess -> confirmBooking).
  A public confirm route would let anyone mark a booking as paid.
*/

