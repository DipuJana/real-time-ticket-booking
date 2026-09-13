import mongoose from "mongoose";

const hallSchema = new mongoose.Schema(
  {
    venueId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Venue",
      required: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    totalRows: {
      type: Number,
      required: true,
      min: 1,
    },
    seatsPerRow: {
      type: Number,
      required: true,
      min: 1,
    },
    capacity: {
      type: Number,
      required: true,
      min: 1,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

hallSchema.index({ venueId: 1, name: 1 }, { unique: true });

hallSchema.pre("validate", function deriveCapacity(next) {
  if (Number.isInteger(this.totalRows) && Number.isInteger(this.seatsPerRow)) {
    this.capacity = this.totalRows * this.seatsPerRow;
  }
  next();
});

const Hall = mongoose.model("Hall", hallSchema);

export default Hall;
