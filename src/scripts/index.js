/**
 * Scripts Index
 * Main entry point for all scripts
 * 
 * @version 1.0.0
 */

// Export main app
export { default as app } from './application.js';

// Export page modules
export * from './pages/index.js';

// Export utilities (re-export for convenience)
export * from '../utils/utility-functions.js';
