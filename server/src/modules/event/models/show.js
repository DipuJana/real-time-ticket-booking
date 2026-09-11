import mongoose from "mongoose";

const showSchema = new mongoose.Schema(
  {
    eventId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Event",
      required: true,
    },
    hallId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Hall",
      required: true,
    },
    startTime: {
      type: Date,
      required: true,
    },
    endTime: {
      type: Date,
      required: true,
    },
    price: {
      type: Number,
      required: true,
      min: 0,
      validate: {
        validator: Number.isFinite,
        message: "price must be a finite number",
      },
    },
    status: {
      type: String,
      required: true,
      enum: ["SCHEDULED", "CANCELLED"],
      default: "SCHEDULED",
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

showSchema.pre("validate", function validateSchedule(next) {
  if (
    this.startTime instanceof Date &&
    this.endTime instanceof Date &&
    !Number.isNaN(this.startTime.getTime()) &&
    !Number.isNaN(this.endTime.getTime()) &&
    this.startTime >= this.endTime
  ) {
    this.invalidate("endTime", "endTime must be later than startTime");
  }
  next();
});

const Show = mongoose.model("Show", showSchema);

export default Show;
