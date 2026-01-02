/**
 * Utility functions for generating unique React keys
 */

/**
 * Generate a unique key for React components to prevent duplicate key warnings
 * @param {string} baseId - The base ID (usually from database)
 * @param {number} index - The array index
 * @param {string} prefix - Optional prefix to distinguish different types
 * @param {string} suffix - Optional suffix for additional uniqueness
 * @returns {string} - Unique key string
 */
export const generateUniqueKey = (baseId, index, prefix = '', suffix = '') => {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substr(2, 9);
  
  return [
    prefix,
    baseId || 'unknown',
    index,
    suffix,
    random
  ].filter(Boolean).join('-');
};

/**
 * Generate a simple unique key using baseId and index
 * @param {string} baseId - The base ID
 * @param {number} index - The array index
 * @returns {string} - Simple unique key
 */
export const simpleUniqueKey = (baseId, index) => {
  return `${baseId || 'item'}-${index}-${Math.random().toString(36).substr(2, 5)}`;
};

/**
 * Deduplicate array by ID field
 * @param {Array} items - Array of items to deduplicate
 * @param {string} idField - Field to use for deduplication (default: 'id')
 * @returns {Array} - Deduplicated array
 */
export const deduplicateById = (items, idField = 'id') => {
  if (!Array.isArray(items)) return [];
  
  const seen = new Set();
  return items.filter(item => {
    const id = item[idField];
    if (seen.has(id)) {
      console.warn(`Duplicate ${idField} detected and removed:`, id);
      return false;
    }
    seen.add(id);
    return true;
  });
};

/**
 * Safe key generator that handles null/undefined IDs
 * @param {Object} item - The item object
 * @param {number} index - Array index
 * @param {string} fallbackPrefix - Prefix to use when ID is missing
 * @returns {string} - Safe unique key
 */
export const safeKey = (item, index, fallbackPrefix = 'item') => {
  if (!item) return `${fallbackPrefix}-${index}`;
  
  const id = item.id || item._id || item.key;
  if (!id) return `${fallbackPrefix}-${index}`;
  
  return `${id}-${index}`;
};