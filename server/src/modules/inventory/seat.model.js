import mongoose from "mongoose";

const seatSchema = new mongoose.Schema(
  {
    hallId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Hall",
      required: true,
    },

    rowLabel: {
      type: String,
      required: true,
      trim: true,
    },

    seatNumber: {
      type: Number,
      required: true,
      min: 1,
    },

    seatType: {
      type: String,
      required: true,
      enum: ["REGULAR", "PREMIUM"],
    },
  },
  {
    timestamps: true,
  }
);

seatSchema.index(
  {
    hallId: 1,
    rowLabel: 1,
    seatNumber: 1,
  },
  {
    unique: true,
  }
);

const Seat = mongoose.model("Seat", seatSchema);

export default Seat;