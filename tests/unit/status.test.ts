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
    testDir = await mkdtemp(join(tmpdir(), 'llmenv-status-test-'));
    originalEnv = process.env.LLMENV_HOME;
    process.env.LLMENV_HOME = testDir;

    await mkdir(join(testDir, 'profiles'), { recursive: true });
    await mkdir(join(testDir, 'history'), { recursive: true });

    const globalIdentity: GlobalIdentity = {
      name: 'Test User',
      role: 'Developer',
      experience: '5 years',
      preferences: ['TypeScript', 'Testing'],
      communication: 'Clear and concise'
    };
    await writeJSON(join(testDir, 'default.json'), globalIdentity);

    await writeFile(join(testDir, 'active'), 'build');

    const buildProfile: Profile = {
      name: 'build',
      focus: 'Production code',
      priorities: ['Reliability', 'Performance'],
      constraints: ['Code review required'],
      tone: 'Professional'
    };
    await writeJSON(join(testDir, 'profiles', 'build.json'), buildProfile);

    await writeJSON(join(testDir, 'projects.json'), []);
    await writeJSON(join(testDir, 'pins.json'), []);
  });

  afterEach(async () => {
    await rm(testDir, { recursive: true, force: true });
    if (originalEnv !== undefined) {
      process.env.LLMENV_HOME = originalEnv;
    } else {
      delete process.env.LLMENV_HOME;
    }
    vi.restoreAllMocks();
  });

  it('should display context with project when .llmenv exists', async () => {
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

    const logs: string[] = [];
    const originalLog = console.log;
    console.log = vi.fn((...args: any[]) => {
      logs.push(args.join(' '));
    });

    await statusCommand(projectDir);
    console.log = originalLog;

    const output = logs.join('\n');
    expect(output).toContain('Global Identity');
    expect(output).toContain('Test User');
    expect(output).toContain('Active Profile');
    expect(output).toContain('Current Project');
    expect(output).toContain('TypeScript, Node.js');
    expect(output).toContain('Production code');
  });

  it('should display warning when no project is detected', async () => {
    const nonProjectDir = join(testDir, 'non-project');
    await mkdir(nonProjectDir, { recursive: true });

    const logs: string[] = [];
    const originalLog = console.log;
    console.log = vi.fn((...args: any[]) => {
      logs.push(args.join(' '));
    });

    await statusCommand(nonProjectDir);
    console.log = originalLog;

    const output = logs.join('\n');
    expect(output).toContain('Global Identity');
    expect(output).toContain('Active Profile');
    expect(output).not.toContain('Current Project');
    expect(output).toContain('No project detected in current directory');
  });

  it('should display pin count when pins exist', async () => {
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

    const nonProjectDir = join(testDir, 'non-project');
    await mkdir(nonProjectDir, { recursive: true });

    const logs: string[] = [];
    const originalLog = console.log;
    console.log = vi.fn((...args: any[]) => {
      logs.push(args.join(' '));
    });

    await statusCommand(nonProjectDir);
    console.log = originalLog;

    const output = logs.join('\n');
    expect(output).toContain('Pinned Facts');
    expect(output).toContain('2 pins');
  });

  it('should display correct profile name', async () => {
    await writeFile(join(testDir, 'active'), 'build');

    const buildProfile: Profile = {
      name: 'build',
      focus: 'Side projects',
      priorities: ['Ship fast', 'Learn'],
      constraints: ['Limited time'],
      tone: 'Pragmatic'
    };
    await writeJSON(join(testDir, 'profiles', 'build.json'), buildProfile);

    const nonProjectDir = join(testDir, 'non-project');
    await mkdir(nonProjectDir, { recursive: true });

    const logs: string[] = [];
    const originalLog = console.log;
    console.log = vi.fn((...args: any[]) => {
      logs.push(args.join(' '));
    });

    await statusCommand(nonProjectDir);
    console.log = originalLog;

    const output = logs.join('\n');
    expect(output).toContain('Active Profile');
    expect(output).toContain('build');
    expect(output).toContain('Side projects');
  });

  it('should handle nested project directories', async () => {
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

    const nestedDir = join(projectDir, 'src', 'components');
    await mkdir(nestedDir, { recursive: true });

    const logs: string[] = [];
    const originalLog = console.log;
    console.log = vi.fn((...args: any[]) => {
      logs.push(args.join(' '));
    });

    await statusCommand(nestedDir);
    console.log = originalLog;

    const output = logs.join('\n');
    expect(output).toContain('Current Project');
    expect(output).toContain('Parent Project');
  });
});
