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

  /**
   * Register a new user
   */
  async register(registerData) {
    // 1. Validate
    console.log("service1");
    const registerDto = new RegisterDto(registerData);
    console.log(registerDto.fullName);
    const errors = registerDto.validate();
    console.log("service3");
    if (errors.length > 0) {
      throw new Error(errors.join(', '));
    }
console.log("service4");
    // 2. Check duplicate
    const existingUser = await User.findByEmail(registerDto.email);
    if (existingUser) {
      throw new Error('User with this email already exists');
    }

    // 3. Create user
    const user = new User({
      fullName: registerDto.fullName,
      email: registerDto.email,
      passwordHash: registerDto.password, // hashed by pre-save hook
      phone: registerDto.phone
    });
console.log("befor save");
    await user.save();
console.log("after save");
    // 4. Generate tokens
    console.log(registerDto.fullName+"2");
    const tokens = tokenService.generateTokens(user);
console.log(registerDto.fullName+"2");
    // 5. Persist refresh token
    await tokenService.storeRefreshToken(user._id, tokens.refreshToken);

    return new AuthResponseDto(user, tokens);
  }

  /**
   * Login
   */
  async login(loginData) {
    // 1. Validate
    const loginDto = new LoginDto(loginData);
    const errors = loginDto.validate();
    if (errors.length > 0) {
      throw new Error(errors.join(', '));
    }

    // 2. Find user with password
    const user = await User.findByEmailWithPassword(loginDto.email);
    if (!user) {
      throw new Error('Invalid email or password');
    }

    // 3. Check active
    if (!user.isActive) {
      throw new Error('Account is deactivated. Please contact support.');
    }

    // 4. Compare password
    const isPasswordValid = await user.comparePassword(loginDto.password);
    if (!isPasswordValid) {
      throw new Error('Invalid email or password');
    }

    // 5. Update last login
    user.lastLogin = new Date();

    // 6. Generate tokens
    const tokens = tokenService.generateTokens(user);
    user.refreshToken = tokens.refreshToken;
    await user.save();

    return new AuthResponseDto(user, tokens);
  }

  /**
   * Logout
   */
  async logout(userId) {
    await tokenService.revokeRefreshToken(userId);
    return { success: true, message: 'Logged out successfully' };
  }

  /**
   * Refresh tokens
   */
  async refreshToken(refreshToken) {
    if (!refreshToken) {
      throw new Error('Refresh token is required');
    }
    return await tokenService.refreshAccessToken(refreshToken);
  }

  /**
   * Get profile
   */
  async getProfile(userId) {
    const user = await this.userRepository.findUserById(userId);
    if (!user) {
      throw new Error('User not found');
    }
    return user;
  }

  /**
   * Update profile
   */
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

  /**
   * Change password
   */
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