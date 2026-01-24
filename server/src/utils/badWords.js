import { Filter } from 'bad-words';
import Logger from '../logger.js';

class BadWordsChecker {
  constructor() {
    this.filter = new Filter();
    Logger.info(`Bad words filter initialized with ${this.filter.list.length} words`);
  }

  containsBadWords(text) {
    if (!text) {
      return false;
    }

    return this.filter.isProfane(text);
  }

  findBadWords(text) {
    if (!text) {
      return [];
    }

    const found = new Set();
    const lowerText = text.toLowerCase();

    // Check each word in the filter's list
    for (const badWord of this.filter.list) {
      // Use word boundaries to match whole words only
      const regex = new RegExp(`\\b${this.escapeRegex(badWord)}\\b`, 'i');
      if (regex.test(lowerText)) {
        found.add(badWord);
      }
    }

    return Array.from(found);
  }

  escapeRegex(string) {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }

  // Optional: Add custom words to the filter
  addWords(...words) {
    this.filter.addWords(...words);
    Logger.info(`Added ${words.length} custom words to filter`);
  }

  // Optional: Remove words from the filter
  removeWords(...words) {
    this.filter.removeWords(...words);
    Logger.info(`Removed ${words.length} words from filter`);
  }
}

export default new BadWordsChecker();
