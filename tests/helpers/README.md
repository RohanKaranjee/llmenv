# Test Helpers

This directory contains reusable test utilities for the llmenv CLI test suite.

## Overview

The test helpers are organized into three main categories:

1. **Temporary Directory Management** (`temp-dir.ts`) - Utilities for creating and managing temporary directories during tests
2. **Sample Fixtures** (`fixtures.ts`) - Pre-configured sample data for testing
3. **Mock API Helpers** (`mock-api.ts`) - Mock responses for AI API testing

## Usage

Import helpers from the index file:

```typescript
import {
  createTempDir,
  cleanupTempDir,
  sampleGlobalIdentities,
  createMockOpenAIResponse,
} from '../helpers/index.js';
```

## Temporary Directory Management

### `createTempDir(prefix?: string): Promise<string>`

Creates a temporary directory for testing.

```typescript
const tempDir = await createTempDir('my-test');
// Use tempDir...
await cleanupTempDir(tempDir);
```

### `cleanupTempDir(dirPath: string): Promise<void>`

Removes a temporary directory and all its contents.

```typescript
await cleanupTempDir(tempDir);
```

### `withTempDir(prefix?: string): Promise<[string, () => Promise<void>]>`

Creates a temporary directory with automatic cleanup function.

```typescript
const [tempDir, cleanup] = await withTempDir();
// Use tempDir...
await cleanup();
```

### `setupTempLLMEnvHome(): Promise<[string, () => Promise<void>]>`

Sets up `LLMENV_HOME` environment variable to point to a temporary directory. Automatically restores the original value on cleanup.

```typescript
const [tempHome, cleanup] = await setupTempLLMEnvHome();
// LLMENV_HOME is now set to tempHome
// Run tests...
await cleanup(); // Restores original LLMENV_HOME
```

### `createNestedDirs(baseDir: string, depth: number): Promise<string>`

Creates a nested directory structure for testing auto-detection.

```typescript
const deepPath = await createNestedDirs(tempDir, 3);
// Creates: tempDir/level0/level1/level2
```

### `createTempFile(dirPath: string, filePath: string, content: string): Promise<string>`

Creates a file with content in a temporary directory.

```typescript
await createTempFile(tempDir, 'config/settings.txt', 'content');
```

### `createTempJsonFile(dirPath: string, filePath: string, data: any): Promise<string>`

Creates a JSON file in a temporary directory.

```typescript
await createTempJsonFile(tempDir, 'config.json', { name: 'test' });
```

## Sample Fixtures

### Global Identities

```typescript
import { sampleGlobalIdentities, createGlobalIdentity } from '../helpers/index.js';

// Use predefined samples
const identity = sampleGlobalIdentities.developer();
const defaultIdentity = sampleGlobalIdentities.default();

// Create custom identity with overrides
const customIdentity = createGlobalIdentity({
  name: 'Custom Name',
  role: 'Custom Role',
});
```

Available samples:
- `default()` - Empty default identity
- `developer()` - Full-stack developer identity
- `senior()` - Senior engineer identity
- `junior()` - Junior developer identity

### Profiles

```typescript
import { sampleProfiles, createProfile } from '../helpers/index.js';

// Use predefined samples
const workProfile = sampleProfiles.work();
const buildProfile = sampleProfiles.build();

// Create custom profile
const customProfile = createProfile({
  name: 'custom',
  focus: 'Custom focus',
});
```

Available samples:
- `work()` - Production code profile
- `build()` - Side projects profile
- `personal()` - Learning profile
- `learn()` - Tutorials profile

### Project Configurations

```typescript
import { sampleProjects, createProjectConfig } from '../helpers/index.js';

// Use predefined samples
const project = sampleProjects.fullStack();
const simple = sampleProjects.simple();

// Create custom project
const customProject = createProjectConfig({
  project: 'My Project',
  stack: ['Node.js', 'React'],
});
```

Available samples:
- `simple()` - Simple Node.js project
- `fullStack()` - Full-stack SaaS project
- `enterprise()` - Enterprise CRM project
- `mobile()` - Mobile app project
- `minimal()` - Minimal project

### Pins

```typescript
import { samplePins, createPin, createPins } from '../helpers/index.js';

// Use predefined samples
const pin = samplePins.single();
const pins = samplePins.multiple(); // Returns 3 pins

// Create custom pin
const customPin = createPin({
  fact: 'Custom fact',
});

// Create multiple pins
const multiplePins = createPins(5, 'Test'); // Creates 5 pins: "Test 1", "Test 2", etc.
```

