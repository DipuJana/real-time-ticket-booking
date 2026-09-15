import { User } from './models/user.model.js';
import { tokenService } from '../auth/token.service.js';
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
      throw new Error(errors.join(', '));
    }
    const existingUser = await User.findByEmail(registerDto.email);
    if (existingUser) {
      throw new Error('User with this email already exists');
    }
    const user = new User({
      fullName: registerDto.fullName,
      email: registerDto.email,
      passwordHash: registerDto.password, // hashed by pre-save hook
      phone: registerDto.phone
    });
    await user.save();
    const tokens = tokenService.generateTokens(user);
    await tokenService.storeRefreshToken(user._id, tokens.refreshToken);

    return new AuthResponseDto(user, tokens);
  }
  async login(loginData) {
    const loginDto = new LoginDto(loginData);
    const errors = loginDto.validate();
    if (errors.length > 0) {
      throw new Error(errors.join(', '));
    }

    const user = await User.findByEmailWithPassword(loginDto.email);
    if (!user) {
      throw new Error('Invalid email or password');
    }

    if (!user.isActive) {
      throw new Error('Account is deactivated. Please contact support.');
    }

    const isPasswordValid = await user.comparePassword(loginDto.password);
    if (!isPasswordValid) {
      throw new Error('Invalid email or password');
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
      throw new Error('Refresh token is required');
    }
    return await tokenService.refreshAccessToken(refreshToken);
  }
  async getProfile(userId) {
    const user = await this.userRepository.findUserById(userId);
    if (!user) {
      throw new Error('User not found');
    }
    return user;
  }
  async updateProfile(userId, updateData) {
    const updateDto = new UpdateProfileDto(updateData);
    const errors = updateDto.validate();
    if (errors.length > 0) {
      throw new Error(errors.join(', '));
    }

    const user = await this.userRepository.updateUser(userId, {
      fullName: updateDto.fullName,
      phone: updateDto.phone
    });

    if (!user) {
      throw new Error('User not found');
    }

    return user;
  }
  async changePassword(userId, passwordData) {
    const changePasswordDto = new ChangePasswordDto(passwordData);
    const errors = changePasswordDto.validate();
    if (errors.length > 0) {
      throw new Error(errors.join(', '));
    }

    const user = await User.findById(userId).select('+passwordHash');
    if (!user) {
      throw new Error('User not found');
    }

    const isPasswordValid = await user.comparePassword(
      changePasswordDto.currentPassword
    );
    if (!isPasswordValid) {
      throw new Error('Current password is incorrect');
    }

    user.passwordHash = changePasswordDto.newPassword;
    await user.save();

    return { success: true, message: 'Password changed successfully' };
  }
}