import Hall from "./hall.model.js";

export class HallRepository {
  async create(hallData) {
    return new Hall(hallData).save();
  }

  async findById(id) {
    return Hall.findById(id).lean();
  }

  async updateById(id, updateData) {
    return Hall.findByIdAndUpdate(
      id,
      { $set: updateData },
      { new: true, runValidators: true }
    ).lean();
  }
}
