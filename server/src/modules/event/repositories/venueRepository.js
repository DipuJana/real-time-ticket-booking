import { Venue } from "../models/venue.js";
export class venueRepository {
  // venue crud
  async createVenue(venueData) {
    const venue = new Venue(venueData);
    return await venue.save();
  }
  async findVenueById(id) {
    return await Venue.findById(id).lean();
  }
  async findAllVenues() {
    return await Venue.find({ status: 'active' }).lean();
  }
  async updateVenue(id, updateData) {
    return await Venue.findByIdAndUpdate(
      id,
      { $set: updateData },
      { new: true, runValidators: true }
    ).lean();
  }
  async deleteVenue(id) {
    return await Venue.findByIdAndDelete(id).lean();
  }
}