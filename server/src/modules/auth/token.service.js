import jwt from 'jsonwebtoken';
import { jwtConfig } from '../auth/jwt.config.js';
import { User } from '../auth/models/user.model.js';

export class TokenService {

  generateAccessToken(user) {
    const payload = {
      id: user._id,
      email: user.email
    };

    return jwt.sign(payload, jwtConfig.access.secret, {
      expiresIn: jwtConfig.access.expiresIn
    });
  }

  generateRefreshToken(user) {
    const payload = {
      id: user._id
    };

    return jwt.sign(payload, jwtConfig.refresh.secret, {
      expiresIn: jwtConfig.refresh.expiresIn
    });
  }

  generateTokens(user) {
    return {
      accessToken: this.generateAccessToken(user),
      refreshToken: this.generateRefreshToken(user)
    };
  }

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

  async storeRefreshToken(userId, refreshToken) {
    await User.findByIdAndUpdate(userId, { refreshToken });
  }

  async revokeRefreshToken(userId) {
    await User.findByIdAndUpdate(userId, { refreshToken: null });
  }

  async refreshAccessToken(refreshToken) {
   
    const decoded = this.verifyRefreshToken(refreshToken);

    const user = await User.findById(decoded.id).select('+refreshToken');
    if (!user) {
      throw new Error('User not found');
    }

    if (!user.isActive) {
      throw new Error('Account is deactivated');
    }

    if (user.refreshToken !== refreshToken) {
      throw new Error('Invalid refresh token');
    }

    const tokens = this.generateTokens(user);

    user.refreshToken = tokens.refreshToken;
    await user.save();

    return tokens;
  }
}

export const tokenService = new TokenService();