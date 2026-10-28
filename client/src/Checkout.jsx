import { useCallback, useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { getBooking } from './Paymentapi.js';
import PayNowButton from './PayNowButton';
import './payment.css';

const getHoldUntil = (booking) => {
    const times = (booking.seats ?? [])
        .map((bs) => bs.inventoryId)
        .filter((inv) => inv && inv.status === 'HELD' && inv.holdUntil)
        .map((inv) => new Date(inv.holdUntil).getTime());

    return times.length ? new Date(Math.max(...times)) : null;
};

const seatLabel = (bs) => {
    const seat = bs.inventoryId?.seatId;
    return seat ? `${seat.rowLabel}${seat.seatNumber}` : '';
};

// Route: /checkout/:bookingId
export default function Checkout() {
    const { bookingId } = useParams();

    const [booking, setBooking] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');


    
    const load = useCallback(async () => {
        setLoading(true);
        setError('');

        try {
            setBooking(await getBooking(bookingId));
        } catch (err) {
            setError(err.message);
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

    if (error) {
        return (
            <main className="pay-page">
                <h1>Couldn’t load your booking</h1>
                <p>{error}</p>
                <button className="pay-btn" onClick={load}>
                    Try again
                </button>
            </main>
        );
    }



    const holdUntil = getHoldUntil(booking);
    const active = booking.status === 'PENDING' && holdUntil && holdUntil > new Date();
    const seats = (booking.seats ?? []).map(seatLabel).filter(Boolean);

    if (!active) {
        return (
            <main className="pay-page">
                <h1>This booking can’t be paid</h1>
                <p>
                    {booking.status === 'CONFIRMED'
                        ? 'It is already confirmed.'
                        : 'The seat hold has ended. Please select your seats again.'}
                </p>
                <Link className="pay-link" to="/">
                    Back to home
                </Link>
            </main>
        );
    }

    return (
        <main className="pay-page">
            <h1>Complete your payment</h1>
            {seats.length > 0 && <p>Seats: {seats.join(', ')}</p>}

            <PayNowButton
                bookingId={booking._id}
                holdUntil={holdUntil.toISOString()}
                totalAmount={booking.totalAmount}
                onExpire={load}
            />
        </main>
    );
}

