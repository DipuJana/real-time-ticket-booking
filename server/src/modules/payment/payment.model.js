import mongoose from 'mongoose';

const paymentShema = new mongoose.Schema({
    bookingId:{
        type:mongoose.Schema.Types.ObjectId,
        ref:'Booking',
        required:true
    }
    ,

    userId:{
        type:mongoose.Schema.Types.ObjectId,
        ref:'User',
        required:true
    }
    ,

    amount:{
        type:Number,
        required:true
    }
    ,
    status:{
        type:String,
        enum:['PENDING','SUCESS','FAILED','REFUNDED'],
        default:'PENDING'
    }
    ,   

    transactionId:{
        type:String,
        default:null
    },

}
,{
    timestamps:true
}
);

const Payment = mongoose.model('Payment',paymentShema);
export default Payment;
