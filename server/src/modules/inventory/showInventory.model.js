import mongoose from "mongoose";

const showInventorySchema = new mongoose.Schema(
  {
    showId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Show",
      required: true,
    },

    seatId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Seat",
      required: true,
    },

    status: {
      type: String,
      required: true,
      enum: ["AVAILABLE", "HELD", "BOOKED"],
      default: "AVAILABLE",
    },

    holdUntil: {
      type: Date,
      default: null,
    },

    version: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

showInventorySchema.index(
  {
    showId: 1,
    seatId: 1,
  },
  {
    unique: true,
  }
);

const ShowInventory = mongoose.model(
  "ShowInventory",
  showInventorySchema
);

export default ShowInventory;