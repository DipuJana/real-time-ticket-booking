import mongoose from 'mongoose';

const bookingSeatSchema = new mongoose.Schema(
    {
        bookingId:{
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Booking',
            required: true  
        },

        inventoryId:{
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Inventory',
            required: true
        },

    },
    {
        timestamps: true
    }
);

const BookingSeat = mongoose.model('BookingSeat', bookingSeatSchema);

export default BookingSeat;
