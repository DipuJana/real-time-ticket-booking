import mongoose from "mongoose";

const EventSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true, index: true },
    category: { type: String, required: true, trim: true, index: true },
    dateLocation: { type: String, required: true },
    city: { type: String, required: true, trim: true,index: true },
    duration: { type: Number, required: true },
    language: { type: String, required: true, trim: true },
    organizer: { type: String, required: true, trim: true, index: true },
    hostname: { type: String, required: true, trim: true, index: true },
    description: { type: String, required: true, trim: true },
    image: { type: [String], required: true, trim: true },
    status: {
      type: String,
      enum: ['active', 'inactive', 'maintenance', 'completed'],
      default: 'active'
    },
    posterUrl: { type: String, required: true, trim: true },
    ageRestriction: { type: String, required: true, enum: ['All ages', '18+', '21+'], default: 'All ages' }
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
    versionKey: false
  }
);
EventSchema.index({
  title: 'text',
  category: 'text',
  // language: 'text',
  city: 'text',
  organizer: 'text',
  hostname: 'text'
},
{
        default_language: 'none'
    }
);

EventSchema.index({
  title: 1,
  category: 1,
  language: 1,
  organizer: 1,
  hostname: 1,
  city: 1,
  createdAt: -1
});

export const Event = mongoose.model('Event', EventSchema);