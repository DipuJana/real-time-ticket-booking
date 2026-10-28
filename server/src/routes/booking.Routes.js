import express from "express";

import {
  createBooking,
  getBookingById,
  getMyBookings,
  cancelBooking,
} from "../modules/booking/booking.controller.js";

//import authMiddleware from "/auth/middleware/auth.middleware.js";
import { authenticate } from "../modules/auth/middleware/auth.middleware.js";

const bookingrouter = express.Router();


// Create a booking and hold seats
bookingrouter.post(
  "/",
  authenticate,
  createBooking
);



// Get logged-in user's booking
bookingrouter.get(
  "/:bookingId",
  authenticate,
  getBookingById
);


// Get all bookings of logged-in user
bookingrouter.get(
  "/my",
  authenticate,
  getMyBookings
);



// Cancel pending booking
bookingrouter.delete(
  "/:bookingId",
  authenticate,
  cancelBooking
);


export default bookingrouter;