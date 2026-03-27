import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { mkdtemp, rm, writeFile, mkdir } from 'fs/promises';
import { tmpdir } from 'os';
import { join } from 'path';
import { statusCommand } from '../../src/commands/status.js';
import { writeJSON } from '../../src/core/config.js';
import type { GlobalIdentity, Profile, ProjectConfig } from '../../src/types/index.js';

describe('Status Command', () => {
  let testDir: string;
  let originalEnv: string | undefined;

  beforeEach(async () => {
    // Create isolated test directory
    testDir = await mkdtemp(join(tmpdir(), 'llmenv-status-test-'));
    originalEnv = process.env.LLMENV_HOME;
    process.env.LLMENV_HOME = testDir;

    // Create required directory structure
    await mkdir(join(testDir, 'profiles'), { recursive: true });
    await mkdir(join(testDir, 'history'), { recursive: true });

    // Create default.json (global identity)
    const globalIdentity: GlobalIdentity = {
      name: 'Test User',
      role: 'Developer',
      experience: '5 years',
      preferences: ['TypeScript', 'Testing'],
      communication: 'Clear and concise'
    };
    await writeJSON(join(testDir, 'default.json'), globalIdentity);

    // Create active profile file
    await writeFile(join(testDir, 'active'), 'work');

    // Create work profile
    const workProfile: Profile = {
      name: 'work',
      focus: 'Production code',
      priorities: ['Reliability', 'Performance'],
      constraints: ['Code review required'],
      tone: 'Professional'
    };
    await writeJSON(join(testDir, 'profiles', 'work.json'), workProfile);

    // Create empty projects.json
    await writeJSON(join(testDir, 'projects.json'), []);

    // Create empty pins.json
    await writeJSON(join(testDir, 'pins.json'), []);
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

  it('should display context with project when .llmenv exists', async () => {
    // Create a project directory with .llmenv
    const projectDir = join(testDir, 'test-project');
    await mkdir(projectDir, { recursive: true });

    const projectConfig: ProjectConfig = {
      project: 'Test Project',
      stack: ['TypeScript', 'Node.js'],
      avoid: ['PHP'],
      context: 'Test project context',
      priorities: ['Speed', 'Quality']
    };
    await writeJSON(join(projectDir, '.llmenv'), projectConfig);

    // Mock console.log to capture output
    const logs: string[] = [];
    const originalLog = console.log;
    console.log = vi.fn((...args: any[]) => {
      logs.push(args.join(' '));
    });

    // Run status command
    await statusCommand(projectDir);

    // Restore console.log
    console.log = originalLog;

    // Verify output contains expected sections
    const output = logs.join('\n');
    expect(output).toContain('📋 Current Context');
    expect(output).toContain('[CONTEXT]');
    expect(output).toContain('=== Global Identity ===');
    expect(output).toContain('Test User');
    expect(output).toContain('=== Active Profile: work ===');
    expect(output).toContain('=== Current Project: Test Project ===');
    expect(output).toContain('TypeScript, Node.js');
    expect(output).toContain('[END CONTEXT]');
    expect(output).toContain('✓ Project: Test Project');
    expect(output).toContain('Active profile: work');
    expect(output).toContain('Pins: 0');
  });

  it('should display warning when no project is detected', async () => {
    // Create a directory without .llmenv
    const nonProjectDir = join(testDir, 'non-project');
    await mkdir(nonProjectDir, { recursive: true });

    // Mock console.log to capture output
    const logs: string[] = [];
    const originalLog = console.log;
    console.log = vi.fn((...args: any[]) => {
      logs.push(args.join(' '));
    });

    // Run status command
    await statusCommand(nonProjectDir);

    // Restore console.log
    console.log = originalLog;

    // Verify output contains warning
    const output = logs.join('\n');
    expect(output).toContain('📋 Current Context');
    expect(output).toContain('=== Global Identity ===');
    expect(output).toContain('=== Active Profile: work ===');
    expect(output).not.toContain('=== Current Project:');
    expect(output).toContain('⚠ No project detected in current directory');
    expect(output).toContain('Active profile: work');
    expect(output).toContain('Pins: 0');
  });

  it('should display pin count when pins exist', async () => {
    // Add some pins
    const pins = [
      {
        id: 'pin-1',
        fact: 'Using TypeScript',
        createdAt: new Date().toISOString()
      },
      {
        id: 'pin-2',
        fact: 'Prefer functional programming',
        createdAt: new Date().toISOString()
      }
    ];
    await writeJSON(join(testDir, 'pins.json'), pins);

    // Create a directory without .llmenv
    const nonProjectDir = join(testDir, 'non-project');
    await mkdir(nonProjectDir, { recursive: true });

    // Mock console.log to capture output
    const logs: string[] = [];
    const originalLog = console.log;
    console.log = vi.fn((...args: any[]) => {
      logs.push(args.join(' '));
    });

    // Run status command
    await statusCommand(nonProjectDir);

    // Restore console.log
    console.log = originalLog;

    // Verify output contains pin count
    const output = logs.join('\n');
    expect(output).toContain('Pins: 2');
    expect(output).toContain('=== Pinned Facts (2) ===');
    expect(output).toContain('• Using TypeScript');
    expect(output).toContain('• Prefer functional programming');
  });

  it('should display correct profile name', async () => {
    // Change active profile to build
    await writeFile(join(testDir, 'active'), 'build');

    // Create build profile
    const buildProfile: Profile = {
      name: 'build',
      focus: 'Side projects',
      priorities: ['Ship fast', 'Learn'],
      constraints: ['Limited time'],
      tone: 'Pragmatic'
    };
    await writeJSON(join(testDir, 'profiles', 'build.json'), buildProfile);

    // Create a directory without .llmenv
    const nonProjectDir = join(testDir, 'non-project');
    await mkdir(nonProjectDir, { recursive: true });

    // Mock console.log to capture output
    const logs: string[] = [];
    const originalLog = console.log;
    console.log = vi.fn((...args: any[]) => {
      logs.push(args.join(' '));
    });

    // Run status command
    await statusCommand(nonProjectDir);

    // Restore console.log
    console.log = originalLog;

    // Verify output contains correct profile
    const output = logs.join('\n');
    expect(output).toContain('=== Active Profile: build ===');
    expect(output).toContain('Active profile: build');
    expect(output).toContain('Side projects');
  });

  it('should handle nested project directories', async () => {
    // Create a project directory with .llmenv
    const projectDir = join(testDir, 'test-project');
    await mkdir(projectDir, { recursive: true });

    const projectConfig: ProjectConfig = {
      project: 'Parent Project',
      stack: ['TypeScript'],
      avoid: [],
      context: 'Parent context',
      priorities: []
    };
    await writeJSON(join(projectDir, '.llmenv'), projectConfig);

    // Create a nested subdirectory
    const nestedDir = join(projectDir, 'src', 'components');
    await mkdir(nestedDir, { recursive: true });

    // Mock console.log to capture output
    const logs: string[] = [];
    const originalLog = console.log;
    console.log = vi.fn((...args: any[]) => {
      logs.push(args.join(' '));
    });

    // Run status command from nested directory
    await statusCommand(nestedDir);

    // Restore console.log
    console.log = originalLog;

    // Verify it found the parent project
    const output = logs.join('\n');
    expect(output).toContain('✓ Project: Parent Project');
    expect(output).toContain('=== Current Project: Parent Project ===');
  });
});
