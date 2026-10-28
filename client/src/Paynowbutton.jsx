import { useEffect, useState } from 'react';
import { createCheckoutSession } from './Paymentapi';
import './payment.css';

const formatTime = (ms) => {
    const total = Math.max(0, Math.floor(ms / 1000));
    const m = String(Math.floor(total / 60)).padStart(2, '0');
    const s = String(total % 60).padStart(2, '0');
    return `${m}:${s}`;
};

/**
 * Props:
 *  bookingId   - id returned by POST /api/bookings
 *  holdUntil   - ISO date returned by POST /api/bookings
 *  totalAmount - number (rupees)
 *  onExpire    - optional callback when the hold runs out
 */
export default function PayNowButton({ bookingId, holdUntil, totalAmount, onExpire }) {
    const [remaining, setRemaining] = useState(
        () => new Date(holdUntil).getTime() - Date.now()
    );
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const expired = remaining <= 0;

    useEffect(() => {
        const timer = setInterval(() => {
            const left = new Date(holdUntil).getTime() - Date.now();
            setRemaining(left);

            if (left <= 0) {
                clearInterval(timer);
                onExpire?.();
            }
        }, 1000);

        return () => clearInterval(timer);
    }, [holdUntil, onExpire]);

    const handlePay = async () => {
        setLoading(true);
        setError('');

        try {
            const { checkoutUrl } = await createCheckoutSession(bookingId);
            window.location.assign(checkoutUrl); // Stripe hosted page
        } catch (err) {
            setError(err.message);
            setLoading(false);
        }
    };

    return (
        <div className="pay-card">
            <div className="pay-row">
                <span>Total</span>
                <strong>₹{totalAmount}</strong>
            </div>

            <div className="pay-row">
                <span>Seats held for</span>
                <strong className={remaining < 60000 ? 'pay-timer pay-timer--low' : 'pay-timer'}>
                    {expired ? 'Expired' : formatTime(remaining)}
                </strong>
            </div>

            <button
                className="pay-btn"
                onClick={handlePay}
                disabled={loading || expired}
            >
                {loading ? 'Opening checkout…' : `Pay ₹${totalAmount}`}
            </button>

            {expired && (
                <p className="pay-msg pay-msg--error" role="alert">
                    Your seat hold has expired. Select your seats again to continue.
                </p>
            )}
            {error && (
                <p className="pay-msg pay-msg--error" role="alert">
                    {error}
                </p>
            )}
        </div>
    );
}

