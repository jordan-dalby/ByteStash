import Logger from '../logger.js';
import userRepository from '../repositories/userRepository.js';

export const ADMIN_CLI_COMMAND = 'node src/scripts/admin.js grant <username>';

export const isAdmin = (user) => {
  if (!user || user.id === 0) return false;
  return user.is_admin === true || Number(user.is_admin) === 1;
};

export const requireAdmin = (req, res, next) => {
  if (!req.user?.username) {
    return res.status(401).json({ message: 'Authentication required' });
  }

  if (!isAdmin(req.user)) {
    Logger.debug(`Admin access denied for user: ${req.user.username}`);
    return res.status(403).json({ message: 'Admin access required' });
  }

  Logger.debug(`Admin access granted for user: ${req.user.username}`);
  next();
};

export async function checkAdminConfiguration({ disableAccounts }) {
  // ADMIN_USERNAMES used to grant admin to whoever held a listed username, which let anyone
  // take over an unclaimed name while sign-ups were open. It is ignored now; say so loudly,
  // because upgraded installs that relied on it have just lost their admins.
  if ((process.env.ADMIN_USERNAMES || '').trim()) {
    const rule = '='.repeat(78);
    Logger.warn(rule);
    Logger.warn('ADMIN_USERNAMES is no longer supported and is ignored. The users listed in it');
    Logger.warn('are NOT admins any more. Grant admin access by running this inside the container:');
    Logger.warn(`  ${ADMIN_CLI_COMMAND}`);
    Logger.warn('then remove ADMIN_USERNAMES from your configuration.');
    Logger.warn(rule);
  }

  if (disableAccounts) return;

  if ((await userRepository.listAdmins()).length === 0) {
    Logger.info(
      'No admin accounts yet. To make an existing account an admin, run this inside the container: ' +
      ADMIN_CLI_COMMAND
    );
  }
}
