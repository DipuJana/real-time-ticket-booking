
import { BrowserRouter, Routes, Route, Link } from 'react-router-dom';
import Checkout from './Checkout';
import PaymentSuccess from './Paymentsuccess.jsx';
import PaymentCancel from './Paymentcancel .jsx';

const shell = { maxWidth: 480, margin: '4rem auto', padding: '0 1rem' };

function Home() {
  return (
    <main style={shell}>
      <h1>Ticket booking</h1>
      <p>Seat selection goes here.</p>
      <Link to="/my-bookings">My bookings</Link>
    </main>
  );
}

function MyBookings() {
  return (
    <main style={shell}>
      <h1>My bookings</h1>
      <p>Your bookings list goes here.</p>
      <Link to="/">Back to home</Link>
    </main>
  );
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/my-bookings" element={<MyBookings />} />
        <Route path="/checkout/:bookingId" element={<Checkout />} />
        <Route path="/payment/success" element={<PaymentSuccess />} />
        <Route path="/payment/cancel" element={<PaymentCancel />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;

