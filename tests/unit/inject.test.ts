import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { injectCommand } from '../../src/commands/inject.js';
import * as context from '../../src/core/context.js';
import * as aiClient from '../../src/core/ai-client.js';
import * as config from '../../src/core/config.js';
import type { ContextStack, AIResponse, AISettings } from '../../src/types/index.js';

describe('inject command', () => {
  let consoleLogSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
  });

  afterEach(() => {
    consoleLogSpy.mockRestore();
    vi.restoreAllMocks();
  });

  const mockContext: ContextStack = {
    global: {
      name: 'Test User',
      role: 'Developer',
      experience: '5 years',
      preferences: ['TypeScript', 'Testing'],
      communication: 'Concise'
    },
    profile: {
      name: 'build',
      focus: 'Production code',
      priorities: ['Quality'],
      constraints: ['Standards'],
      tone: 'Professional'
    },
    project: {
      project: 'Test Project',
      stack: ['Node.js', 'TypeScript'],
      avoid: ['jQuery'],
      context: 'Test context',
      priorities: ['Speed']
    },
    pins: [
      {
        id: 'test-pin-1',
        fact: 'Test fact 1',
        createdAt: '2024-01-01T00:00:00.000Z'
      }
    ],
    projectPath: '/test/project'
  };

  describe('dry run mode', () => {
    it('should output wrapped prompt without API call', async () => {
      vi.spyOn(context, 'buildContext').mockResolvedValue(mockContext);
      vi.spyOn(context, 'formatContext').mockReturnValue('[CONTEXT]\nTest context\n[END CONTEXT]');

      await injectCommand('Test prompt', { dry: true });

      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.stringContaining('[CONTEXT]')
      );
      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.stringContaining('[END CONTEXT]')
      );
      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.stringContaining('Test prompt')
      );
    });

    it('should not make API calls in dry mode', async () => {
      vi.spyOn(context, 'buildContext').mockResolvedValue(mockContext);
      vi.spyOn(context, 'formatContext').mockReturnValue('[CONTEXT]\n[END CONTEXT]');

      const callAISpy = vi.spyOn(aiClient, 'callAI');

      await injectCommand('Test prompt', { dry: true });

      expect(callAISpy).not.toHaveBeenCalled();
    });
  });

  describe('live API mode', () => {
    it('should call AI API and display response', async () => {
      vi.spyOn(context, 'buildContext').mockResolvedValue(mockContext);
      vi.spyOn(context, 'formatContext').mockReturnValue('[CONTEXT]\n[END CONTEXT]');
      vi.spyOn(config, 'fileExists').mockResolvedValue(true);

      const mockSettings: AISettings = {
        provider: 'openai',
        apiKey: 'test-key'
      };
      vi.spyOn(config, 'readJSON').mockResolvedValue(mockSettings);

      const mockResponse: AIResponse = {
        content: 'Test AI response',
        model: 'gpt-4',
        usage: {
          promptTokens: 100,
          completionTokens: 50,
          totalTokens: 150
        }
      };
      vi.spyOn(aiClient, 'callAI').mockResolvedValue(mockResponse);

      await injectCommand('Test prompt', {});

      expect(aiClient.callAI).toHaveBeenCalledWith(
        expect.stringContaining('[CONTEXT]'),
        mockSettings
      );
      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.stringContaining('Test AI response')
      );
    });

    it('should fall back to dry run if settings file does not exist', async () => {
      vi.spyOn(context, 'buildContext').mockResolvedValue(mockContext);
      vi.spyOn(context, 'formatContext').mockReturnValue('[CONTEXT]\n[END CONTEXT]');
      vi.spyOn(config, 'fileExists').mockResolvedValue(false);
      const callAISpy = vi.spyOn(aiClient, 'callAI');

      await injectCommand('Test prompt', {});

      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.stringContaining('Falling back to dry run')
      );
      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.stringContaining('Run "llmenv config"')
      );
      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.stringContaining('Test prompt')
      );
      expect(callAISpy).not.toHaveBeenCalled();
    });
  });

  describe('context building', () => {
    it('should build context from current working directory', async () => {
      const buildContextSpy = vi.spyOn(context, 'buildContext').mockResolvedValue(mockContext);
      vi.spyOn(context, 'formatContext').mockReturnValue('[CONTEXT]\n[END CONTEXT]');

      const testCwd = '/test/cwd';
      await injectCommand('Test prompt', { dry: true }, testCwd);

      expect(buildContextSpy).toHaveBeenCalledWith(testCwd);
    });

    it('should format context with all layers', async () => {
      vi.spyOn(context, 'buildContext').mockResolvedValue(mockContext);
      const formatContextSpy = vi.spyOn(context, 'formatContext').mockReturnValue('[CONTEXT]\n[END CONTEXT]');

      await injectCommand('Test prompt', { dry: true });

      expect(formatContextSpy).toHaveBeenCalledWith({
        global: mockContext.global,
        profile: mockContext.profile,
        project: mockContext.project,
        pins: ['Test fact 1']
      });
    });
  });
});
