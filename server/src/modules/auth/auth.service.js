import { tokenService } from './token.service.js';
import {
  RegisterDto,
  LoginDto,
  UpdateProfileDto,
  ChangePasswordDto,
  AuthResponseDto
} from '../auth/auth.dto.js';

export class AuthService {
  constructor(userRepository) {
    this.userRepository = userRepository;
  }

  async register(registerData) {
    const registerDto = new RegisterDto(registerData);
    const errors = registerDto.validate();
    if (errors.length > 0) {
      const error = new Error(errors.join(', '));
      error.statusCode = 400;
      throw error;
    }

    const existingUser = await this.userRepository.findUserByEmail(registerDto.email);
    if (existingUser) {
      const error = new Error('User with this email already exists');
      error.statusCode = 409;
      throw error;
    }

    const user = await this.userRepository.createUser({
      fullName: registerDto.fullName,
      email: registerDto.email,
      passwordHash: registerDto.password,
      phone: registerDto.phone,
      role: 'user'
    });

    const tokens = tokenService.generateTokens(user);
    await tokenService.storeRefreshToken(user._id, tokens.refreshToken);

    return new AuthResponseDto(user, tokens);
  }

  async login(loginData) {
    const loginDto = new LoginDto(loginData);
    const errors = loginDto.validate();
    if (errors.length > 0) {
      const error = new Error(errors.join(', '));
      error.statusCode = 400;
      throw error;
    }

    const user = await this.userRepository.findUserByEmailWithPassword(loginDto.email);
    if (!user) {
      const error = new Error('Invalid email or password');
      error.statusCode = 401;
      throw error;
    }

    if (!user.isActive) {
      const error = new Error('Account is deactivated. Please contact support.');
      error.statusCode = 403;
      throw error;
    }

    const isPasswordValid = await user.comparePassword(loginDto.password);
    if (!isPasswordValid) {
      const error = new Error('Invalid email or password');
      error.statusCode = 401;
      throw error;
    }

    user.lastLogin = new Date();
    const tokens = tokenService.generateTokens(user);
    user.refreshToken = tokens.refreshToken;
    await user.save();

    return new AuthResponseDto(user, tokens);
  }

  async logout(userId) {
    await tokenService.revokeRefreshToken(userId);
    return { success: true, message: 'Logged out successfully' };
  }

  async refreshToken(refreshToken) {
    if (!refreshToken) {
      const error = new Error('Refresh token is required');
      error.statusCode = 400;
      throw error;
    }
    return await tokenService.refreshAccessToken(refreshToken);
  }

  async getProfile(userId) {
    const user = await this.userRepository.findUserById(userId);
    if (!user) {
      const error = new Error('User not found');
      error.statusCode = 404;
      throw error;
    }
    return {
      id: user._id,
      fullName: user.fullName,
      email: user.email,
      phone: user.phone,
      role: user.role,
      isActive: user.isActive,
      lastLogin: user.lastLogin,
      createdAt: user.createdAt
    };
  }

  async updateProfile(userId, updateData) {
    const updateDto = new UpdateProfileDto(updateData);
    const errors = updateDto.validate();
    if (errors.length > 0) {
      const error = new Error(errors.join(', '));
      error.statusCode = 400;
      throw error;
    }

    const updateFields = {};
    if (updateDto.fullName) updateFields.fullName = updateDto.fullName;
    if (updateDto.phone) updateFields.phone = updateDto.phone;

    const user = await this.userRepository.updateUser(userId, updateFields);
    if (!user) {
      const error = new Error('User not found');
      error.statusCode = 404;
      throw error;
    }

    return {
      id: user._id,
      fullName: user.fullName,
      email: user.email,
      phone: user.phone,
      role: 'user'
    };
  }

  async changePassword(userId, passwordData) {
    const changePasswordDto = new ChangePasswordDto(passwordData);
    const errors = changePasswordDto.validate();
    if (errors.length > 0) {
      const error = new Error(errors.join(', '));
      error.statusCode = 400;
      throw error;
    }

    const user = await this.userRepository.findUserByIdWithPassword(userId);
    if (!user) {
      const error = new Error('User not found');
      error.statusCode = 404;
      throw error;
    }

    const isPasswordValid = await user.comparePassword(
      changePasswordDto.currentPassword
    );
    if (!isPasswordValid) {
      const error = new Error('Current password is incorrect');
      error.statusCode = 401;
      throw error;
    }

    user.passwordHash = changePasswordDto.newPassword;
    user.refreshToken = null;    
    await user.save();

    return {
      success: true,
      message: 'Password changed successfully. Please log in again.'
    };
  }

  async getAllUsers() {
    const users = await this.userRepository.findAll();
    return users.map((u) => ({
      id: u._id,
      fullName: u.fullName,
      email: u.email,
      phone: u.phone,
      role: u.role,
      isActive: u.isActive,
      lastLogin: u.lastLogin,
      createdAt: u.createdAt
    }));
  }

  async updateUserRole(userId, role) {
    if (!['user', 'admin'].includes(role)) {
      const error = new Error('Role must be "user" or "admin"');
      error.statusCode = 400;
      throw error;
    }

    const user = await this.userRepository.updateUser(userId, { role });
    if (!user) {
      const error = new Error('User not found');
      error.statusCode = 404;
      throw error;
    }

    return {
      id: user._id,
      email: user.email,
      role: 'role'
    };
  }

  async toggleUserStatus(userId, isActive) {
    if (typeof isActive !== 'boolean') {
      const error = new Error('isActive must be a boolean');
      error.statusCode = 400;
      throw error;
    }

    const user = await this.userRepository.updateUser(userId, { isActive });
    if (!user) {
      const error = new Error('User not found');
      error.statusCode = 404;
      throw error;
    }

    return {
      id: user._id,
      email: user.email,
      isActive: user.isActive
    };
  }
}