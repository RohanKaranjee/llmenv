import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { mkdtemp, rm, mkdir } from 'fs/promises';
import { tmpdir } from 'os';
import { join } from 'path';
import { historyCommand } from '../../src/commands/history.js';
import { writeJSON } from '../../src/core/config.js';
import { ProjectNotFoundError } from '../../src/types/errors.js';
import type { HistoryEntry } from '../../src/types/index.js';

describe('History Command', () => {
  let testDir: string;
  let originalEnv: string | undefined;

  beforeEach(async () => {
    // Create isolated test directory
    testDir = await mkdtemp(join(tmpdir(), 'llmenv-history-test-'));
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
    vi.restoreAllMocks();
  });

  it('should display history when project is detected and history exists', async () => {
    // Create a project directory with .llmenv
    const projectDir = join(testDir, 'test-project');
    await mkdir(projectDir, { recursive: true });
    await writeJSON(join(projectDir, '.llmenv'), {
      project: 'Test Project',
      stack: ['TypeScript'],
      avoid: [],
      context: 'Test context',
      priorities: []
    });

    // Create history file for the project
    const history: HistoryEntry[] = [
      {
        timestamp: '2024-03-15T14:30:00.000Z',
        prompt: 'How do I implement authentication?',
        response: 'You can use JWT tokens with bcrypt for password hashing. Here is a detailed implementation...',
        provider: 'claude'
      },
      {
        timestamp: '2024-03-14T10:15:00.000Z',
        prompt: 'Best practices for error handling?',
        response: 'Use custom error classes and centralized error handling middleware...',
        provider: 'openai'
      }
    ];
    await writeJSON(join(testDir, 'history', 'test-project.json'), history);

    // Mock console.log to capture output
    const logs: string[] = [];
    const originalLog = console.log;
    console.log = vi.fn((...args: any[]) => {
      logs.push(args.join(' '));
    });

    // Run history command
    await historyCommand(projectDir);

    // Restore console.log
    console.log = originalLog;

    // Verify output contains expected content
    const output = logs.join('\n');
    expect(output).toContain('Decision History');
    expect(output).toContain('2024-03-15'); // Check date part only (timezone-independent)
    expect(output).toContain('[claude]');
    expect(output).toContain('How do I implement authentication?');
    expect(output).toContain('JWT tokens');
    expect(output).toContain('2024-03-14'); // Check date part only
    expect(output).toContain('[openai]');
    expect(output).toContain('Best practices for error handling?');
  });

  it('should display "No decision history" when history file is empty', async () => {
    // Create a project directory with .llmenv
    const projectDir = join(testDir, 'empty-project');
    await mkdir(projectDir, { recursive: true });
    await writeJSON(join(projectDir, '.llmenv'), {
      project: 'Empty Project',
      stack: [],
      avoid: [],
      context: '',
      priorities: []
    });

    // Create empty history file
    await writeJSON(join(testDir, 'history', 'empty-project.json'), []);

    // Mock console.log to capture output
    const logs: string[] = [];
    const originalLog = console.log;
    console.log = vi.fn((...args: any[]) => {
      logs.push(args.join(' '));
    });

    // Run history command
    await historyCommand(projectDir);

    // Restore console.log
    console.log = originalLog;

    // Verify output contains "no history" message
    const output = logs.join('\n');
    expect(output).toContain('No decision history for this project');
  });

  it('should display "No decision history" when history file does not exist', async () => {
    // Create a project directory with .llmenv
    const projectDir = join(testDir, 'new-project');
    await mkdir(projectDir, { recursive: true });
    await writeJSON(join(projectDir, '.llmenv'), {
      project: 'New Project',
      stack: [],
      avoid: [],
      context: '',
      priorities: []
    });

    // Do NOT create history file

    // Mock console.log to capture output
    const logs: string[] = [];
    const originalLog = console.log;
    console.log = vi.fn((...args: any[]) => {
      logs.push(args.join(' '));
    });

    // Run history command
    await historyCommand(projectDir);

    // Restore console.log
    console.log = originalLog;

    // Verify output contains "no history" message
    const output = logs.join('\n');
    expect(output).toContain('No decision history for this project');
  });

  it('should throw ProjectNotFoundError when no project is detected', async () => {
    // Mock findProjectRoot to return null (simulating no project found)
    const contextModule = await import('../../src/core/context.js');
    const findProjectRootSpy = vi.spyOn(contextModule, 'findProjectRoot').mockResolvedValue(null);

    try {
      // Expect the command to throw ProjectNotFoundError
      await expect(historyCommand('/some/nonexistent/path')).rejects.toThrow(ProjectNotFoundError);
      await expect(historyCommand('/some/nonexistent/path')).rejects.toThrow('Not in a project directory');
      
      // Verify findProjectRoot was called
      expect(findProjectRootSpy).toHaveBeenCalled();
    } finally {
      // Restore the original function
      findProjectRootSpy.mockRestore();
    }
  });

  it('should find project from nested directory', async () => {
    // Create a project directory with .llmenv
    const projectDir = join(testDir, 'nested-project');
    await mkdir(projectDir, { recursive: true });
    await writeJSON(join(projectDir, '.llmenv'), {
      project: 'Nested Project',
      stack: [],
      avoid: [],
      context: '',
      priorities: []
    });

    // Create history file
    const history: HistoryEntry[] = [
      {
        timestamp: '2024-03-15T14:30:00.000Z',
        prompt: 'Test prompt',
        response: 'Test response',
        provider: 'claude'
      }
    ];
    await writeJSON(join(testDir, 'history', 'nested-project.json'), history);

    // Create nested subdirectory
    const nestedDir = join(projectDir, 'src', 'components');
    await mkdir(nestedDir, { recursive: true });

    // Mock console.log to capture output
    const logs: string[] = [];
    const originalLog = console.log;
    console.log = vi.fn((...args: any[]) => {
      logs.push(args.join(' '));
    });

    // Run history command from nested directory
    await historyCommand(nestedDir);

    // Restore console.log
    console.log = originalLog;

    // Verify it found the parent project's history
    const output = logs.join('\n');
    expect(output).toContain('Decision History');
    expect(output).toContain('Test prompt');
  });

  it('should display history sorted by timestamp descending (most recent first)', async () => {
    // Create a project directory with .llmenv
    const projectDir = join(testDir, 'sorted-project');
    await mkdir(projectDir, { recursive: true });
    await writeJSON(join(projectDir, '.llmenv'), {
      project: 'Sorted Project',
      stack: [],
      avoid: [],
      context: '',
      priorities: []
    });

    // Create history with entries in random order
    const history: HistoryEntry[] = [
      {
        timestamp: '2024-03-10T10:00:00.000Z',
        prompt: 'Oldest prompt',
        response: 'Oldest response',
        provider: 'claude'
      },
      {
        timestamp: '2024-03-15T14:30:00.000Z',
        prompt: 'Newest prompt',
        response: 'Newest response',
        provider: 'openai'
      },
      {
        timestamp: '2024-03-12T12:00:00.000Z',
        prompt: 'Middle prompt',
        response: 'Middle response',
        provider: 'claude'
      }
    ];
    await writeJSON(join(testDir, 'history', 'sorted-project.json'), history);

    // Mock console.log to capture output
    const logs: string[] = [];
    const originalLog = console.log;
    console.log = vi.fn((...args: any[]) => {
      logs.push(args.join(' '));
    });

    // Run history command
    await historyCommand(projectDir);

    // Restore console.log
    console.log = originalLog;

    // Verify output is sorted by timestamp descending
    const output = logs.join('\n');
    const newestIndex = output.indexOf('Newest prompt');
    const middleIndex = output.indexOf('Middle prompt');
    const oldestIndex = output.indexOf('Oldest prompt');

    expect(newestIndex).toBeLessThan(middleIndex);
    expect(middleIndex).toBeLessThan(oldestIndex);
  });

  it('should truncate long responses in display', async () => {
    // Create a project directory with .llmenv
    const projectDir = join(testDir, 'truncate-project');
    await mkdir(projectDir, { recursive: true });
    await writeJSON(join(projectDir, '.llmenv'), {
      project: 'Truncate Project',
      stack: [],
      avoid: [],
      context: '',
      priorities: []
    });

    // Create history with a very long response
    const longResponse = 'A'.repeat(300); // 300 characters
    const history: HistoryEntry[] = [
      {
        timestamp: '2024-03-15T14:30:00.000Z',
        prompt: 'Test prompt',
        response: longResponse,
        provider: 'claude'
      }
    ];
    await writeJSON(join(testDir, 'history', 'truncate-project.json'), history);

    // Mock console.log to capture output
    const logs: string[] = [];
    const originalLog = console.log;
    console.log = vi.fn((...args: any[]) => {
      logs.push(args.join(' '));
    });

    // Run history command
    await historyCommand(projectDir);

    // Restore console.log
    console.log = originalLog;

    // Verify response is truncated with ellipsis
    const output = logs.join('\n');
    expect(output).toContain('...');
    expect(output).not.toContain('A'.repeat(300));
  });
});
