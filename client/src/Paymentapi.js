const API = import.meta.env.VITE_API_URL || 'http://localhost:5001/api';

const request = async (path, options = {}) => {
    const res = await fetch(`${API}${path}`, {
        ...options,
        headers: {
            'Content-Type': 'application/json',
            // Adjust if you keep the token somewhere else
            Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
    });

    const body = await res.json().catch(() => ({}));

    if (!res.ok) {
        throw new Error(body.message || 'Something went wrong. Please try again.');
    }

    return body.data ?? body;
};

// -> { bookingId, holdUntil, totalAmount, ... }
export const createBooking = ({ showId, seatIds, totalAmount }) =>
    request('/booking', {
        method: 'POST',
        body: JSON.stringify({ showId, seatIds, totalAmount }),
    });

// -> booking with seats[]
export const getBooking = (bookingId) => request(`/booking/${bookingId}`);

// -> { sessionId, checkoutUrl }
export const createCheckoutSession = (bookingId) =>
    request('/payments/checkout-session', {
        method: 'POST',
        body: JSON.stringify({ bookingId }),
    });

    