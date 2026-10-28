import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { getBooking } from './Paymentapi.js';
import './payment.css';

const MAX_ATTEMPTS = 10;
const POLL_MS = 2000;

const seatLabel = (bookingSeat) => {
    const seat = bookingSeat.inventoryId?.seatId;
    return seat ? `${seat.rowLabel}${seat.seatNumber}` : '';
};

/*
  The success URL only means the customer came back from Stripe.
  The booking is confirmed by the webhook, so this page polls until
  the booking status changes.
*/
export default function PaymentSuccess() {
    const [params] = useSearchParams();
    const bookingId = params.get('bookingId');

    const [booking, setBooking] = useState(null);
    const [state, setState] = useState('checking'); // checking | confirmed | delayed | failed

    useEffect(() => {
        if (!bookingId) {
            setState('failed');
            return;
        }

        let attempts = 0;
        let timer;
        let cancelled = false;

        const check = async () => {
            attempts += 1;

            try {
                const data = await getBooking(bookingId);
                if (cancelled) return;
                setBooking(data);

                if (data.status === 'CONFIRMED') {
                    setState('confirmed');
                    return;
                }

                if (data.status === 'EXPIRED' || data.status === 'CANCELLED') {
                    setState('failed');
                    return;
                }
            } catch {
                // keep trying until attempts run out
            }

            if (attempts >= MAX_ATTEMPTS) {
                if (!cancelled) setState('delayed');
                return;
            }

            timer = setTimeout(check, POLL_MS);
        };

        check();

        return () => {
            cancelled = true;
            clearTimeout(timer);
        };
    }, [bookingId]);

    const seats = booking?.seats?.map(seatLabel).filter(Boolean) ?? [];

    return (
        <main className="pay-page">
            {state === 'checking' && (
                <>
                    <h1>Confirming your payment</h1>
                    <p>This usually takes a few seconds. Please don’t close this page.</p>
                </>
            )}

            {state === 'confirmed' && (
                <>
                    <h1>Booking confirmed</h1>
                    {seats.length > 0 && <p>Your seats: {seats.join(', ')}</p>}
                    <p>Booking ID: {booking._id}</p>
                    <Link className="pay-link" to="/my-bookings">
                        View my bookings
                    </Link>
                </>
            )}

            {state === 'delayed' && (
                <>
                    <h1>Payment received, confirmation pending</h1>
                    <p>
                        We haven’t finished confirming your booking yet. Check your
                        bookings in a minute. If it doesn’t appear, your payment will be
                        refunded automatically.
                    </p>
                    <Link className="pay-link" to="/my-bookings">
                        View my bookings
                    </Link>
                </>
            )}

            {state === 'failed' && (
                <>
                    <h1>Booking not confirmed</h1>
                    <p>
                        Your seat hold ended before the payment finished. If you were
                        charged, the amount will be refunded to your original payment
                        method.
                    </p>
                    <Link className="pay-link" to="/">
                        Choose seats again
                    </Link>
                </>
            )}
        </main>
    );
}