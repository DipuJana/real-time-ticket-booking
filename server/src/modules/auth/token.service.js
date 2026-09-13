import jwt from 'jsonwebtoken';
import { jwtConfig } from '../auth/jwt.config.js';
import { User } from '../auth/models/user.model.js';

export class TokenService {
  /**
   * Generate access token
   */
  generateAccessToken(user) {
    const payload = {
      id: user._id,
      email: user.email
    };

    return jwt.sign(payload, jwtConfig.access.secret, {
      expiresIn: jwtConfig.access.expiresIn
    });
  }

  /**
   * Generate refresh token
   */
  generateRefreshToken(user) {
    const payload = {
      id: user._id
    };

    return jwt.sign(payload, jwtConfig.refresh.secret, {
      expiresIn: jwtConfig.refresh.expiresIn
    });
  }

  /**
   * Generate both tokens
   */
  generateTokens(user) {
    return {
      accessToken: this.generateAccessToken(user),
      refreshToken: this.generateRefreshToken(user)
    };
  }

  /**
   * Verify access token
   */
  verifyAccessToken(token) {
    try {
      return jwt.verify(token, jwtConfig.access.secret);
    } catch (error) {
      if (error.name === 'TokenExpiredError') {
        throw new Error('Access token expired');
      }
      if (error.name === 'JsonWebTokenError') {
        throw new Error('Invalid access token');
      }
      throw error;
    }
  }

  /**
   * Verify refresh token
   */
  verifyRefreshToken(token) {
    try {
      return jwt.verify(token, jwtConfig.refresh.secret);
    } catch (error) {
      if (error.name === 'TokenExpiredError') {
        throw new Error('Refresh token expired');
      }
      if (error.name === 'JsonWebTokenError') {
        throw new Error('Invalid refresh token');
      }
      throw error;
    }
  }

  /**
   * Store refresh token in DB
   */
  async storeRefreshToken(userId, refreshToken) {
    await User.findByIdAndUpdate(userId, { refreshToken });
  }

  /**
   * Revoke refresh token
   */
  async revokeRefreshToken(userId) {
    await User.findByIdAndUpdate(userId, { refreshToken: null });
  }

  /**
   * Refresh access token using refresh token
   */
  async refreshAccessToken(refreshToken) {
    // 1. Verify refresh token
    const decoded = this.verifyRefreshToken(refreshToken);

    // 2. Find user
    const user = await User.findById(decoded.id).select('+refreshToken');
    if (!user) {
      throw new Error('User not found');
    }

    if (!user.isActive) {
      throw new Error('Account is deactivated');
    }

    // 3. Verify token matches stored one
    if (user.refreshToken !== refreshToken) {
      throw new Error('Invalid refresh token');
    }

    // 4. Generate new pair
    const tokens = this.generateTokens(user);

    // 5. Rotate refresh token in DB
    user.refreshToken = tokens.refreshToken;
    await user.save();

    return tokens;
  }
}

export const tokenService = new TokenService();