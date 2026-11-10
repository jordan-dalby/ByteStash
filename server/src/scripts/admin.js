// Manage admin access from inside the container, e.g.
//   docker compose exec server node src/scripts/admin.js grant <username>
// This is the trusted way to create the first admin: it needs shell access to the
// container, not just network access to the app.

const USAGE = `Usage: node src/scripts/admin.js <command> [username]

Commands:
  grant <username>   Give an existing account admin access
  revoke <username>  Remove admin access from an account
  list               List accounts with admin access`;

// DEBUG=true would log every SQL statement and bury the output. Logger reads it on import,
// so set it before loading anything that uses it.
process.env.DEBUG = 'false';

const { initializeDatabase, shutdownDatabase } = await import('../config/database.js');
const { getPostgresConfig } = await import('../config/postgresConfig.js');
const { sqliteDatabaseExists } = await import('../config/sqlite.js');
const { default: userRepository } = await import('../repositories/userRepository.js');
const { isAdmin } = await import('../middleware/adminAuth.js');

function fail(message, code = 1) {
  console.error(message);
  process.exitCode = code;
}

async function findUser(username) {
  const user = username ? await userRepository.findByUsername(username) : null;
  if (!user || user.id === 0) {
    fail(`No account named "${username}" exists. Register it first, then run this command again.`);
    return null;
  }
  return user;
}

async function grant(username) {
  const user = await findUser(username);
  if (!user) return;

  if (isAdmin(user)) {
    console.log(`"${user.username}" is already an admin.`);
    return;
  }

  await userRepository.setAdmin(user.id, true);
  console.log(`"${user.username}" is now an admin. They may need to sign out and back in to see the admin panel.`);

  if (user.is_active === 0 || user.is_active === false) {
    console.log(`Note: "${user.username}" is deactivated and cannot sign in until reactivated.`);
  }
  if (process.env.DISABLE_ACCOUNTS === 'true') {
    console.log('Note: DISABLE_ACCOUNTS is true, so nobody can sign in to use the admin panel.');
  }
}

async function revoke(username) {
  const user = await findUser(username);
  if (!user) return;

  if (!isAdmin(user)) {
    console.log(`"${user.username}" is not an admin.`);
    return;
  }

  await userRepository.setAdmin(user.id, false);
  console.log(`Removed admin access from "${user.username}".`);
}

async function list() {
  const admins = await userRepository.listAdmins();

  if (admins.length === 0) {
    console.log('No admin accounts. Grant one with: node src/scripts/admin.js grant <username>');
    return;
  }

  for (const admin of admins) {
    const notes = [
      admin.oidc_id ? 'single sign-on' : null,
      admin.is_active === 0 || admin.is_active === false ? 'deactivated' : null,
    ].filter(Boolean);
    console.log(`${admin.username}${notes.length ? ` (${notes.join(', ')})` : ''}`);
  }
}

async function main() {
  const [command, username, ...rest] = process.argv.slice(2);
  const commands = { grant, revoke, list };
  const needsUsername = command === 'grant' || command === 'revoke';

  if (!commands[command] || (needsUsername && !username) || (!needsUsername && username) || rest.length > 0) {
    return fail(USAGE, 2);
  }

  if (!getPostgresConfig() && !sqliteDatabaseExists()) {
    return fail('No ByteStash database found. Start ByteStash once and create an account first.');
  }

  await initializeDatabase({ backup: false });
  try {
    await commands[command](username);
  } finally {
    await shutdownDatabase();
  }
}

main().catch((error) => {
  console.error('Error:', error.message);
  process.exit(1);
});
