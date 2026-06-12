import Logger from '../logger.js';
import { validateApiKey } from '../repositories/apiKeyRepository.js';
import { DISABLE_ACCOUNTS, getOrCreateAnonymousUser } from './auth.js';

/*
 * Authentication for the MCP endpoint.
 *
 * MCP is consumed by external AI clients (Claude desktop/web, OpenAI, Perplexity),
 * which authenticate to remote servers with a bearer token. To "use the same token
 * as the API" we accept a ByteStash API key in either of two ways:
 *
 *   - Authorization: Bearer <api-key>   (the convention every remote MCP client supports)
 *   - x-api-key: <api-key>              (the header the existing ByteStash REST API uses)
 *
 * The key is validated against the same store as the REST API (api_keys table), so a
 * key minted in the ByteStash UI works for both the API and MCP without any extra config.
 *
 * When the instance runs with DISABLE_ACCOUNTS=true there are no real users or keys, so
 * we fall back to the shared anonymous user, mirroring the behaviour of authenticateToken.
 */
function extractApiKey(req) {
  const authHeader = req.headers['authorization'];
  if (authHeader && authHeader.toLowerCase().startsWith('bearer ')) {
    return authHeader.slice(7).trim();
  }

  const apiKeyHeader = req.headers['x-api-key'];
  if (apiKeyHeader) {
    return apiKeyHeader.trim();
  }

  return null;
}

function unauthorized(res, message) {
  res
    .status(401)
    .set('WWW-Authenticate', 'Bearer realm="ByteStash MCP", error="invalid_token"')
    .json({
      jsonrpc: '2.0',
      error: { code: -32001, message },
      id: null,
    });
}

export async function authenticateMcp(req, res, next) {
  const apiKey = extractApiKey(req);

  if (!apiKey) {
    if (DISABLE_ACCOUNTS) {
      try {
        const anonymousUser = await getOrCreateAnonymousUser();
        req.user = anonymousUser;
        return next();
      } catch (error) {
        Logger.error('Error in anonymous MCP authentication:', error);
        return res.status(500).json({
          jsonrpc: '2.0',
          error: { code: -32603, message: 'Internal server error' },
          id: null,
        });
      }
    }

    return unauthorized(res, 'Missing API key. Provide it as "Authorization: Bearer <key>" or the "x-api-key" header.');
  }

  try {
    const result = validateApiKey(apiKey);

    if (result) {
      req.user = { id: result.userId };
      req.apiKey = { id: result.keyId };
      Logger.debug(`MCP request authenticated via API key ${result.keyId}`);
      return next();
    }

    Logger.info('Invalid API key provided to MCP endpoint');
    return unauthorized(res, 'Invalid API key');
  } catch (error) {
    Logger.error('Error validating API key for MCP:', error);
    return res.status(500).json({
      jsonrpc: '2.0',
      error: { code: -32603, message: 'Internal server error' },
      id: null,
    });
  }
}
