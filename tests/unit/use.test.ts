import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import path from 'path';
import fs from 'fs/promises';
import os from 'os';
import { useCommand } from '../../src/commands/use.js';
import { ValidationError } from '../../src/types/errors.js';
import { initializeConfig } from '../../src/core/config.js';

describe('use command', () => {
  let testDir: string;
  let originalEnv: string | undefined;

  beforeEach(async () => {
    // Create a temporary test directory
    testDir = path.join(os.tmpdir(), `llmenv-test-${Date.now()}`);
    await fs.mkdir(testDir, { recursive: true });

    // Set LLMENV_HOME to test directory
    originalEnv = process.env.LLMENV_HOME;
    process.env.LLMENV_HOME = testDir;

    // Initialize config to create active file
    await initializeConfig();
  });

  afterEach(async () => {
    // Clean up test directory
    await fs.rm(testDir, { recursive: true, force: true });

    // Restore environment
    if (originalEnv) {
      process.env.LLMENV_HOME = originalEnv;
    } else {
      delete process.env.LLMENV_HOME;
    }
  });

  describe('switching profiles', () => {
    it('should switch to work profile', async () => {
      await useCommand('work');

      const activePath = path.join(testDir, 'active');
      const content = await fs.readFile(activePath, 'utf-8');
      expect(content).toBe('work');
    });

    it('should switch to build profile', async () => {
      await useCommand('build');

      const activePath = path.join(testDir, 'active');
      const content = await fs.readFile(activePath, 'utf-8');
      expect(content).toBe('build');
    });

    it('should switch to personal profile', async () => {
      await useCommand('personal');

      const activePath = path.join(testDir, 'active');
      const content = await fs.readFile(activePath, 'utf-8');
      expect(content).toBe('personal');
    });

    it('should switch to learn profile', async () => {
      await useCommand('learn');

      const activePath = path.join(testDir, 'active');
      const content = await fs.readFile(activePath, 'utf-8');
      expect(content).toBe('learn');
    });

    it('should overwrite existing profile', async () => {
      // Set initial profile
      await useCommand('work');
      
      // Switch to different profile
      await useCommand('build');

      const activePath = path.join(testDir, 'active');
      const content = await fs.readFile(activePath, 'utf-8');
      expect(content).toBe('build');
    });
  });

  describe('validation', () => {
    it('should reject invalid profile name', async () => {
      await expect(useCommand('invalid')).rejects.toThrow(ValidationError);
      await expect(useCommand('invalid')).rejects.toThrow('Invalid profile name');
    });

    it('should reject production profile', async () => {
      await expect(useCommand('production')).rejects.toThrow(ValidationError);
      await expect(useCommand('production')).rejects.toThrow('Valid profiles: work, build, personal, learn');
    });

    it('should reject empty string', async () => {
      await expect(useCommand('')).rejects.toThrow(ValidationError);
    });

    it('should reject profile with wrong case', async () => {
      await expect(useCommand('Work')).rejects.toThrow(ValidationError);
      await expect(useCommand('WORK')).rejects.toThrow(ValidationError);
    });

    it('should reject profile with whitespace', async () => {
      await expect(useCommand('work ')).rejects.toThrow(ValidationError);
      await expect(useCommand(' work')).rejects.toThrow(ValidationError);
    });
  });

  describe('displaying current profile', () => {
    it('should display current profile when no argument provided', async () => {
      // Set a profile first
      await useCommand('build');

      // Mock console.log to capture output
      const logs: string[] = [];
      const originalLog = console.log;
      console.log = (...args: any[]) => {
        logs.push(args.join(' '));
      };

      try {
        await useCommand();

        // Verify output contains the current profile
        const output = logs.join('\n');
        expect(output).toContain('build');
        expect(output).toContain('Active profile');
      } finally {
        console.log = originalLog;
      }
    });

    it('should display default profile (work) when no switch has occurred', async () => {
      // Mock console.log to capture output
      const logs: string[] = [];
      const originalLog = console.log;
      console.log = (...args: any[]) => {
        logs.push(args.join(' '));
      };

      try {
        await useCommand();

        // Verify output contains the default profile
        const output = logs.join('\n');
        expect(output).toContain('work');
      } finally {
        console.log = originalLog;
      }
    });
  });

  describe('file operations', () => {
    it('should create active file if it does not exist', async () => {
      // Remove active file
      const activePath = path.join(testDir, 'active');
      await fs.rm(activePath, { force: true });

      // Switch profile should create the file
      await useCommand('personal');

      const exists = await fs.access(activePath).then(() => true).catch(() => false);
      expect(exists).toBe(true);
    });

    it('should write profile name without extra whitespace', async () => {
      await useCommand('learn');

      const activePath = path.join(testDir, 'active');
      const content = await fs.readFile(activePath, 'utf-8');
      
      // Should be exactly the profile name, no extra whitespace
      expect(content).toBe('learn');
      expect(content.trim()).toBe(content);
    });
  });
});
