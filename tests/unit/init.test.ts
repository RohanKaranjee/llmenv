import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import path from 'path';
import fs from 'fs/promises';
import os from 'os';
import { initCommand } from '../../src/commands/init.js';
import { ConfigError } from '../../src/types/errors.js';

describe('init command', () => {
  let testDir: string;
  let originalEnv: string | undefined;

  beforeEach(async () => {
    // Create a temporary test directory
    testDir = path.join(os.tmpdir(), `llmenv-test-${Date.now()}`);
    await fs.mkdir(testDir, { recursive: true });

    // Set LLMENV_HOME to test directory
    originalEnv = process.env.LLMENV_HOME;
    process.env.LLMENV_HOME = path.join(testDir, '.llmenv');
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

    // Clear all mocks
    vi.restoreAllMocks();
  });

  it('should create .llmenv file with provided configuration', async () => {
    // Mock inquirer prompts
    const inquirer = await import('inquirer');
    vi.spyOn(inquirer.default, 'prompt').mockResolvedValue({
      project: 'Test Project',
      stack: 'TypeScript, Node.js',
      avoid: 'PHP, Java',
      context: 'A test project',
      priorities: 'Speed, Quality'
    });

    const projectDir = path.join(testDir, 'project');
    await fs.mkdir(projectDir, { recursive: true });

    await initCommand(projectDir);

    // Verify .llmenv file was created
    const llmenvPath = path.join(projectDir, '.llmenv');
    const exists = await fs.access(llmenvPath).then(() => true).catch(() => false);
    expect(exists).toBe(true);

    // Verify file contents
    const content = await fs.readFile(llmenvPath, 'utf-8');
    const config = JSON.parse(content);

    expect(config.project).toBe('Test Project');
    expect(config.stack).toEqual(['TypeScript', 'Node.js']);
    expect(config.avoid).toEqual(['PHP', 'Java']);
    expect(config.context).toBe('A test project');
    expect(config.priorities).toEqual(['Speed', 'Quality']);
  });

  it('should throw error if .llmenv already exists', async () => {
    const projectDir = path.join(testDir, 'project');
    await fs.mkdir(projectDir, { recursive: true });

    // Create existing .llmenv file
    const llmenvPath = path.join(projectDir, '.llmenv');
    await fs.writeFile(llmenvPath, '{}', 'utf-8');

    // Attempt to initialize should throw
    await expect(initCommand(projectDir)).rejects.toThrow(ConfigError);
    await expect(initCommand(projectDir)).rejects.toThrow('already exists');
  });

  it('should validate project name is not empty', async () => {
    const inquirer = await import('inquirer');
    
    // Mock prompt to return empty project name
    vi.spyOn(inquirer.default, 'prompt').mockResolvedValue({
      project: '   ', // whitespace only
      stack: '',
      avoid: '',
      context: '',
      priorities: ''
    });

    const projectDir = path.join(testDir, 'project');
    await fs.mkdir(projectDir, { recursive: true });

    // Should throw validation error
    await expect(initCommand(projectDir)).rejects.toThrow('Project name cannot be empty');
  });

  it('should parse comma-separated inputs into arrays', async () => {
    const inquirer = await import('inquirer');
    
    vi.spyOn(inquirer.default, 'prompt').mockResolvedValue({
      project: 'Test',
      stack: 'TypeScript, Node.js, React',
      avoid: 'PHP',
      context: 'Test context',
      priorities: 'Speed, Quality, Maintainability'
    });

    const projectDir = path.join(testDir, 'project');
    await fs.mkdir(projectDir, { recursive: true });

    await initCommand(projectDir);

    const llmenvPath = path.join(projectDir, '.llmenv');
    const content = await fs.readFile(llmenvPath, 'utf-8');
    const config = JSON.parse(content);

    expect(config.stack).toEqual(['TypeScript', 'Node.js', 'React']);
    expect(config.avoid).toEqual(['PHP']);
    expect(config.priorities).toEqual(['Speed', 'Quality', 'Maintainability']);
  });

  it('should handle empty comma-separated inputs', async () => {
    const inquirer = await import('inquirer');
    
    vi.spyOn(inquirer.default, 'prompt').mockResolvedValue({
      project: 'Test',
      stack: '',
      avoid: '',
      context: '',
      priorities: ''
    });

    const projectDir = path.join(testDir, 'project');
    await fs.mkdir(projectDir, { recursive: true });

    await initCommand(projectDir);

    const llmenvPath = path.join(projectDir, '.llmenv');
    const content = await fs.readFile(llmenvPath, 'utf-8');
    const config = JSON.parse(content);

    expect(config.stack).toEqual([]);
    expect(config.avoid).toEqual([]);
    expect(config.priorities).toEqual([]);
  });

  it('should trim whitespace from comma-separated items', async () => {
    const inquirer = await import('inquirer');
    
    vi.spyOn(inquirer.default, 'prompt').mockResolvedValue({
      project: 'Test',
      stack: '  TypeScript  ,  Node.js  ,  React  ',
      avoid: '',
      context: '',
      priorities: '  Speed  ,  Quality  '
    });

    const projectDir = path.join(testDir, 'project');
    await fs.mkdir(projectDir, { recursive: true });

    await initCommand(projectDir);

    const llmenvPath = path.join(projectDir, '.llmenv');
    const content = await fs.readFile(llmenvPath, 'utf-8');
    const config = JSON.parse(content);

    expect(config.stack).toEqual(['TypeScript', 'Node.js', 'React']);
    expect(config.priorities).toEqual(['Speed', 'Quality']);
  });
});
