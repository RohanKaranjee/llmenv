import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdtemp, rm, mkdir } from 'fs/promises';
import { tmpdir } from 'os';
import { join } from 'path';
import { logDecision, getHistory } from '../../src/core/history.js';
import { readJSON } from '../../src/core/config.js';
import type { HistoryEntry } from '../../src/types/index.js';

describe('History Logger Core', () => {
  let testDir: string;
  let originalEnv: string | undefined;

  beforeEach(async () => {
    // Create isolated test directory
    testDir = await mkdtemp(join(tmpdir(), 'llmenv-history-core-test-'));
    originalEnv = process.env.LLMENV_HOME;
    process.env.LLMENV_HOME = testDir;

    // Create required directory structure
    await mkdir(join(testDir, 'history'), { recursive: true });
  });

  afterEach(async () => {
    // Clean up test directory
    await rm(testDir, { recursive: true, force: true });
    if (originalEnv !== undefined) {
      process.env.LLMENV_HOME = originalEnv;
    } else {
      delete process.env.LLMENV_HOME;
    }
  });

  describe('logDecision', () => {
    it('should create history file and log first decision', async () => {
      const projectName = 'test-project';
      const prompt = 'How do I implement authentication?';
      const response = 'Use JWT tokens with bcrypt for password hashing.';
      const provider = 'openai';

      await logDecision(projectName, prompt, response, provider);

      // Verify history file was created
      const historyPath = join(testDir, 'history', `${projectName}.json`);
      const history = await readJSON<HistoryEntry[]>(historyPath, []);

      expect(history).toHaveLength(1);
      expect(history[0].prompt).toBe(prompt);
      expect(history[0].response).toBe(response);
      expect(history[0].provider).toBe(provider);
      expect(history[0].timestamp).toBeDefined();
      expect(new Date(history[0].timestamp).getTime()).toBeGreaterThan(0);
    });

    it('should append to existing history file', async () => {
      const projectName = 'test-project';

      // Log first decision
      await logDecision(projectName, 'First prompt', 'First response', 'openai');

      // Log second decision
      await logDecision(projectName, 'Second prompt', 'Second response', 'claude');

      // Verify both entries exist
      const historyPath = join(testDir, 'history', `${projectName}.json`);
      const history = await readJSON<HistoryEntry[]>(historyPath, []);

      expect(history).toHaveLength(2);
      expect(history[0].prompt).toBe('First prompt');
      expect(history[1].prompt).toBe('Second prompt');
    });

    it('should store timestamp in ISO 8601 format', async () => {
      const projectName = 'test-project';
      await logDecision(projectName, 'Test prompt', 'Test response', 'openai');

      const historyPath = join(testDir, 'history', `${projectName}.json`);
      const history = await readJSON<HistoryEntry[]>(historyPath, []);

      // Verify timestamp is valid ISO 8601
      const timestamp = history[0].timestamp;
      expect(timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/);
      expect(new Date(timestamp).toISOString()).toBe(timestamp);
    });

    it('should handle multiple projects independently', async () => {
      // Log to project A
      await logDecision('project-a', 'Prompt A', 'Response A', 'openai');

      // Log to project B
      await logDecision('project-b', 'Prompt B', 'Response B', 'claude');

      // Verify project A history
      const historyA = await readJSON<HistoryEntry[]>(
        join(testDir, 'history', 'project-a.json'),
        []
      );
      expect(historyA).toHaveLength(1);
      expect(historyA[0].prompt).toBe('Prompt A');

      // Verify project B history
      const historyB = await readJSON<HistoryEntry[]>(
        join(testDir, 'history', 'project-b.json'),
        []
      );
      expect(historyB).toHaveLength(1);
      expect(historyB[0].prompt).toBe('Prompt B');
    });

    it('should handle both openai and claude providers', async () => {
      const projectName = 'test-project';

      await logDecision(projectName, 'OpenAI prompt', 'OpenAI response', 'openai');
      await logDecision(projectName, 'Claude prompt', 'Claude response', 'claude');

      const history = await readJSON<HistoryEntry[]>(
        join(testDir, 'history', `${projectName}.json`),
        []
      );

      expect(history[0].provider).toBe('openai');
      expect(history[1].provider).toBe('claude');
    });
  });

  describe('getHistory', () => {
    it('should return empty array when history file does not exist', async () => {
      const history = await getHistory('nonexistent-project');
      expect(history).toEqual([]);
    });

    it('should return all history entries', async () => {
      const projectName = 'test-project';

      // Create history entries
      await logDecision(projectName, 'Prompt 1', 'Response 1', 'openai');
      await logDecision(projectName, 'Prompt 2', 'Response 2', 'claude');
      await logDecision(projectName, 'Prompt 3', 'Response 3', 'openai');

      const history = await getHistory(projectName);

      expect(history).toHaveLength(3);
      expect(history[0].prompt).toBeDefined();
      expect(history[1].prompt).toBeDefined();
      expect(history[2].prompt).toBeDefined();
    });

    it('should return entries sorted by timestamp descending (most recent first)', async () => {
      const projectName = 'test-project';

      // Log entries with slight delays to ensure different timestamps
      await logDecision(projectName, 'First prompt', 'First response', 'openai');
      await new Promise(resolve => setTimeout(resolve, 10));
      
      await logDecision(projectName, 'Second prompt', 'Second response', 'claude');
      await new Promise(resolve => setTimeout(resolve, 10));
      
      await logDecision(projectName, 'Third prompt', 'Third response', 'openai');

      const history = await getHistory(projectName);

      // Verify descending order (most recent first)
      expect(history[0].prompt).toBe('Third prompt');
      expect(history[1].prompt).toBe('Second prompt');
      expect(history[2].prompt).toBe('First prompt');

      // Verify timestamps are in descending order
      const time0 = new Date(history[0].timestamp).getTime();
      const time1 = new Date(history[1].timestamp).getTime();
      const time2 = new Date(history[2].timestamp).getTime();

      expect(time0).toBeGreaterThanOrEqual(time1);
      expect(time1).toBeGreaterThanOrEqual(time2);
    });

    it('should handle empty history file', async () => {
      const projectName = 'empty-project';
      const historyPath = join(testDir, 'history', `${projectName}.json`);

      // Create empty history file
      await mkdir(join(testDir, 'history'), { recursive: true });
      await readJSON(historyPath, []);

      const history = await getHistory(projectName);
      expect(history).toEqual([]);
    });

    it('should preserve all entry fields', async () => {
      const projectName = 'test-project';
      const prompt = 'Test prompt with special chars: "quotes" and \'apostrophes\'';
      const response = 'Test response with newlines\nand special chars: <>&';
      const provider = 'claude';

      await logDecision(projectName, prompt, response, provider);

      const history = await getHistory(projectName);

      expect(history[0].prompt).toBe(prompt);
      expect(history[0].response).toBe(response);
      expect(history[0].provider).toBe(provider);
      expect(history[0].timestamp).toBeDefined();
    });
  });

  describe('logDecision and getHistory integration', () => {
    it('should correctly round-trip multiple entries', async () => {
      const projectName = 'integration-test';
      const entries = [
        { prompt: 'Prompt 1', response: 'Response 1', provider: 'openai' as const },
        { prompt: 'Prompt 2', response: 'Response 2', provider: 'claude' as const },
        { prompt: 'Prompt 3', response: 'Response 3', provider: 'openai' as const }
      ];

      // Log all entries
      for (const entry of entries) {
        await logDecision(projectName, entry.prompt, entry.response, entry.provider);
        // Small delay to ensure different timestamps
        await new Promise(resolve => setTimeout(resolve, 10));
      }

      // Retrieve history
      const history = await getHistory(projectName);

      // Verify all entries are present (in reverse order due to sorting)
      expect(history).toHaveLength(3);
      expect(history[2].prompt).toBe('Prompt 1');
      expect(history[1].prompt).toBe('Prompt 2');
      expect(history[0].prompt).toBe('Prompt 3');
    });
  });
});
