import { tokenService } from '../token.service.js';
import {User} from "../models/user.model.js"
export const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: 'Authentication token required'
      });
    }

    const token = authHeader.split(' ')[1];

    let decoded;
    try {
      decoded = tokenService.verifyAccessToken(token);
    } catch (error) {
      return res.status(401).json({
        success: false,
        message: error.message || 'Invalid token'
      });
    }

    const user = await User.findById(decoded.id)
      .select('-passwordHash -refreshToken')
      .lean();

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'User not found'
      });
    }

    if (!user.isActive) {
      return res.status(403).json({
        success: false,
        message: 'Account is deactivated'
      });
    }

    req.user = {
      id: user._id.toString(),
      email: user.email,
      fullName: user.fullName
    };

    next();
  } catch (error) {
    console.error('Auth middleware error:', error);
    return res.status(500).json({
      success: false,
      message: 'Authentication failed'
    });
  }
};

/**
 * Optional authentication - attaches user if token exists
 */
export const optionalAuthenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.split(' ')[1];

      try {
        const decoded = tokenService.verifyAccessToken(token);
        const user = await User.findById(decoded.id)
          .select('-passwordHash -refreshToken')
          .lean();

        if (user && user.isActive) {
          req.user = {
            id: user._id.toString(),
            email: user.email,
            fullName: user.fullName
          };
        }
      } catch (error) {
        // Token invalid - proceed without user
      }
    }

    next();
  } catch (error) {
    console.error('Optional auth middleware error:', error);
    next();
  }
};