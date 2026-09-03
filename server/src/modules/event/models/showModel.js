import mongoose from "mongoose";

const ShowSchema = new mongoose.Schema(
  {
    eventId: { type: mongoose.Schema.Types.ObjectId, ref: 'Event', required: true ,index: true},
    startTime: { type: Date, required: true ,index: true},
    endTime: { type: Date, required: true },
    price: { type: Number, required: true },
    status: {
      type: String,
      enum: ['scheduled', 'cancelled', 'completed','ongoing'],
      default: 'scheduled'
    }
  },
  {
    timestamps: true,
  }
)
ShowSchema.index({ eventId: 1, startTime: 1 });

export const Show = mongoose.model('Show', ShowSchema); 