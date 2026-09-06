import mongoose, { Schema } from "mongoose";

const VenueSchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    city: { type: String, required: true, trim: true },
    address: { type: String, required: true },
    description: { type: String, required: true },
    status: {
      type: String,
      enum: ['active', 'inactive', 'maintenance'],
      default: 'active'
    }
  },
  {
    timestamps: true,
    versionKey: false
  }
);

export const Venue = mongoose.model('Venue', VenueSchema);