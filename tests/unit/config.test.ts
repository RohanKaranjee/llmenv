import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import os from 'os';
import path from 'path';
import fs from 'fs/promises';
import type { GlobalIdentity, Profile } from '../../src/types/index.js';
import {
  getConfigDir,
  getDefaultConfigPath,
  getActiveProfilePath,
  getProfilePath,
  getProjectsPath,
  getPinsPath,
  getSettingsPath,
  getHistoryPath,
} from '../../src/core/config.js';

describe('Config Path Resolution', () => {
  let originalEnv: string | undefined;

  beforeEach(() => {
    originalEnv = process.env.LLMENV_HOME;
  });

  afterEach(() => {
    if (originalEnv === undefined) {
      delete process.env.LLMENV_HOME;
    } else {
      process.env.LLMENV_HOME = originalEnv;
    }
  });

  describe('getConfigDir', () => {
    it('should return ~/.llmenv by default', () => {
      delete process.env.LLMENV_HOME;
      const configDir = getConfigDir();
      expect(configDir).toBe(path.join(os.homedir(), '.llmenv'));
    });

    it('should support LLMENV_HOME override', () => {
      const customPath = '/custom/path';
      process.env.LLMENV_HOME = customPath;
      const configDir = getConfigDir();
      expect(configDir).toBe(path.resolve(customPath));
    });

    it('should resolve relative LLMENV_HOME paths', () => {
      process.env.LLMENV_HOME = './test-config';
      const configDir = getConfigDir();
      expect(path.isAbsolute(configDir)).toBe(true);
    });
  });

  describe('getDefaultConfigPath', () => {
    it('should return path to default.json', () => {
      delete process.env.LLMENV_HOME;
      const configPath = getDefaultConfigPath();
      expect(configPath).toBe(path.join(os.homedir(), '.llmenv', 'default.json'));
    });
  });

  describe('getActiveProfilePath', () => {
    it('should return path to active file', () => {
      delete process.env.LLMENV_HOME;
      const activePath = getActiveProfilePath();
      expect(activePath).toBe(path.join(os.homedir(), '.llmenv', 'active'));
    });
  });

  describe('getProfilePath', () => {
    it('should return path to profile JSON file', () => {
      delete process.env.LLMENV_HOME;
      const profilePath = getProfilePath('build');
      expect(profilePath).toBe(path.join(os.homedir(), '.llmenv', 'profiles', 'build.json'));
    });

    it('should work with different profile names', () => {
      delete process.env.LLMENV_HOME;
      expect(getProfilePath('build')).toContain('build.json');
      expect(getProfilePath('review')).toContain('review.json');
      expect(getProfilePath('debug')).toContain('debug.json');
      expect(getProfilePath('learn')).toContain('learn.json');
      expect(getProfilePath('refactor')).toContain('refactor.json');
    });
  });

  describe('getProjectsPath', () => {
    it('should return path to projects.json', () => {
      delete process.env.LLMENV_HOME;
      const projectsPath = getProjectsPath();
      expect(projectsPath).toBe(path.join(os.homedir(), '.llmenv', 'projects.json'));
    });
  });

  describe('getPinsPath', () => {
    it('should return path to pins.json', () => {
      delete process.env.LLMENV_HOME;
      const pinsPath = getPinsPath();
      expect(pinsPath).toBe(path.join(os.homedir(), '.llmenv', 'pins.json'));
    });
  });

  describe('getSettingsPath', () => {
    it('should return path to settings.json', () => {
      delete process.env.LLMENV_HOME;
      const settingsPath = getSettingsPath();
      expect(settingsPath).toBe(path.join(os.homedir(), '.llmenv', 'settings.json'));
    });
  });

  describe('getHistoryPath', () => {
    it('should return path to project history file', () => {
      delete process.env.LLMENV_HOME;
      const historyPath = getHistoryPath('my-project');
      expect(historyPath).toBe(path.join(os.homedir(), '.llmenv', 'history', 'my-project.json'));
    });

    it('should work with different project names', () => {
      delete process.env.LLMENV_HOME;
      expect(getHistoryPath('project-a')).toContain('project-a.json');
      expect(getHistoryPath('project-b')).toContain('project-b.json');
    });
  });

  describe('Cross-platform compatibility', () => {
    it('should use platform-independent path separators', () => {
      delete process.env.LLMENV_HOME;
      const configPath = getDefaultConfigPath();
      // Path should be absolute and properly formatted for the platform
      expect(path.isAbsolute(configPath)).toBe(true);
    });

    it('should handle LLMENV_HOME with different path separators', () => {
      // Test with forward slashes (Unix-style)
      process.env.LLMENV_HOME = '/tmp/test/config';
      const configDir1 = getConfigDir();
      expect(path.isAbsolute(configDir1)).toBe(true);

      // Test with backslashes (Windows-style) - path.resolve handles this
      process.env.LLMENV_HOME = 'C:\\temp\\test\\config';
      const configDir2 = getConfigDir();
      expect(path.isAbsolute(configDir2)).toBe(true);
    });
  });
});


