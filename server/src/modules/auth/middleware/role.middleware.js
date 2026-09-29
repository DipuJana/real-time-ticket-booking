export const ROLES = {
  USER: 'user',
  ADMIN: 'admin'
};

/**
 * Require specific role(s) — must be used AFTER `authenticate`
 *
 * @param  {...string} allowedRoles - Roles allowed (e.g. 'admin')
 * @returns {Function} Express middleware
 *
 * @example
 * router.get('/admin/users', authenticate, requireRole('admin'), handler);
 * router.get('/shared', authenticate, requireRole('admin', 'user'), handler);
 */
export const requireRole = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Insufficient permissions.'
      });
    }

    next();
  };
};

export const requireAdmin = requireRole('admin');
export const requireUser = requireRole('user', 'admin');