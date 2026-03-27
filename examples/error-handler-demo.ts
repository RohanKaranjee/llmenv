/**
 * Demo script to showcase the error handler functionality
 * Run with: npx tsx examples/error-handler-demo.ts
 */

import { handleError } from '../src/utils/error-handler.js';
import {
  ConfigError,
  ValidationError,
  APIError,
  ProjectNotFoundError,
} from '../src/types/errors.js';

// Uncomment one of the following to test different error types:

// Test ConfigError
// handleError(new ConfigError('Failed to read configuration file', '/path/to/config.json'));

// Test ValidationError
// handleError(new ValidationError('Project name cannot be empty', 'projectName'));

// Test APIError with 401
// handleError(new APIError('Invalid API key', 'openai', 401));

// Test APIError with 429
// handleError(new APIError('Rate limit exceeded', 'claude', 429));

// Test ProjectNotFoundError
// handleError(new ProjectNotFoundError());

// Test generic Error
// handleError(new Error('Something went wrong'));

console.log('Uncomment one of the error examples above to test the error handler');
