import mongoose from 'mongoose';
import Booking from './booking.model.js';
import BookingSeat from './bookingSeat.model.js';
import Payment from '../payment/payment.model.js';
import ShowInventory from '../inventory/showInventory.model.js';
import { redis } from '../../config/redis.js';

const HOLD_TIME = 5 * 60; // seconds

/* -------------------------------------------------------------------------- */
/* Helpers                                                                    */
/* -------------------------------------------------------------------------- */

const httpError = (message, statusCode) => {
    const error = new Error(message);
    error.statusCode = statusCode;
    return error;
};

const seatLockKey = (showId, seatId) => `seat:${showId}:${seatId}`;

const abortIfActive = async (session) => {
    if (session.inTransaction()) {
        await session.abortTransaction();
    }
};

// Redis cleanup must never break a request whose DB work already succeeded.
const deleteLockKeys = async (keys) => {
    if (!keys.length) return;
    try {
        await redis.del(keys);
    } catch (err) {
        console.error('Failed to release Redis seat locks:', err);
    }
};

const releaseSeatLocks = async (showId, inventoryIds) => {
    try {
        const inventories = await ShowInventory.find({
            _id: { $in: inventoryIds },
        })
            .select('seatId')
            .lean();

        await deleteLockKeys(
            inventories.map((inv) => seatLockKey(showId, inv.seatId))
        );
    } catch (err) {
        console.error('Failed to release Redis seat locks:', err);
    }
};

/**
 * Lazily frees expired holds for a show.
 * 1. Expires PENDING bookings that own expired holds (so an old booking can
 *    never be confirmed on seats that were handed to someone else).
 * 2. Frees any remaining expired holds (e.g. made via /api/inventory/hold).
 */
const releaseExpiredHolds = async (showId) => {
    const now = new Date();

    const expired = await ShowInventory.find({
        showId,
        status: 'HELD',
        holdUntil: { $lte: now },
    })
        .select('_id')
        .lean();

    if (expired.length === 0) return;

    const inventoryIds = expired.map((inv) => inv._id);

    const links = await BookingSeat.find({
        inventoryId: { $in: inventoryIds },
    })
        .select('bookingId')
        .lean();

    const bookingIds = [...new Set(links.map((l) => l.bookingId.toString()))];

    const pendingBookings = await Booking.find({
        _id: { $in: bookingIds },
        status: 'PENDING',
    })
        .select('_id')
        .lean();

    for (const b of pendingBookings) {
        await expireBooking(b._id);
    }

    await ShowInventory.updateMany(
        {
            _id: { $in: inventoryIds },
            status: 'HELD',
            holdUntil: { $lte: now },
        },
        {
            $set: { status: 'AVAILABLE', holdUntil: null },
            $inc: { version: 1 },
        }
    );
};

/* -------------------------------------------------------------------------- */
/* Show seats                                                                 */
/* -------------------------------------------------------------------------- */

const getShowSeats = async (showId) => {
    if (!showId || !mongoose.isValidObjectId(showId)) {
        throw httpError('Invalid show ID', 400);
    }

    await releaseExpiredHolds(showId);

    const inventories = await ShowInventory.find({ showId })
        .populate('seatId')
        .lean();

    return inventories.sort((a, b) => {
        if (a.seatId.rowLabel !== b.seatId.rowLabel) {
            return a.seatId.rowLabel.localeCompare(b.seatId.rowLabel);
        }
        return a.seatId.seatNumber - b.seatId.seatNumber;
    });
};

/* -------------------------------------------------------------------------- */
/* Create booking                                                             */
/* -------------------------------------------------------------------------- */