describe('File I/O Operations', () => {
  let tempDir: string;

  beforeEach(async () => {
    // Create a temporary directory for testing
    tempDir = path.join(os.tmpdir(), `llmenv-test-${Date.now()}`);
    process.env.LLMENV_HOME = tempDir;
    // Ensure the temp directory exists
    await fs.mkdir(tempDir, { recursive: true });
  });

  afterEach(async () => {
    // Clean up temporary directory
    try {
      await fs.rm(tempDir, { recursive: true, force: true });
    } catch {
      // Ignore cleanup errors
    }
    delete process.env.LLMENV_HOME;
  });

  describe('ensureConfigDir', () => {
    it('should create config directory if it does not exist', async () => {
      const { ensureConfigDir, getConfigDir } = await import('../../src/core/config.js');
      
      await ensureConfigDir();
      
      const configDir = getConfigDir();
      const stats = await fs.stat(configDir);
      expect(stats.isDirectory()).toBe(true);
    });

    it('should not throw if directory already exists', async () => {
      const { ensureConfigDir, getConfigDir } = await import('../../src/core/config.js');
      
      const configDir = getConfigDir();
      await fs.mkdir(configDir, { recursive: true });
      
      await expect(ensureConfigDir()).resolves.not.toThrow();
    });
  });

  describe('ensureDir', () => {
    it('should create directory if it does not exist', async () => {
      const { ensureDir } = await import('../../src/core/config.js');
      
      const testDir = path.join(tempDir, 'test', 'nested', 'dir');
      await ensureDir(testDir);
      
      const stats = await fs.stat(testDir);
      expect(stats.isDirectory()).toBe(true);
    });

    it('should create parent directories automatically', async () => {
      const { ensureDir } = await import('../../src/core/config.js');
      
      const testDir = path.join(tempDir, 'a', 'b', 'c', 'd');
      await ensureDir(testDir);
      
      const stats = await fs.stat(testDir);
      expect(stats.isDirectory()).toBe(true);
    });

    it('should not throw if directory already exists', async () => {
      const { ensureDir } = await import('../../src/core/config.js');
      
      const testDir = path.join(tempDir, 'existing');
      await fs.mkdir(testDir, { recursive: true });
      
      await expect(ensureDir(testDir)).resolves.not.toThrow();
    });
  });

  describe('fileExists', () => {
    it('should return true for existing file', async () => {
      const { fileExists } = await import('../../src/core/config.js');
      
      const testFile = path.join(tempDir, 'test.txt');
      await fs.writeFile(testFile, 'content');
      
      const exists = await fileExists(testFile);
      expect(exists).toBe(true);
    });

    it('should return false for non-existing file', async () => {
      const { fileExists } = await import('../../src/core/config.js');
      
      const testFile = path.join(tempDir, 'nonexistent.txt');
      
      const exists = await fileExists(testFile);
      expect(exists).toBe(false);
    });

    it('should return true for existing directory', async () => {
      const { fileExists } = await import('../../src/core/config.js');
      
      const testDir = path.join(tempDir, 'testdir');
      await fs.mkdir(testDir);
      
      const exists = await fileExists(testDir);
      expect(exists).toBe(true);
    });
  });

  describe('readJSON', () => {
    it('should read and parse valid JSON file', async () => {
      const { readJSON } = await import('../../src/core/config.js');
      
      const testFile = path.join(tempDir, 'test.json');
      const testData = { name: 'test', value: 42 };
      await fs.writeFile(testFile, JSON.stringify(testData));
      
      const result = await readJSON(testFile);
      expect(result).toEqual(testData);
    });

    it('should return default value if file does not exist', async () => {
      const { readJSON } = await import('../../src/core/config.js');
      
      const testFile = path.join(tempDir, 'nonexistent.json');
      const defaultValue = { default: true };
      
      const result = await readJSON(testFile, defaultValue);
      expect(result).toEqual(defaultValue);
    });

    it('should throw ConfigError for invalid JSON', async () => {
      const { readJSON } = await import('../../src/core/config.js');
      const { ConfigError } = await import('../../src/types/errors.js');
      
      const testFile = path.join(tempDir, 'invalid.json');
      await fs.writeFile(testFile, '{ invalid json }');
      
      await expect(readJSON(testFile)).rejects.toThrow(ConfigError);
    });

    it('should throw ConfigError if file does not exist and no default provided', async () => {
      const { readJSON } = await import('../../src/core/config.js');
      const { ConfigError } = await import('../../src/types/errors.js');
      
      const testFile = path.join(tempDir, 'nonexistent.json');
      
      await expect(readJSON(testFile)).rejects.toThrow(ConfigError);
    });

    it('should handle complex nested objects', async () => {
      const { readJSON } = await import('../../src/core/config.js');
      
      const testFile = path.join(tempDir, 'complex.json');
      const testData = {
        nested: {
          array: [1, 2, 3],
          object: { key: 'value' }
        }
      };
      await fs.writeFile(testFile, JSON.stringify(testData));
      
      const result = await readJSON(testFile);
      expect(result).toEqual(testData);
    });
  });

  describe('writeJSON', () => {
    it('should write data as JSON with 2-space indentation', async () => {
      const { writeJSON } = await import('../../src/core/config.js');
      
      const testFile = path.join(tempDir, 'output.json');
      const testData = { name: 'test', value: 42 };
      
      await writeJSON(testFile, testData);
      
      const content = await fs.readFile(testFile, 'utf-8');
      expect(content).toBe(JSON.stringify(testData, null, 2));
    });

    it('should create parent directories automatically', async () => {
      const { writeJSON } = await import('../../src/core/config.js');
      
      const testFile = path.join(tempDir, 'nested', 'deep', 'output.json');
      const testData = { test: true };
      
      await writeJSON(testFile, testData);
      
      const content = await fs.readFile(testFile, 'utf-8');
      expect(JSON.parse(content)).toEqual(testData);
    });

    it('should overwrite existing file', async () => {
      const { writeJSON } = await import('../../src/core/config.js');
      
      const testFile = path.join(tempDir, 'overwrite.json');
      await fs.writeFile(testFile, 'old content');
      
      const testData = { new: 'data' };
      await writeJSON(testFile, testData);
      
      const content = await fs.readFile(testFile, 'utf-8');
      expect(JSON.parse(content)).toEqual(testData);
    });

    it('should handle arrays', async () => {
      const { writeJSON } = await import('../../src/core/config.js');
      
      const testFile = path.join(tempDir, 'array.json');
      const testData = [1, 2, 3, { nested: true }];
      
      await writeJSON(testFile, testData);
      
      const content = await fs.readFile(testFile, 'utf-8');
      expect(JSON.parse(content)).toEqual(testData);
    });

    it('should handle empty objects', async () => {
      const { writeJSON } = await import('../../src/core/config.js');
      
      const testFile = path.join(tempDir, 'empty.json');
      const testData = {};
      
      await writeJSON(testFile, testData);
      
      const content = await fs.readFile(testFile, 'utf-8');
      expect(JSON.parse(content)).toEqual(testData);
    });
  });

  describe('Round-trip operations', () => {
    it('should preserve data through write and read cycle', async () => {
      const { writeJSON, readJSON } = await import('../../src/core/config.js');
      
      const testFile = path.join(tempDir, 'roundtrip.json');
      const testData = {
        string: 'value',
        number: 42,
        boolean: true,
        null: null,
        array: [1, 2, 3],
        nested: { key: 'value' }
      };
      
      await writeJSON(testFile, testData);
      const result = await readJSON(testFile);
      
      expect(result).toEqual(testData);
    });
  });
});

