/**
 * LLM Caching Service
 * 
 * This service provides caching capabilities for LLM API calls
 * to reduce costs and improve response times.
 */

/**
 * Simple in-memory cache for LLM responses
 * with time-to-live (TTL) expiration
 */
class LLMCache {
  constructor(ttl = 24 * 60 * 60 * 1000) { // Default TTL: 24 hours
    this.cache = new Map();
    this.ttl = ttl;
    this.hits = 0;
    this.misses = 0;
    this.saves = 0;
  }

  /**
   * Generate a cache key from a prompt and model
   * @param {string} prompt - The prompt text
   * @param {string} model - The model name
   * @param {string} task - The task type
   * @returns {string} - The cache key
   */
  generateKey(prompt, model, task) {
    // Remove whitespace and normalize
    const normalizedPrompt = prompt.trim().replace(/\s+/g, ' ');
    
    // Use first 100 chars of prompt for the key
    const truncatedPrompt = normalizedPrompt.substring(0, 100);
    
    // Create a key combining model, task and truncated prompt
    return `${model}:${task}:${truncatedPrompt}`;
  }

  /**
   * Get an item from the cache
   * @param {string} prompt - The prompt text
   * @param {string} model - The model name
   * @param {string} task - The task type
   * @returns {string|null} - Cached response or null if not found/expired
   */
  get(prompt, model, task) {
    const key = this.generateKey(prompt, model, task);
    
    if (!this.cache.has(key)) {
      this.misses++;
      return null;
    }
    
    const { value, expiry } = this.cache.get(key);
    
    // Check if the cache entry has expired
    if (expiry < Date.now()) {
      this.cache.delete(key);
      this.misses++;
      return null;
    }
    
    this.hits++;
    return value;
  }

  /**
   * Store an item in the cache
   * @param {string} prompt - The prompt text
   * @param {string} model - The model name
   * @param {string} task - The task type
   * @param {string} value - The value to cache
   */
  set(prompt, model, task, value) {
    const key = this.generateKey(prompt, model, task);
    const expiry = Date.now() + this.ttl;
    
    this.cache.set(key, { value, expiry });
    this.saves++;
  }

  /**
   * Clear the entire cache
   */
  clear() {
    this.cache.clear();
  }

  /**
   * Get cache statistics
   */
  getStats() {
    const total = this.hits + this.misses;
    const hitRate = total > 0 ? (this.hits / total) * 100 : 0;
    
    return {
      hits: this.hits,
      misses: this.misses,
      saves: this.saves,
      total,
      hitRate: hitRate.toFixed(2),
      cacheSize: this.cache.size
    };
  }
}

// Export a singleton instance
const llmCache = new LLMCache();
module.exports = { llmCache };