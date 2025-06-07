import Logger from '../logger.js';
import userRepository from '../repositories/userRepository.js';

class UserService {
  async createUser(username, password) {
    try {
      if (!username || username.length < 3 || username.length > 30) {
        throw new Error('Username must be between 3 and 30 characters');
      }

      if (!password || password.length < 8) {
        throw new Error('Password must be at least 8 characters');
      }

      if (!/^[a-zA-Z0-9_-]+$/.test(username)) {
        throw new Error('Username can only contain letters, numbers, underscores, and hyphens');
      }

      const existing = await userRepository.findByUsername(username);
      if (existing) {
        throw new Error('Username already exists');
      }

      return await userRepository.create(username, password);
    } catch (error) {
      Logger.error('Service Error - createUser:', error);
      throw error;
    }
  }

  async validateUser(username, password) {
    try {
      const user = await userRepository.findByUsername(username);
      if (!user) {
        return null;
      }

      const isValid = await userRepository.verifyPassword(user, password);
      if (!isValid) {
        return null;
      }

      const { password_hash, ...userWithoutPassword } = user;
      return userWithoutPassword;
    } catch (error) {
      Logger.error('Service Error - validateUser:', error);
      throw error;
    }
  }

  async findById(id) {
    try {
      return await userRepository.findById(id);
    } catch (error) {
      Logger.error('Service Error - findById:', error);
      throw error;
    }
  }

  async changePassword(userId, currentPassword, newPassword) {
    try {
      // Validate new password
      if (!newPassword || newPassword.length < 8) {
        throw new Error('New password must be at least 8 characters');
      }

      // Get user to verify current password
      const user = await userRepository.findByIdWithPassword(userId);
      if (!user) {
        throw new Error('User not found');
      }

      // Verify current password
      const isCurrentPasswordValid = await userRepository.verifyPassword(user, currentPassword);
      if (!isCurrentPasswordValid) {
        throw new Error('Current password is incorrect');
      }

      // Update password
      return await userRepository.updatePassword(userId, newPassword);
    } catch (error) {
      Logger.error('Service Error - changePassword:', error);
      throw error;
    }
  }
}

export default new UserService();