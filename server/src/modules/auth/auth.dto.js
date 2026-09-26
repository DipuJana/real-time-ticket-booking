export class RegisterDto {
  constructor(data) {
    this.fullName = data.fullName?.trim();
    this.email = data.email?.trim().toLowerCase();
    this.password = data.password;
    this.phone = data.phone?.trim();
    this.role=data.role;
  }

  validate() {
    const errors = [];

    if (!this.fullName || this.fullName.length < 2) {
      errors.push('Full name must be at least 2 characters');
    }

    if (!this.email || !/^\S+@\S+\.\S+$/.test(this.email)) {
      errors.push('Valid email is required');
    }

    if (!this.password || this.password.length < 8) {
      errors.push('Password must be at least 8 characters');
    }

    return errors;
  }
}
export class LoginDto {
  constructor(data) {
    this.email = data.email?.trim().toLowerCase();
    this.password = data.password;
  }

  validate() {
    const errors = [];

    if (!this.email) errors.push('Email is required');
    if (!this.password) errors.push('Password is required');

    return errors;
  }
}

export class UpdateProfileDto {
  constructor(data) {
    this.fullName = data.fullName?.trim();
    this.phone = data.phone?.trim();
    this.role=data.role
  }

  validate() {
    const errors = [];

    if (this.fullName && this.fullName.length < 2) {
      errors.push('Name must be at least 2 characters');
    }

    return errors;
  }
}

export class ChangePasswordDto {
  constructor(data) {
    this.currentPassword = data.currentPassword;
    this.newPassword = data.newPassword;
    this.confirmPassword = data.confirmPassword;
  }

  validate() {
    const errors = [];

    if (!this.currentPassword) {
      errors.push('Current password is required');
    }

    if (!this.newPassword || this.newPassword.length < 8) {
      errors.push('New password must be at least 8 characters');
    }

    if (this.newPassword !== this.confirmPassword) {
      errors.push('Passwords do not match');
    }

    return errors;
  }
}

export class AuthResponseDto {
  constructor(user, tokens) {
    this.user = {
      id: user._id,
      fullName: user.fullName,
      email: user.email,
      phone: user.phone,
      role: user.role,
      isActive: user.isActive,
      createdAt: user.createdAt
    };
    this.tokens = tokens;
  }
}

export class TokenResponseDto {
  constructor(accessToken, refreshToken) {
    this.accessToken = accessToken;
    this.refreshToken = refreshToken;
    this.tokenType = 'Bearer';
  }
}

export class UpdateRoleDto {
  constructor(data) {
    this.role = data.role;
  }

  validate() {
    const errors = [];

    if (!this.role) {
      errors.push('Role is required');
    } else if (!['user', 'admin'].includes(this.role)) {
      errors.push('Role must be either "user" or "admin"');
    }

    return errors;
  }
}

export class ToggleStatusDto {
  constructor(data) {
    this.isActive = data.isActive;
  }

  validate() {
    const errors = [];

    if (typeof this.isActive !== 'boolean') {
      errors.push('isActive must be a boolean');
    }

    return errors;
  }
}