const createBooking = async (userId, showId, seatIds, totalAmount) => {
    // Validate BEFORE opening a session so nothing can leak.
    if (!showId || !Array.isArray(seatIds) || seatIds.length === 0 || !totalAmount) {
        throw httpError('showId and seatIds and totalAmount are required', 400);
    }

    if (!mongoose.isValidObjectId(showId) || !seatIds.every((id) => mongoose.isValidObjectId(id))) {
        throw httpError('Invalid show ID or seat IDs', 400);
    }

    const uniqueSeatIds = [...new Set(seatIds.map(String))];

    // Free expired holds first, otherwise those seats look unavailable.
    await releaseExpiredHolds(showId);

    const session = await mongoose.startSession();
    const lockedKeys = [];

    try {
        // 1. Lock seats in Redis (fast guard against concurrent requests)
        for (const seatId of uniqueSeatIds) {
            const key = seatLockKey(showId, seatId);

            // ioredis syntax: set key only if it doesn't exist, with expiry
            const result = await redis.set(
                key,
                userId.toString(),
                'EX',
                HOLD_TIME,
                'NX'
            );

            if (result !== 'OK') {
                throw httpError(`Seat ${seatId} is already locked`, 409);
            }

            lockedKeys.push(key);
        }

        // 2. MongoDB transaction
        session.startTransaction();

        // Read inside the transaction and use THIS result for everything below.
        const inventories = await ShowInventory.find({
            showId,
            seatId: { $in: uniqueSeatIds },
            status: 'AVAILABLE',
        }).session(session);

        if (inventories.length !== uniqueSeatIds.length) {
            throw httpError('Some seats are not available', 409);
        }

        const holdUntil = new Date(Date.now() + HOLD_TIME * 1000);

        const [booking] = await Booking.create(
            [{ userId, showId, totalAmount, status: 'PENDING' }],
            { session }
        );

        const inventoryIds = inventories.map((inv) => inv._id);

        await BookingSeat.insertMany(
            inventoryIds.map((inventoryId) => ({
                bookingId: booking._id,
                inventoryId,
            })),
            { session }
        );

        const updateResult = await ShowInventory.updateMany(
            { _id: { $in: inventoryIds }, status: 'AVAILABLE' },
            {
                $set: { status: 'HELD', holdUntil },
                $inc: { version: 1 },
            },
            { session }
        );

        if (updateResult.modifiedCount !== uniqueSeatIds.length) {
            throw httpError('Failed to hold all seats', 409);
        }

        await Payment.create(
            [{ bookingId: booking._id, userId, amount: totalAmount, status: 'PENDING' }],
            { session }
        );

        await session.commitTransaction();

        return {
            bookingId: booking._id,
            showId,
            seatIds: uniqueSeatIds,
            totalAmount,
            status: 'PENDING',
            holdUntil,
            expiresIn: HOLD_TIME,
        };
    } catch (error) {
        await abortIfActive(session);
        await deleteLockKeys(lockedKeys);
        throw error;
    } finally {
        await session.endSession();
    }
};

/* -------------------------------------------------------------------------- */
/* Confirm booking (after successful payment)                                 */
/* -------------------------------------------------------------------------- */

const confirmBooking = async (bookingId, transactionId) => {
    const session = await mongoose.startSession();

    try {
        session.startTransaction();

        const booking = await Booking.findById(bookingId).session(session);

        if (!booking) {
            throw httpError('Booking not found', 404);
        }

        if (booking.status === 'CONFIRMED') {
            throw httpError('Booking is already confirmed', 400);
        }

        if (booking.status !== 'PENDING') {
            throw httpError(
                `Booking cannot be confirmed as it is in ${booking.status} status`,
                409
            );
        }

        const bookingSeats = await BookingSeat.find({
            bookingId: booking._id,
        }).session(session);

        if (bookingSeats.length === 0) {
            throw httpError('No seats found for this booking', 400);
        }

        const inventoryIds = bookingSeats.map((bs) => bs.inventoryId);

        // Seats must still be HELD and the hold must not have expired
        const heldCount = await ShowInventory.countDocuments({
            _id: { $in: inventoryIds },
            status: 'HELD',
            holdUntil: { $gt: new Date() },
        }).session(session);

        if (heldCount !== inventoryIds.length) {
            throw httpError('Some seats are no longer held', 409);
        }

        // HELD -> BOOKED
        const result = await ShowInventory.updateMany(
            {
                _id: { $in: inventoryIds },
                status: 'HELD',
                holdUntil: { $gt: new Date() },
            },
            {
                $set: { status: 'BOOKED', holdUntil: null },
                $inc: { version: 1 },
            },
            { session }
        );

        if (result.modifiedCount !== inventoryIds.length) {
            throw httpError('Failed to book all seats', 409);
        }

        // Booking -> CONFIRMED
        booking.status = 'CONFIRMED';
        await booking.save({ session });

        // Payment -> SUCCESS
        await Payment.findOneAndUpdate(
            { bookingId: booking._id, status: 'PENDING' },
            { $set: { status: 'SUCCESS', transactionId } },
            { session }
        );

        await session.commitTransaction();

        // Redis locks are no longer needed (DB status is BOOKED now)
        await releaseSeatLocks(booking.showId, inventoryIds);

        return booking;
    } catch (error) {
        await abortIfActive(session);
        if (!error.statusCode) {
            error.statusCode = 500;
        }
        throw error;
    } finally {
        await session.endSession();
    }
};

