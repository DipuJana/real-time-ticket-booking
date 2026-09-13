export class AuthController {
  constructor(authService) {
    this.authService = authService;
  }

  async register(req, res) {
    try {
      console.log("welcome");
      const result = await this.authService.register(req.body);
      console.log("welcome");
      return res.status(201).json({
        success: true,
        data: result,
        message: 'User registered successfully'
      });
    } catch (error) {
      return this.handleError(res, error);
    }
  }

  async login(req, res) {
    try {
      const result = await this.authService.login(req.body);
      return res.status(200).json({
        success: true,
        data: result,
        message: 'Login successful'
      });
    } catch (error) {
      return this.handleError(res, error);
    }
  }

  async logout(req, res) {
    try {
      const result = await this.authService.logout(req.user.id);
      return res.status(200).json({ success: true, ...result });
    } catch (error) {
      return this.handleError(res, error);
    }
  }

  async refreshToken(req, res) {
    try {
      const { refreshToken } = req.body;
      const tokens = await this.authService.refreshToken(refreshToken);
      return res.status(200).json({
        success: true,
        data: tokens,
        message: 'Tokens refreshed successfully'
      });
    } catch (error) {
      return this.handleError(res, error);
    }
  }

  async getProfile(req, res) {
    try {
      const profile = await this.authService.getProfile(req.user.id);
      return res.status(200).json({ success: true, data: profile });
    } catch (error) {
      return this.handleError(res, error);
    }
  }

  async updateProfile(req, res) {
    try {
      const updated = await this.authService.updateProfile(req.user.id, req.body);
      return res.status(200).json({
        success: true,
        data: updated,
        message: 'Profile updated successfully'
      });
    } catch (error) {
      return this.handleError(res, error);
    }
  }

  async changePassword(req, res) {
    try {
      const result = await this.authService.changePassword(req.user.id, req.body);
      return res.status(200).json({ success: true, ...result });
    } catch (error) {
      return this.handleError(res, error);
    }
  }

  handleError(res, error) {
    console.error('Auth error:', error.message);

    if (error.message.includes('already exists')) {
      return res.status(409).json({ success: false, message: error.message });
    }

    if (error.message.includes('Invalid email or password')) {
      return res.status(401).json({ success: false, message: error.message });
    }

    if (error.message.includes('Current password is incorrect')) {
      return res.status(401).json({ success: false, message: error.message });
    }

    if (error.message.includes('expired')) {
      return res.status(401).json({ success: false, message: error.message });
    }

    if (error.message.includes('not found')) {
      return res.status(404).json({ success: false, message: error.message });
    }

    if (
      error.message.includes('required') ||
      error.message.includes('must be') ||
      error.message.includes('Invalid')
    ) {
      return res.status(400).json({ success: false, message: error.message });
    }

    return res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
}