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
    testDir = path.join(os.tmpdir(), `llmenv-test-${Date.now()}`);
    await fs.mkdir(testDir, { recursive: true });

    originalEnv = process.env.LLMENV_HOME;
    process.env.LLMENV_HOME = testDir;

    await initializeConfig();
  });

  afterEach(async () => {
    await fs.rm(testDir, { recursive: true, force: true });

    if (originalEnv) {
      process.env.LLMENV_HOME = originalEnv;
    } else {
      delete process.env.LLMENV_HOME;
    }
  });

  describe('switching profiles', () => {
    it('should switch to build profile', async () => {
      await useCommand('build');

      const activePath = path.join(testDir, 'active');
      const content = await fs.readFile(activePath, 'utf-8');
      expect(content).toBe('build');
    });

    it('should switch to review profile', async () => {
      await useCommand('review');

      const activePath = path.join(testDir, 'active');
      const content = await fs.readFile(activePath, 'utf-8');
      expect(content).toBe('review');
    });

    it('should switch to debug profile', async () => {
      await useCommand('debug');

      const activePath = path.join(testDir, 'active');
      const content = await fs.readFile(activePath, 'utf-8');
      expect(content).toBe('debug');
    });

    it('should switch to learn profile', async () => {
      await useCommand('learn');

      const activePath = path.join(testDir, 'active');
      const content = await fs.readFile(activePath, 'utf-8');
      expect(content).toBe('learn');
    });

    it('should overwrite existing profile', async () => {
      await useCommand('build');
      await useCommand('refactor');

      const activePath = path.join(testDir, 'active');
      const content = await fs.readFile(activePath, 'utf-8');
      expect(content).toBe('refactor');
    });
  });

  describe('validation', () => {
    it('should reject invalid profile name', async () => {
      await expect(useCommand('invalid')).rejects.toThrow(ValidationError);
      await expect(useCommand('invalid')).rejects.toThrow('Invalid profile name');
    });

    it('should reject production profile', async () => {
      await expect(useCommand('production')).rejects.toThrow(ValidationError);
      await expect(useCommand('production')).rejects.toThrow('Valid profiles: build, review, debug, learn, refactor');
    });

    it('should reject empty string', async () => {
      await expect(useCommand('')).rejects.toThrow(ValidationError);
    });

    it('should reject profile with wrong case', async () => {
      await expect(useCommand('Build')).rejects.toThrow(ValidationError);
      await expect(useCommand('BUILD')).rejects.toThrow(ValidationError);
    });

    it('should reject profile with whitespace', async () => {
      await expect(useCommand('build ')).rejects.toThrow(ValidationError);
      await expect(useCommand(' build')).rejects.toThrow(ValidationError);
    });
  });

  describe('displaying current profile', () => {
    it('should display current profile when no argument provided', async () => {
      await useCommand('build');

      const logs: string[] = [];
      const originalLog = console.log;
      console.log = (...args: any[]) => {
        logs.push(args.join(' '));
      };

      try {
        await useCommand();

        const output = logs.join('\n');
        expect(output).toContain('build');
        expect(output).toContain('Active Profile');
      } finally {
        console.log = originalLog;
      }
    });

    it('should display default profile (build) when no switch has occurred', async () => {
      const logs: string[] = [];
      const originalLog = console.log;
      console.log = (...args: any[]) => {
        logs.push(args.join(' '));
      };

      try {
        await useCommand();

        const output = logs.join('\n');
        expect(output).toContain('build');
      } finally {
        console.log = originalLog;
      }
    });
  });

  describe('file operations', () => {
    it('should create active file if it does not exist', async () => {
      const activePath = path.join(testDir, 'active');
      await fs.rm(activePath, { force: true });

      await useCommand('review');

      const exists = await fs.access(activePath).then(() => true).catch(() => false);
      expect(exists).toBe(true);
    });

    it('should write profile name without extra whitespace', async () => {
      await useCommand('learn');

      const activePath = path.join(testDir, 'active');
      const content = await fs.readFile(activePath, 'utf-8');

      expect(content).toBe('learn');
      expect(content.trim()).toBe(content);
    });
  });
});