/* -------------------------------------------------------------------------- */
/* Cancel booking                                                             */
/* -------------------------------------------------------------------------- */

const cancelBooking = async (bookingId, userId) => {
    if (!mongoose.isValidObjectId(bookingId)) {
        throw httpError('Invalid booking ID', 400);
    }

    const session = await mongoose.startSession();

    try {
        session.startTransaction();

        const booking = await Booking.findOne({
            _id: bookingId,
            userId,
        }).session(session);

        if (!booking) {
            throw httpError('Booking not found', 404); // was `return error`
        }

        if (booking.status !== 'PENDING') {
            throw httpError(
                `Booking cannot be cancelled. Current status: ${booking.status}`,
                409
            );
        }

        const bookingSeats = await BookingSeat.find({
            bookingId: booking._id,
        }).session(session);

        const inventoryIds = bookingSeats.map((bs) => bs.inventoryId);

        // HELD -> AVAILABLE
        await ShowInventory.updateMany(
            { _id: { $in: inventoryIds }, status: 'HELD' },
            {
                $set: { status: 'AVAILABLE', holdUntil: null },
                $inc: { version: 1 },
            },
            { session }
        );

        booking.status = 'CANCELLED';
        await booking.save({ session });

        // Payment -> FAILED
        await Payment.findOneAndUpdate(
            { bookingId: booking._id, status: 'PENDING' },
            { $set: { status: 'FAILED' } },
            { session }
        );

        await session.commitTransaction();

        await releaseSeatLocks(booking.showId, inventoryIds);

        return {
            bookingId: booking._id,
            status: booking.status,
            message: 'Booking cancelled successfully',
        };
    } catch (error) {
        await abortIfActive(session);
        throw error;
    } finally {
        await session.endSession();
    }
};

/* -------------------------------------------------------------------------- */
/* Expire booking                                                             */
/* -------------------------------------------------------------------------- */

const expireBooking = async (bookingId) => {
    const session = await mongoose.startSession();

    try {
        session.startTransaction();

        const booking = await Booking.findOne({
            _id: bookingId,
            status: 'PENDING',
        }).session(session);

        if (!booking) {
            await session.abortTransaction(); // nothing to do
            return null;
        }

        const bookingSeats = await BookingSeat.find({
            bookingId: booking._id,
        }).session(session);

        const inventoryIds = bookingSeats.map((bs) => bs.inventoryId);
        const now = new Date();

        // If any seat is still within its hold window, the booking hasn't expired yet.
        const stillHeld = await ShowInventory.countDocuments({
            _id: { $in: inventoryIds },
            status: 'HELD',
            holdUntil: { $gt: now },
        }).session(session);

        if (stillHeld > 0) {
            await session.abortTransaction();
            return null;
        }

        // Release seats whose hold has expired
        await ShowInventory.updateMany(
            {
                _id: { $in: inventoryIds },
                status: 'HELD',
                holdUntil: { $lte: now },
            },
            {
                $set: { status: 'AVAILABLE', holdUntil: null },
                $inc: { version: 1 },
            },
            { session }
        );

        // Booking -> EXPIRED
        booking.status = 'EXPIRED';
        await booking.save({ session });

        // Payment -> FAILED
        await Payment.findOneAndUpdate(
            { bookingId: booking._id, status: 'PENDING' },
            { $set: { status: 'FAILED' } },
            { session }
        );

        await session.commitTransaction();

        await releaseSeatLocks(booking.showId, inventoryIds);

        return booking;
    } catch (error) {
        await abortIfActive(session);
        throw error;
    } finally {
        await session.endSession();
    }
};

/* -------------------------------------------------------------------------- */
/* Queries                                                                    */
/* -------------------------------------------------------------------------- */

const getBookingById = async (bookingId, userId) => {
    if (!mongoose.isValidObjectId(bookingId)) {
        throw httpError('Invalid booking ID', 400);
    }

    const booking = await Booking.findOne({ _id: bookingId, userId }).lean();

    if (!booking) {
        throw httpError('Booking not found', 404);
    }

    const bookingSeats = await BookingSeat.find({ bookingId: booking._id })
        .populate({
            path: 'inventoryId',
            populate: { path: 'seatId' },
        })
        .lean();

    return { ...booking, seats: bookingSeats };
};

const getMyBookings = async (userId) => {
    return await Booking.find({ userId }).sort({ createdAt: -1 }).lean();
};

export {
    createBooking,
    confirmBooking,
    cancelBooking,
    expireBooking,
    getBookingById,
    getMyBookings,
    getShowSeats,
};

