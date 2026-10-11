import { User } from '../auth/models/user.model.js';

export class UserRepository {
  
  async createUser(userData) {
    const user = new User(userData);
    return await user.save();
  }

  async save(user) {
    return await user.save();
  }

  async findUserById(id) {
    return await User.findById(id)
      .select('-passwordHash -refreshToken')
      .lean();
  }

  async findUserByEmail(email) {
    return await User.findOne({ email })
      .select('-passwordHash -refreshToken')
      .lean();
  }

  async findUserByEmailWithPassword(email) {
    return await User.findOne({ email }).select('+passwordHash');
  }

  async findUserByIdWithPassword(id) {
    return await User.findById(id).select('+passwordHash +refreshToken');
  }

  async findUserByIdWithRefreshToken(id) {
    return await User.findById(id).select('+refreshToken');
  }

  async findAll() {
    return await User.find({})
      .select('-passwordHash -refreshToken')
      .sort({ createdAt: -1 })
      .lean();
  }

  async updateUser(id, updateData) {
    return await User.findByIdAndUpdate(
      id,
      { $set: updateData },
      { new: true, runValidators: true }
    )
      .select('-passwordHash -refreshToken')
      .lean();
  }

  async updateRefreshToken(id, refreshToken) {
    return await User.findByIdAndUpdate(
      id,
      { $set: { refreshToken } },
      { new: true }
    ).select('+refreshToken');
  }

  async deleteUser(id) {
    const result = await User.deleteOne({ _id: id });
    return result.deletedCount > 0;
  }
}