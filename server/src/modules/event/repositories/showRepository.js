import Show from "../models/show.js";
import ShowInventory from "../../inventory/showInventory.model.js";

export class ShowRepository {
  async create(showData) {
    return new Show(showData).save();
  }

  async findById(id) {
    return Show.findById(id).lean();
  }

  async findByEventId(eventId) {
    return Show.find({ eventId }).lean();
  }

  async findByHallId(hallId) {
    return Show.find({ hallId }).lean();
  }

  async updateById(id, updateData) {
    return Show.findByIdAndUpdate(
      id,
      { $set: updateData },
      { new: true, runValidators: true }
    ).lean();
  }

  async findOverlappingShow(hallId, startTime, endTime, excludeShowId) {
    const query = {
      hallId,
      startTime: { $lt: endTime },
      endTime: { $gt: startTime },
    };

    if (excludeShowId) {
      query._id = { $ne: excludeShowId };
    }

    return Show.findOne(query).lean();
  }

  async hasInventory(showId) {
    return Boolean(await ShowInventory.exists({ showId }));
  }
}
