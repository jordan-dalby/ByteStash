import Logger from '../logger.js';
import snippetRepository from '../repositories/snippetRepository.js';

class SnippetService {
  async getAllSnippets(userId) {
    try {
      Logger.debug('Service: Getting all snippets for user:', userId);
      const result = await snippetRepository.findAll(userId);
      Logger.debug(`Service: Retrieved ${result.length} snippets`);
      return result;
    } catch (error) {
      Logger.error('Service Error - getAllSnippets:', error);
      throw error;
    }
  }

  async getAllPublicSnippets() {
    try {
      Logger.debug('Service: Getting all public snippets');
      const result = await snippetRepository.findAllPublic();
      Logger.debug(`Service: Retrieved ${result.length} public snippets`);
      return result;
    } catch (error) {
      Logger.error('Service Error - getAllPublicSnippets:', error);
      throw error;
    }
  }

  async createSnippet(snippetData, userId) {
    try {
      Logger.debug('Service: Creating new snippet for user:', userId);
      const result = await snippetRepository.create({ 
        ...snippetData, 
        userId,
        isPublic: snippetData.is_public || 0 
      });
      Logger.debug('Service: Created snippet with ID:', result.id);
      return result;
    } catch (error) {
      Logger.error('Service Error - createSnippet:', error);
      throw error;
    }
  }

  async deleteSnippet(id, userId) {
    try {
      Logger.debug('Service: Deleting snippet:', id, 'for user:', userId);
      const result = await snippetRepository.delete(id, userId);
      Logger.debug('Service: Delete operation result:', result ? 'Success' : 'Not Found');
      return result;
    } catch (error) {
      Logger.error('Service Error - deleteSnippet:', error);
      throw error;
    }
  }

  async updateSnippet(id, snippetData, userId) {
    try {
      Logger.debug('Service: Updating snippet:', id, 'for user:', userId);
      const result = await snippetRepository.update(id, {
        ...snippetData,
        isPublic: snippetData.is_public || 0
      }, userId);
      Logger.debug('Service: Update operation result:', result ? 'Success' : 'Not Found');
      return result;
    } catch (error) {
      Logger.error('Service Error - updateSnippet:', error);
      throw error;
    }
  }

  async findById(id, userId = null) {
    try {
      Logger.debug('Service: Getting snippet:', id, userId != null ? `for user: ${userId}` : '(public access)');
      const result = await snippetRepository.findById(id, userId);
      Logger.debug('Service: Find by ID result:', result ? 'Found' : 'Not Found');
      return result;
    } catch (error) {
      Logger.error('Service Error - findById:', error);
      throw error;
    }
  }
}

export default new SnippetService();