/**
 * Test helpers and utilities for llmenv CLI testing
 * 
 * This module provides reusable test utilities including:
 * - Temporary directory management
 * - Sample configuration fixtures
 * - Mock API response helpers
 */

// Export all temp directory helpers
export {
  createTempDir,
  cleanupTempDir,
  withTempDir,
  setupTempLLMEnvHome,
  createNestedDirs,
  createTempFile,
  createTempJsonFile,
} from './temp-dir.js';

// Export all fixture helpers
export {
  sampleGlobalIdentities,
  sampleProfiles,
  sampleProjects,
  samplePins,
  sampleAISettings,
  sampleProjectEntries,
  sampleHistoryEntries,
  createGlobalIdentity,
  createProfile,
  createProjectConfig,
  createPin,
  createPins,
  createProjectEntry,
  createHistoryEntry,
} from './fixtures.js';

// Export all mock API helpers
export {
  createMockOpenAIResponse,
  createMockClaudeResponse,
  createMockErrorResponse,
  createMockUnauthorizedResponse,
  createMockRateLimitResponse,
  createMockNetworkError,
  createMockTimeoutError,
  createMockOpenAIFetch,
  createMockClaudeFetch,
  createMockAIFetch,
  createMockAIResponse,
  createMockDelayedFetch,
  createMockFailAfterNFetch,
  createMockTrackedFetch,
  validateOpenAIRequest,
  validateClaudeRequest,
  extractPromptFromRequest,
} from './mock-api.js';

export type { MockFetchTracker } from './mock-api.js';
