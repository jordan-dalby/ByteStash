import Logger from '../logger.js';
import { validateApiKey } from '../repositories/apiKeyRepository.js';

export function authenticateApiKey(req, res, next) {
  const apiKey = req.headers['x-api-key'];
  
  if (!apiKey) {
    return next();
  }
  
  try {
    const result = validateApiKey(apiKey);
    
    if (result) {
      req.user = { id: result.userId };
      req.apiKey = { id: result.keyId };
      Logger.debug(`Request authenticated via API key ${result.keyId}`);
      return next();
    }
    
    // Invalid API key
    Logger.info('Invalid API key provided');
    res.status(401).json({ error: 'Invalid API key' });
  } catch (error) {
    Logger.error('Error validating API key:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}
