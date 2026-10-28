import mongoose from 'mongoose';

const bookingSchema = new mongoose.Schema(
    {

        userId:{
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true
        },

        showId:{
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Show',
            required: true
        },
        totalAmount:{
            type: Number,
            required: true
        },

        status:{
            type: String,
            enum: ['PENDING', 'CONFIRMED', 'CANCELLED','EXPIRED'],
            default: 'PENDING'
        },
    },
    {
        timestamps: true
    }
);

const Booking = mongoose.model('Booking', bookingSchema);

export default Booking;

