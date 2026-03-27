import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import path from 'path';
import fs from 'fs/promises';
import {
  createTempDir,
  cleanupTempDir,
  withTempDir,
  setupTempLLMEnvHome,
  createNestedDirs,
  createTempFile,
  createTempJsonFile,
  sampleGlobalIdentities,
  sampleProfiles,
  sampleProjects,
  samplePins,
  createGlobalIdentity,
  createProfile,
  createProjectConfig,
  createPin,
  createPins,
  createMockOpenAIResponse,
  createMockClaudeResponse,
  createMockErrorResponse,
  createMockAIFetch,
  validateOpenAIRequest,
  validateClaudeRequest,
} from './index.js';

describe('Test Helpers - Temporary Directory Management', () => {
  describe('createTempDir', () => {
    let tempDir: string;

    afterEach(async () => {
      if (tempDir) {
        await cleanupTempDir(tempDir);
      }
    });

    it('should create a temporary directory', async () => {
      tempDir = await createTempDir();
      const stats = await fs.stat(tempDir);
      expect(stats.isDirectory()).toBe(true);
    });

    it('should create directory with custom prefix', async () => {
      tempDir = await createTempDir('custom-prefix');
      expect(tempDir).toContain('custom-prefix');
    });

    it('should create unique directories on multiple calls', async () => {
      const dir1 = await createTempDir();
      const dir2 = await createTempDir();
      expect(dir1).not.toBe(dir2);
      await cleanupTempDir(dir1);
      await cleanupTempDir(dir2);
    });
  });

  describe('withTempDir', () => {
    it('should create temp directory and provide cleanup function', async () => {
      const [tempDir, cleanup] = await withTempDir();
      
      const stats = await fs.stat(tempDir);
      expect(stats.isDirectory()).toBe(true);
      
      await cleanup();
      
      // Directory should be removed
      await expect(fs.stat(tempDir)).rejects.toThrow();
    });
  });

  describe('setupTempLLMEnvHome', () => {
    let originalEnv: string | undefined;

    beforeEach(() => {
      originalEnv = process.env.LLMENV_HOME;
    });

    it('should set LLMENV_HOME to temp directory', async () => {
      const [tempDir, cleanup] = await setupTempLLMEnvHome();
      
      expect(process.env.LLMENV_HOME).toBe(tempDir);
      
      await cleanup();
      
      // Should restore original value
      expect(process.env.LLMENV_HOME).toBe(originalEnv);
    });
  });

  describe('createNestedDirs', () => {
    let tempDir: string;

    beforeEach(async () => {
      tempDir = await createTempDir();
    });

    afterEach(async () => {
      await cleanupTempDir(tempDir);
    });

    it('should create nested directory structure', async () => {
      const deepPath = await createNestedDirs(tempDir, 3);
      
      const stats = await fs.stat(deepPath);
      expect(stats.isDirectory()).toBe(true);
      expect(deepPath).toContain('level0');
      expect(deepPath).toContain('level1');
      expect(deepPath).toContain('level2');
    });

    it('should handle depth of 0', async () => {
      const result = await createNestedDirs(tempDir, 0);
      expect(result).toBe(tempDir);
    });
  });

  describe('createTempFile', () => {
    let tempDir: string;

    beforeEach(async () => {
      tempDir = await createTempDir();
    });

    afterEach(async () => {
      await cleanupTempDir(tempDir);
    });

    it('should create file with content', async () => {
      const filePath = await createTempFile(tempDir, 'test.txt', 'Hello World');
      
      const content = await fs.readFile(filePath, 'utf-8');
      expect(content).toBe('Hello World');
    });

    it('should create parent directories', async () => {
      const filePath = await createTempFile(tempDir, 'nested/deep/file.txt', 'content');
      
      const content = await fs.readFile(filePath, 'utf-8');
      expect(content).toBe('content');
    });
  });

  describe('createTempJsonFile', () => {
    let tempDir: string;

    beforeEach(async () => {
      tempDir = await createTempDir();
    });

    afterEach(async () => {
      await cleanupTempDir(tempDir);
    });

    it('should create JSON file with data', async () => {
      const data = { name: 'test', value: 42 };
      const filePath = await createTempJsonFile(tempDir, 'data.json', data);
      
      const content = await fs.readFile(filePath, 'utf-8');
      const parsed = JSON.parse(content);
      expect(parsed).toEqual(data);
    });
  });
});