### AI Settings

```typescript
import { sampleAISettings } from '../helpers/index.js';

const openaiSettings = sampleAISettings.openai();
const claudeSettings = sampleAISettings.claude();
```

### Project Registry Entries

```typescript
import { sampleProjectEntries, createProjectEntry } from '../helpers/index.js';

const entry = sampleProjectEntries.single();
const entries = sampleProjectEntries.multiple(); // Returns 3 entries
```

### History Entries

```typescript
import { sampleHistoryEntries, createHistoryEntry } from '../helpers/index.js';

const entry = sampleHistoryEntries.single();
const entries = sampleHistoryEntries.multiple(); // Returns 3 entries
```

## Mock API Helpers

### Mock Responses

```typescript
import {
  createMockOpenAIResponse,
  createMockClaudeResponse,
  createMockErrorResponse,
} from '../helpers/index.js';

// Create mock OpenAI response
const openaiResponse = createMockOpenAIResponse('Test response');

// Create mock Claude response
const claudeResponse = createMockClaudeResponse('Test response');

// Create error response
const errorResponse = createMockErrorResponse(500, 'Server Error', 'Error message');
```

### Mock Fetch Functions

```typescript
import {
  createMockOpenAIFetch,
  createMockClaudeFetch,
  createMockAIFetch,
} from '../helpers/index.js';

// Mock fetch for OpenAI
const mockFetch = createMockOpenAIFetch('Response content');

// Mock fetch for Claude
const mockFetch = createMockClaudeFetch('Response content');

// Mock fetch that routes to both providers
const mockFetch = createMockAIFetch('OpenAI response', 'Claude response');
```

### Advanced Mock Fetch

```typescript
import {
  createMockDelayedFetch,
  createMockFailAfterNFetch,
  createMockTrackedFetch,
} from '../helpers/index.js';

// Mock with delay
const delayedFetch = createMockDelayedFetch(100); // 100ms delay

// Mock that fails after N calls
const failingFetch = createMockFailAfterNFetch(3); // Succeeds 3 times, then fails

// Mock that tracks calls
const { fetch, calls, reset } = createMockTrackedFetch();
await fetch('https://api.openai.com/v1/chat/completions', {});
console.log(calls); // Array of all calls made
reset(); // Clear call history
```

### Request Validation

```typescript
import {
  validateOpenAIRequest,
  validateClaudeRequest,
  extractPromptFromRequest,
} from '../helpers/index.js';

// Validate OpenAI request headers
const isValid = validateOpenAIRequest(init, 'api-key');

// Validate Claude request headers
const isValid = validateClaudeRequest(init, 'api-key');

// Extract prompt from request body
const prompt = extractPromptFromRequest(init);
```

## Example Test Pattern

Here's a complete example of using the helpers in a test:

```typescript
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import {
  setupTempLLMEnvHome,
  createTempJsonFile,
  sampleGlobalIdentities,
  sampleProfiles,
  createMockOpenAIFetch,
} from '../helpers/index.js';

describe('My Feature', () => {
  let tempHome: string;
  let cleanup: () => Promise<void>;

  beforeEach(async () => {
    // Set up temporary LLMENV_HOME
    [tempHome, cleanup] = await setupTempLLMEnvHome();

    // Create sample config files
    await createTempJsonFile(
      tempHome,
      'default.json',
      sampleGlobalIdentities.developer()
    );
    await createTempJsonFile(
      tempHome,
      'profiles/work.json',
      sampleProfiles.work()
    );
  });

  afterEach(async () => {
    await cleanup();
  });

  it('should do something', async () => {
    // Test implementation
    expect(true).toBe(true);
  });
});
```

## Best Practices

1. **Always clean up temporary directories** - Use `afterEach` hooks to ensure cleanup
2. **Use `setupTempLLMEnvHome` for config tests** - Automatically manages LLMENV_HOME
3. **Prefer fixtures over manual data creation** - Use sample fixtures for consistency
4. **Use mock API helpers for AI integration tests** - Avoid real API calls in tests
5. **Track mock calls when needed** - Use `createMockTrackedFetch` to verify API interactions

## Testing the Helpers

The helpers themselves are tested in `helpers.test.ts`. Run the tests with:

```bash
npm test -- tests/helpers/helpers.test.ts
```
