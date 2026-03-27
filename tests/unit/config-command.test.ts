import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { mkdtemp, rm } from 'fs/promises';
import { tmpdir } from 'os';
import { join } from 'path';
import inquirer from 'inquirer';
import { configCommand } from '../../src/commands/config.js';
import { readJSON, getSettingsPath } from '../../src/core/config.js';
import type { AISettings } from '../../src/types/index.js';

describe('config command', () => {
  let testDir: string;
  let originalConsoleLog: typeof console.log;

  beforeEach(async () => {
    // Create isolated test directory
    testDir = await mkdtemp(join(tmpdir(), 'llmenv-test-'));
    process.env.LLMENV_HOME = testDir;

    // Mock console.log to suppress output during tests
    originalConsoleLog = console.log;
    console.log = vi.fn();
  });

  afterEach(async () => {
    // Restore console.log
    console.log = originalConsoleLog;

    // Clean up test directory
    await rm(testDir, { recursive: true, force: true });
    delete process.env.LLMENV_HOME;

    // Restore all mocks
    vi.restoreAllMocks();
  });

  it('should prompt for provider and API key', async () => {
    // Mock inquirer.prompt
    const promptSpy = vi.spyOn(inquirer, 'prompt').mockResolvedValue({
      provider: 'openai',
      apiKey: 'sk-test-key-123'
    });

    await configCommand();

    // Verify prompt was called with correct questions
    expect(promptSpy).toHaveBeenCalledWith(
      expect.arrayContaining([
        expect.objectContaining({
          type: 'list',
          name: 'provider',
          message: 'Select AI provider:'
        }),
        expect.objectContaining({
          type: 'password',
          name: 'apiKey',
          message: 'Enter API key:',
          mask: '*'
        })
      ])
    );
  });

  it('should save OpenAI settings to settings.json', async () => {
    // Mock inquirer.prompt
    vi.spyOn(inquirer, 'prompt').mockResolvedValue({
      provider: 'openai',
      apiKey: 'sk-test-openai-key'
    });

    await configCommand();

    // Read settings file
    const settingsPath = getSettingsPath();
    const settings = await readJSON<AISettings>(settingsPath);

    expect(settings.provider).toBe('openai');
    expect(settings.apiKey).toBe('sk-test-openai-key');
  });

  it('should save Claude settings to settings.json', async () => {
    // Mock inquirer.prompt
    vi.spyOn(inquirer, 'prompt').mockResolvedValue({
      provider: 'claude',
      apiKey: 'sk-ant-api-key-123'
    });

    await configCommand();

    // Read settings file
    const settingsPath = getSettingsPath();
    const settings = await readJSON<AISettings>(settingsPath);

    expect(settings.provider).toBe('claude');
    expect(settings.apiKey).toBe('sk-ant-api-key-123');
  });

  it('should validate API key is not empty', async () => {
    // Mock inquirer.prompt to return empty API key
    vi.spyOn(inquirer, 'prompt').mockResolvedValue({
      provider: 'openai',
      apiKey: '   ' // whitespace only
    });

    // Should throw ValidationError
    await expect(configCommand()).rejects.toThrow('API key cannot be empty');
  });

  it('should trim whitespace from API key', async () => {
    // Mock inquirer.prompt with API key that has whitespace
    vi.spyOn(inquirer, 'prompt').mockResolvedValue({
      provider: 'claude',
      apiKey: '  sk-test-key-with-spaces  '
    });

    await configCommand();

    // Read settings file
    const settingsPath = getSettingsPath();
    const settings = await readJSON<AISettings>(settingsPath);

    // API key should be trimmed
    expect(settings.apiKey).toBe('sk-test-key-with-spaces');
  });

  it('should update existing settings', async () => {
    // First configuration
    vi.spyOn(inquirer, 'prompt').mockResolvedValueOnce({
      provider: 'openai',
      apiKey: 'old-key'
    });

    await configCommand();

    // Second configuration (update)
    vi.spyOn(inquirer, 'prompt').mockResolvedValueOnce({
      provider: 'claude',
      apiKey: 'new-key'
    });

    await configCommand();

    // Read settings file
    const settingsPath = getSettingsPath();
    const settings = await readJSON<AISettings>(settingsPath);

    // Should have new settings
    expect(settings.provider).toBe('claude');
    expect(settings.apiKey).toBe('new-key');
  });

  it('should display confirmation message', async () => {
    // Mock inquirer.prompt
    vi.spyOn(inquirer, 'prompt').mockResolvedValue({
      provider: 'openai',
      apiKey: 'sk-test-key'
    });

    await configCommand();

    // Verify console.log was called with success message
    expect(console.log).toHaveBeenCalledWith(
      expect.stringContaining('✓ AI settings configured successfully')
    );
  });
});
