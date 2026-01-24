import Logger from '../logger.js';

const adminUsernames = (process.env.ADMIN_USERNAMES || '')
  .split(',')
  .map(u => u.trim().toLowerCase())
  .filter(Boolean);

Logger.debug('Admin usernames configured:', adminUsernames.length > 0 ? adminUsernames : 'none');

export const requireAdmin = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ message: 'Authentication required' });
  }

  const isAdmin = adminUsernames.includes(req.user.username.toLowerCase());
  if (!isAdmin) {
    Logger.debug(`Admin access denied for user: ${req.user.username}`);
    return res.status(403).json({ message: 'Admin access required' });
  }

  Logger.debug(`Admin access granted for user: ${req.user.username}`);
  next();
};

export const isAdmin = (username) => {
  if (!username) return false;
  return adminUsernames.includes(username.toLowerCase());
};
