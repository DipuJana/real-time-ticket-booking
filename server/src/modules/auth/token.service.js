import jwt from 'jsonwebtoken';
import { jwtConfig } from '../auth/jwt.config.js';
import { User } from '../auth/models/user.model.js';

export class TokenService {
  
  generateAccessToken(user) {
    const payload = {
      id: user._id.toString(),
      email: user.email,
      role: user.role  
    };

    return jwt.sign(payload, jwtConfig.access.secret, {
      expiresIn: jwtConfig.access.expiresIn
    });
  }

  generateRefreshToken(user) {
    const payload = {
      id: user._id.toString()
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
        const err = new Error('Access token expired');
        err.statusCode = 401;
        throw err;
      }
      if (error.name === 'JsonWebTokenError') {
        const err = new Error('Invalid access token');
        err.statusCode = 401;
        throw err;
      }
      throw error;
    }
  }

  verifyRefreshToken(token) {
    try {
      return jwt.verify(token, jwtConfig.refresh.secret);
    } catch (error) {
      if (error.name === 'TokenExpiredError') {
        const err = new Error('Refresh token expired');
        err.statusCode = 401;
        throw err;
      }
      if (error.name === 'JsonWebTokenError') {
        const err = new Error('Invalid refresh token');
        err.statusCode = 401;
        throw err;
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
      const error = new Error('User not found');
      error.statusCode = 401;
      throw error;
    }

    if (!user.isActive) {
      const error = new Error('Account is deactivated');
      error.statusCode = 403;
      throw error;
    }

    if (user.refreshToken !== refreshToken) {
      const error = new Error('Invalid refresh token');
      error.statusCode = 401;
      throw error;
    }

    const tokens = this.generateTokens(user);

    user.refreshToken = tokens.refreshToken;
    await user.save();

    return tokens;
  }
}

export const tokenService = new TokenService();