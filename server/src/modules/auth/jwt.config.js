export const jwtConfig = {
  access: {
    secret: process.env.JWT_ACCESS_SECRET || 'access-secret-change-me',
    expiresIn: process.env.JWT_ACCESS_EXPIRY || '15m'
  },
  refresh: {
    secret: process.env.JWT_REFRESH_SECRET || 'refresh-secret-change-me',
    expiresIn: process.env.JWT_REFRESH_EXPIRY || '7d'
  }
};