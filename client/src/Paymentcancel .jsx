import { useCallback, useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { getBooking } from './Paymentapi.js';
import PayNowButton from './PayNowButton';
import './payment.css';

// Latest hold time among the seats that are still HELD
const getHoldUntil = (booking) => {
    const times = (booking.seats ?? [])
        .map((bs) => bs.inventoryId)
        .filter((inv) => inv && inv.status === 'HELD' && inv.holdUntil)
        .map((inv) => new Date(inv.holdUntil).getTime());

    return times.length ? new Date(Math.max(...times)) : null;
};

export default function PaymentCancel() {
    const [params] = useSearchParams();
    const bookingId = params.get('bookingId');

    const [booking, setBooking] = useState(null);
    const [loading, setLoading] = useState(true);
    const [loadError, setLoadError] = useState('');

    const load = useCallback(async () => {
        if (!bookingId) {
            setLoadError('No booking was specified.');
            setLoading(false);
            return;
        }

        setLoading(true);
        setLoadError('');

        try {
            setBooking(await getBooking(bookingId));
        } catch (err) {
            setLoadError(err.message);
        } finally {
            setLoading(false);
        }
    }, [bookingId]);

    useEffect(() => {
        load();
    }, [load]);

    if (loading) {
        return (
            <main className="pay-page">
                <p>Loading your booking…</p>
            </main>
        );
    }

    // Could not load the booking: say so, don't pretend the hold ended
    if (loadError) {
        return (
            <main className="pay-page">
                <h1>Couldn’t load your booking</h1>
                <p>{loadError}</p>
                <button className="pay-btn" onClick={load}>
                    Try again
                </button>
            </main>
        );
    }

    const holdUntil = getHoldUntil(booking);
    const canRetry =
        booking.status === 'PENDING' && holdUntil && holdUntil > new Date();

    return (
        <main className="pay-page">
            <h1>Payment not completed</h1>

            {canRetry ? (
                <>
                    <p>You weren’t charged. Your seats are still held, so you can try again.</p>
                    <PayNowButton
                        bookingId={booking._id}
                        holdUntil={holdUntil.toISOString()}
                        totalAmount={booking.totalAmount}
                    />
                </>
            ) : (
                <>
                    <p>Your seat hold has ended and you weren’t charged.</p>
                    <Link className="pay-link" to="/">
                        Choose seats again
                    </Link>
                </>
            )}
        </main>
    );
}