describe('Test Helpers - Fixtures', () => {
  describe('Sample Global Identities', () => {
    it('should provide default global identity', () => {
      const identity = sampleGlobalIdentities.default();
      expect(identity).toHaveProperty('name');
      expect(identity).toHaveProperty('role');
      expect(identity).toHaveProperty('experience');
      expect(identity).toHaveProperty('preferences');
      expect(identity).toHaveProperty('communication');
    });

    it('should provide developer global identity', () => {
      const identity = sampleGlobalIdentities.developer();
      expect(identity.name).toBe('John Doe');
      expect(identity.role).toBe('Full-stack Developer');
    });
  });

  describe('Sample Profiles', () => {
    it('should provide work profile', () => {
      const profile = sampleProfiles.work();
      expect(profile.name).toBe('work');
      expect(profile.focus).toBe('Production code');
    });

    it('should provide all four default profiles', () => {
      expect(sampleProfiles.work().name).toBe('work');
      expect(sampleProfiles.build().name).toBe('build');
      expect(sampleProfiles.personal().name).toBe('personal');
      expect(sampleProfiles.learn().name).toBe('learn');
    });
  });

  describe('Sample Projects', () => {
    it('should provide simple project', () => {
      const project = sampleProjects.simple();
      expect(project.project).toBe('Simple Project');
      expect(project.stack).toContain('Node.js');
    });

    it('should provide full stack project', () => {
      const project = sampleProjects.fullStack();
      expect(project.project).toBe('AI Content Studio');
      expect(project.stack).toContain('Python');
    });
  });

  describe('Sample Pins', () => {
    it('should provide single pin', () => {
      const pin = samplePins.single();
      expect(pin).toHaveProperty('id');
      expect(pin).toHaveProperty('fact');
      expect(pin).toHaveProperty('createdAt');
    });

    it('should provide multiple pins', () => {
      const pins = samplePins.multiple();
      expect(pins).toHaveLength(3);
      expect(pins[0].fact).toBe('Using Cloudflare R2 not S3');
    });
  });

  describe('Custom Fixture Creators', () => {
    it('should create global identity with overrides', () => {
      const identity = createGlobalIdentity({ name: 'Custom Name' });
      expect(identity.name).toBe('Custom Name');
      expect(identity.role).toBe('Full-stack Developer'); // Default value
    });

    it('should create profile with overrides', () => {
      const profile = createProfile({ name: 'custom', focus: 'Custom Focus' });
      expect(profile.name).toBe('custom');
      expect(profile.focus).toBe('Custom Focus');
    });

    it('should create project config with overrides', () => {
      const project = createProjectConfig({ project: 'Custom Project' });
      expect(project.project).toBe('Custom Project');
    });

    it('should create pin with overrides', () => {
      const pin = createPin({ fact: 'Custom fact' });
      expect(pin.fact).toBe('Custom fact');
      expect(pin).toHaveProperty('id');
      expect(pin).toHaveProperty('createdAt');
    });

    it('should create multiple pins', () => {
      const pins = createPins(5, 'Test');
      expect(pins).toHaveLength(5);
      expect(pins[0].fact).toBe('Test 1');
      expect(pins[4].fact).toBe('Test 5');
    });
  });
});

describe('Test Helpers - Mock API', () => {
  describe('Mock OpenAI Response', () => {
    it('should create valid OpenAI response', async () => {
      const response = createMockOpenAIResponse('Test content');
      expect(response.ok).toBe(true);
      
      const data = await response.json();
      expect(data.choices[0].message.content).toBe('Test content');
      expect(data.model).toBe('gpt-4');
    });
  });

  describe('Mock Claude Response', () => {
    it('should create valid Claude response', async () => {
      const response = createMockClaudeResponse('Test content');
      expect(response.ok).toBe(true);
      
      const data = await response.json();
      expect(data.content[0].text).toBe('Test content');
    });
  });

  describe('Mock Error Response', () => {
    it('should create error response', async () => {
      const response = createMockErrorResponse(500, 'Server Error', 'Something went wrong');
      expect(response.ok).toBe(false);
      expect(response.status).toBe(500);
      
      const data = await response.json();
      expect(data.error.message).toBe('Something went wrong');
    });
  });

  describe('Mock AI Fetch', () => {
    it('should route to OpenAI for openai.com URLs', async () => {
      const mockFetch = createMockAIFetch('OpenAI response', 'Claude response');
      const response = await mockFetch('https://api.openai.com/v1/chat/completions', {});
      
      const data = await response.json();
      expect(data.choices[0].message.content).toBe('OpenAI response');
    });

    it('should route to Claude for anthropic.com URLs', async () => {
      const mockFetch = createMockAIFetch('OpenAI response', 'Claude response');
      const response = await mockFetch('https://api.anthropic.com/v1/messages', {});
      
      const data = await response.json();
      expect(data.content[0].text).toBe('Claude response');
    });
  });

  describe('Request Validation', () => {
    it('should validate OpenAI request headers', () => {
      const init = {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer test-key',
        },
      };
      
      expect(validateOpenAIRequest(init, 'test-key')).toBe(true);
    });

    it('should validate Claude request headers', () => {
      const init = {
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': 'test-key',
          'anthropic-version': '2023-06-01',
        },
      };
      
      expect(validateClaudeRequest(init, 'test-key')).toBe(true);
    });
  });
});