describe('Configuration Initialization', () => {
  let tempDir: string;

  beforeEach(async () => {
    // Create a temporary directory for testing
    tempDir = path.join(os.tmpdir(), `llmenv-test-init-${Date.now()}`);
    process.env.LLMENV_HOME = tempDir;
  });

  afterEach(async () => {
    // Clean up temporary directory
    try {
      await fs.rm(tempDir, { recursive: true, force: true });
    } catch {
      // Ignore cleanup errors
    }
    delete process.env.LLMENV_HOME;
  });

  describe('initializeConfig', () => {
    it('should create all required directories', async () => {
      const { initializeConfig, getConfigDir } = await import('../../src/core/config.js');
      
      await initializeConfig();
      
      const configDir = getConfigDir();
      const profilesDir = path.join(configDir, 'profiles');
      const historyDir = path.join(configDir, 'history');
      
      expect((await fs.stat(configDir)).isDirectory()).toBe(true);
      expect((await fs.stat(profilesDir)).isDirectory()).toBe(true);
      expect((await fs.stat(historyDir)).isDirectory()).toBe(true);
    });

    it('should create default.json with default identity', async () => {
      const { initializeConfig, getDefaultConfigPath, readJSON } = await import('../../src/core/config.js');
      
      await initializeConfig();
      
      const defaultConfig = await readJSON<GlobalIdentity>(getDefaultConfigPath());
      expect(defaultConfig).toHaveProperty('name');
      expect(defaultConfig).toHaveProperty('role');
      expect(defaultConfig).toHaveProperty('experience');
      expect(defaultConfig).toHaveProperty('preferences');
      expect(defaultConfig).toHaveProperty('communication');
      expect(Array.isArray(defaultConfig.preferences)).toBe(true);
    });

    it('should create all default profile files', async () => {
      const { initializeConfig, getProfilePath, fileExists } = await import('../../src/core/config.js');
      
      await initializeConfig();
      
      const profiles = ['build', 'review', 'debug', 'learn', 'refactor'];
      for (const profile of profiles) {
        const exists = await fileExists(getProfilePath(profile));
        expect(exists).toBe(true);
      }
    });

    it('should create profile files with correct structure', async () => {
      const { initializeConfig, getProfilePath, readJSON } = await import('../../src/core/config.js');
      
      await initializeConfig();
      
      const workProfile = await readJSON<Profile>(getProfilePath('build'));
      expect(workProfile).toHaveProperty('name', 'build');
      expect(workProfile).toHaveProperty('focus');
      expect(workProfile).toHaveProperty('priorities');
      expect(workProfile).toHaveProperty('constraints');
      expect(workProfile).toHaveProperty('tone');
      expect(Array.isArray(workProfile.priorities)).toBe(true);
      expect(Array.isArray(workProfile.constraints)).toBe(true);
    });

    it('should create projects.json as empty array', async () => {
      const { initializeConfig, getProjectsPath, readJSON } = await import('../../src/core/config.js');
      
      await initializeConfig();
      
      const projects = await readJSON(getProjectsPath());
      expect(Array.isArray(projects)).toBe(true);
      expect(projects).toHaveLength(0);
    });

    it('should create pins.json as empty array', async () => {
      const { initializeConfig, getPinsPath, readJSON } = await import('../../src/core/config.js');
      
      await initializeConfig();
      
      const pins = await readJSON(getPinsPath());
      expect(Array.isArray(pins)).toBe(true);
      expect(pins).toHaveLength(0);
    });

    it('should create active file with \\\'build\\\' as default', async () => {
      const { initializeConfig, getActiveProfilePath } = await import('../../src/core/config.js');
      
      await initializeConfig();
      
      const activeContent = await fs.readFile(getActiveProfilePath(), 'utf-8');
      expect(activeContent).toBe('build');
    });

    it('should not overwrite existing files', async () => {
      const { initializeConfig, getDefaultConfigPath, writeJSON, readJSON } = await import('../../src/core/config.js');
      
      // Create a custom default.json
      const customIdentity: GlobalIdentity = {
        name: "Custom Name",
        role: "Custom Role",
        experience: "10 years",
        preferences: ["Custom"],
        communication: "Custom style"
      };
      
      await fs.mkdir(tempDir, { recursive: true });
      await writeJSON(getDefaultConfigPath(), customIdentity);
      
      // Run initialization
      await initializeConfig();
      
      // Verify the custom file was not overwritten
      const defaultConfig = await readJSON<GlobalIdentity>(getDefaultConfigPath());
      expect(defaultConfig.name).toBe("Custom Name");
      expect(defaultConfig.role).toBe("Custom Role");
    });

    it('should be idempotent - can be called multiple times safely', async () => {
      const { initializeConfig, getDefaultConfigPath, readJSON } = await import('../../src/core/config.js');
      
      await initializeConfig();
      const firstConfig = await readJSON(getDefaultConfigPath());
      
      await initializeConfig();
      const secondConfig = await readJSON(getDefaultConfigPath());
      
      expect(firstConfig).toEqual(secondConfig);
    });

    it('should create all files with valid JSON format', async () => {
      const { initializeConfig, getConfigDir } = await import('../../src/core/config.js');
      
      await initializeConfig();
      
      const configDir = getConfigDir();
      const jsonFiles = [
        path.join(configDir, 'default.json'),
        path.join(configDir, 'profiles', 'build.json'),
        path.join(configDir, 'profiles', 'review.json'),
        path.join(configDir, 'profiles', 'debug.json'),
        path.join(configDir, 'profiles', 'learn.json'),
        path.join(configDir, 'profiles', 'refactor.json'),
        path.join(configDir, 'projects.json'),
        path.join(configDir, 'pins.json'),
      ];
      
      for (const file of jsonFiles) {
        const content = await fs.readFile(file, 'utf-8');
        expect(() => JSON.parse(content)).not.toThrow();
      }
    });
  });
});
