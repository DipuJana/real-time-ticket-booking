import { UserRepository } from '../auth/user.repository.js';

const HARD_CODED_ADMIN = {
  fullName: 'System Admin',
  email: 'admin@example.com',
  password: 'AdminPass123',
  role: 'admin'
};

export async function ensureHardCodedAdmin() {
  try {
    const userRepository = new UserRepository();
    const { email, password, fullName, role } = HARD_CODED_ADMIN;

    const existing = await userRepository.findUserByEmail(email);

    if (existing && existing.role === 'admin') {
      console.log(`Admin ready: ${email}`);
      return;
    }

    if (existing) {
      await userRepository.updateUser(existing._id, { role: 'admin' });
      return;
    }

    await userRepository.createUser({
      fullName,
      email,
      passwordHash: password, 
      role
    });
    console.log(`   Email:    ${email}`);
    console.log(`   Password: ${password}`);
  } catch (error) {
    console.error(' Failed to admin login:', error.message);
  }
}