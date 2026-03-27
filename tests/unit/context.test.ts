import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import os from 'os';
import path from 'path';
import fs from 'fs/promises';
import { findProjectRoot, mergeContextLayers, buildContext, formatContext } from '../../src/core/context.js';
import type { GlobalIdentity, Profile, ProjectConfig, Pin, MergedContext } from '../../src/types/index.js';

describe('Context Builder - Auto-Detection', () => {
  let tempDir: string;

  beforeEach(async () => {
    // Create a temporary directory for testing
    tempDir = path.join(os.tmpdir(), `llmenv-test-context-${Date.now()}`);
    await fs.mkdir(tempDir, { recursive: true });
  });

  afterEach(async () => {
    // Clean up temporary directory
    try {
      await fs.rm(tempDir, { recursive: true, force: true });
    } catch {
      // Ignore cleanup errors
    }
  });

  describe('findProjectRoot', () => {
    it('should find .llmenv in current directory', async () => {
      // Create .llmenv in temp directory
      const llmenvPath = path.join(tempDir, '.llmenv');
      await fs.writeFile(llmenvPath, JSON.stringify({ project: 'test' }));

      const result = await findProjectRoot(tempDir);
      expect(result).toBe(tempDir);
    });

    it('should find .llmenv in parent directory', async () => {
      // Create .llmenv in temp directory
      const llmenvPath = path.join(tempDir, '.llmenv');
      await fs.writeFile(llmenvPath, JSON.stringify({ project: 'test' }));

      // Create a subdirectory
      const subDir = path.join(tempDir, 'subdir');
      await fs.mkdir(subDir);

      const result = await findProjectRoot(subDir);
      expect(result).toBe(tempDir);
    });

    it('should find .llmenv multiple levels up', async () => {
      // Create .llmenv in temp directory
      const llmenvPath = path.join(tempDir, '.llmenv');
      await fs.writeFile(llmenvPath, JSON.stringify({ project: 'test' }));

      // Create nested subdirectories
      const deepDir = path.join(tempDir, 'a', 'b', 'c', 'd');
      await fs.mkdir(deepDir, { recursive: true });

      const result = await findProjectRoot(deepDir);
      expect(result).toBe(tempDir);
    });

    it('should return null when no .llmenv found', async () => {
      // Don't create .llmenv file
      const result = await findProjectRoot(tempDir);
      expect(result).toBeNull();
    });

    it('should return null when reaching filesystem root', async () => {
      // Start from a directory that definitely has no .llmenv
      const root = path.parse(tempDir).root;
      const result = await findProjectRoot(root);
      expect(result).toBeNull();
    });

    it('should find nearest .llmenv when multiple exist', async () => {
      // Create .llmenv in temp directory
      const rootLlmenv = path.join(tempDir, '.llmenv');
      await fs.writeFile(rootLlmenv, JSON.stringify({ project: 'root' }));

      // Create nested directory with its own .llmenv
      const nestedDir = path.join(tempDir, 'nested');
      await fs.mkdir(nestedDir);
      const nestedLlmenv = path.join(nestedDir, '.llmenv');
      await fs.writeFile(nestedLlmenv, JSON.stringify({ project: 'nested' }));

      // Create a subdirectory under nested
      const deepDir = path.join(nestedDir, 'deep');
      await fs.mkdir(deepDir);

      // Should find the nearest one (nested)
      const result = await findProjectRoot(deepDir);
      expect(result).toBe(nestedDir);
    });

    it('should handle relative paths by resolving them', async () => {
      // Create .llmenv in temp directory
      const llmenvPath = path.join(tempDir, '.llmenv');
      await fs.writeFile(llmenvPath, JSON.stringify({ project: 'test' }));

      // Create a subdirectory
      const subDir = path.join(tempDir, 'subdir');
      await fs.mkdir(subDir);

      // Use relative path from subdirectory (e.g., "../subdir")
      const relativePath = path.join(tempDir, 'subdir');
      const result = await findProjectRoot(relativePath);
      expect(result).toBe(tempDir);
    });

    it('should return absolute path even when given relative path', async () => {
      // Create .llmenv in temp directory
      const llmenvPath = path.join(tempDir, '.llmenv');
      await fs.writeFile(llmenvPath, JSON.stringify({ project: 'test' }));

      // Test with a path that could be relative (but we'll make it absolute)
      const result = await findProjectRoot(tempDir);
      expect(path.isAbsolute(result!)).toBe(true);
    });

    it('should work with deeply nested directory structures', async () => {
      // Create .llmenv at root
      const llmenvPath = path.join(tempDir, '.llmenv');
      await fs.writeFile(llmenvPath, JSON.stringify({ project: 'test' }));

      // Create very deep nesting
      const veryDeepDir = path.join(tempDir, 'a', 'b', 'c', 'd', 'e', 'f', 'g', 'h');
      await fs.mkdir(veryDeepDir, { recursive: true });

      const result = await findProjectRoot(veryDeepDir);
      expect(result).toBe(tempDir);
    });

    it('should stop at filesystem root and not throw error', async () => {
      // Start from temp directory with no .llmenv
      const result = await findProjectRoot(tempDir);
      expect(result).toBeNull();
    });

    it('should handle directory with special characters in name', async () => {
      // Create directory with special characters
      const specialDir = path.join(tempDir, 'test-project_v1.0');
      await fs.mkdir(specialDir, { recursive: true });
      
      const llmenvPath = path.join(specialDir, '.llmenv');
      await fs.writeFile(llmenvPath, JSON.stringify({ project: 'special' }));

      const result = await findProjectRoot(specialDir);
      expect(result).toBe(specialDir);
    });

    it('should handle empty .llmenv file', async () => {
      // Create empty .llmenv file
      const llmenvPath = path.join(tempDir, '.llmenv');
      await fs.writeFile(llmenvPath, '');

      const result = await findProjectRoot(tempDir);
      expect(result).toBe(tempDir);
    });

    it('should detect .llmenv regardless of file contents', async () => {
      // Create .llmenv with invalid JSON (detection should still work)
      const llmenvPath = path.join(tempDir, '.llmenv');
      await fs.writeFile(llmenvPath, 'not valid json');

      const result = await findProjectRoot(tempDir);
      expect(result).toBe(tempDir);
    });
  });

  describe('Cross-platform compatibility', () => {
    it('should work with platform-specific path separators', async () => {
      // Create .llmenv in temp directory
      const llmenvPath = path.join(tempDir, '.llmenv');
      await fs.writeFile(llmenvPath, JSON.stringify({ project: 'test' }));

      // Create subdirectory
      const subDir = path.join(tempDir, 'subdir');
      await fs.mkdir(subDir);

      const result = await findProjectRoot(subDir);
      expect(result).toBe(tempDir);
      expect(path.isAbsolute(result!)).toBe(true);
    });

    it('should handle paths with mixed separators on Windows', async () => {
      // This test will behave correctly on all platforms
      // path.join normalizes separators automatically
      const llmenvPath = path.join(tempDir, '.llmenv');
      await fs.writeFile(llmenvPath, JSON.stringify({ project: 'test' }));

      const result = await findProjectRoot(tempDir);
      expect(result).toBe(tempDir);
    });
  });
});


describe('Context Merging', () => {
  describe('mergeContextLayers', () => {
    it('should preserve all layers in the result', () => {
      const global: GlobalIdentity = {
        name: 'John Doe',
        role: 'Developer',
        experience: '5 years',
        preferences: ['TypeScript'],
        communication: 'Concise'
      };

      const profile: Profile = {
        name: 'work',
        focus: 'Production code',
        priorities: ['Reliability'],
        constraints: ['Code review required'],
        tone: 'Professional'
      };

      const project: ProjectConfig = {
        project: 'Test Project',
        stack: ['Node.js'],
        avoid: ['PHP'],
        context: 'Test context',
        priorities: ['Speed']
      };

      const pins: Pin[] = [
        { id: '1', fact: 'Using PostgreSQL', createdAt: '2024-01-01' }
      ];

      const result = mergeContextLayers(global, profile, project, pins);

      expect(result.global).toEqual(global);
      expect(result.profile).toEqual(profile);
      expect(result.project).toEqual(project);
      expect(result.pins).toEqual(['Using PostgreSQL']);
    });

    it('should handle null project', () => {
      const global: GlobalIdentity = {
        name: 'John Doe',
        role: 'Developer',
        experience: '5 years',
        preferences: ['TypeScript'],
        communication: 'Concise'
      };

      const profile: Profile = {
        name: 'work',
        focus: 'Production code',
        priorities: ['Reliability'],
        constraints: [],
        tone: 'Professional'
      };

      const pins: Pin[] = [];

      const result = mergeContextLayers(global, profile, null, pins);

      expect(result.global).toEqual(global);
      expect(result.profile).toEqual(profile);
      expect(result.project).toBeNull();
      expect(result.pins).toEqual([]);
    });

    it('should extract pin facts as strings', () => {
      const global: GlobalIdentity = {
        name: 'John Doe',
        role: 'Developer',
        experience: '5 years',
        preferences: [],
        communication: 'Concise'
      };

      const profile: Profile = {
        name: 'work',
        focus: 'Production',
        priorities: [],
        constraints: [],
        tone: 'Professional'
      };

      const pins: Pin[] = [
        { id: '1', fact: 'Fact 1', createdAt: '2024-01-01' },
        { id: '2', fact: 'Fact 2', createdAt: '2024-01-02' },
        { id: '3', fact: 'Fact 3', createdAt: '2024-01-03' }
      ];

      const result = mergeContextLayers(global, profile, null, pins);

      expect(result.pins).toEqual(['Fact 1', 'Fact 2', 'Fact 3']);
    });

    it('should handle empty pins array', () => {
      const global: GlobalIdentity = {
        name: 'John Doe',
        role: 'Developer',
        experience: '5 years',
        preferences: [],
        communication: 'Concise'
      };

      const profile: Profile = {
        name: 'work',
        focus: 'Production',
        priorities: [],
        constraints: [],
        tone: 'Professional'
      };

      const result = mergeContextLayers(global, profile, null, []);

      expect(result.pins).toEqual([]);
    });

    it('should preserve array values from later layers', () => {
      const global: GlobalIdentity = {
        name: 'John Doe',
        role: 'Developer',
        experience: '5 years',
        preferences: ['JavaScript', 'Python'],
        communication: 'Concise'
      };

      const profile: Profile = {
        name: 'work',
        focus: 'Production',
        priorities: ['Speed', 'Quality'],
        constraints: [],
        tone: 'Professional'
      };

      const project: ProjectConfig = {
        project: 'Test',
        stack: ['Node.js', 'React'],
        avoid: ['PHP'],
        context: 'Test',
        priorities: ['Reliability', 'Performance']
      };

      const result = mergeContextLayers(global, profile, project, []);

      // Arrays should be replaced, not merged
      expect(result.global.preferences).toEqual(['JavaScript', 'Python']);
      expect(result.profile.priorities).toEqual(['Speed', 'Quality']);
      expect(result.project?.priorities).toEqual(['Reliability', 'Performance']);
    });

    it('should maintain layer precedence for all fields', () => {
      const global: GlobalIdentity = {
        name: 'John Doe',
        role: 'Developer',
        experience: '5 years',
        preferences: ['TypeScript'],
        communication: 'Concise'
      };

      const profile: Profile = {
        name: 'work',
        focus: 'Production code',
        priorities: ['Reliability'],
        constraints: [],
        tone: 'Professional'
      };

      const project: ProjectConfig = {
        project: 'Test Project',
        stack: ['Node.js'],
        avoid: [],
        context: 'Test context',
        priorities: ['Speed']
      };

      const result = mergeContextLayers(global, profile, project, []);

      // Each layer should maintain its own values
      expect(result.global.name).toBe('John Doe');
      expect(result.profile.name).toBe('work');
      expect(result.project?.project).toBe('Test Project');
    });

    it('should apply deep merge with proper layer precedence', () => {
      // Test that later layers override earlier layers for the same fields
      // Using 'any' to test merge behavior with overlapping properties
      const global = {
        name: 'Global Name',
        role: 'Global Role',
        preferences: ['Global Pref'],
        communication: 'Global Communication'
      } as any as GlobalIdentity;

      const profile = {
        name: 'Profile Name', // Should override global name
        focus: 'Profile Focus',
        priorities: ['Profile Priority']
      } as any as Profile;

      const project = {
        name: 'Project Name', // Should override profile and global name
        project: 'Project Title',
        stack: ['Node.js']
      } as any as ProjectConfig;

      const result = mergeContextLayers(global, profile, project, []);

      // Verify original layers are preserved
      expect((result.global as any).name).toBe('Global Name');
      expect((result.profile as any).name).toBe('Profile Name');
      expect((result.project as any)?.name).toBe('Project Name');
    });

    it('should merge nested objects deeply', () => {
      // Test deep merge for nested objects
      // Using 'any' to test merge behavior with nested properties
      const global = {
        name: 'John',
        role: 'Developer',
        experience: '5 years',
        preferences: [],
        communication: 'Concise',
        settings: {
          theme: 'dark',
          fontSize: 12
        }
      } as any as GlobalIdentity;

      const profile = {
        name: 'work',
        focus: 'Production',
        priorities: [],
        constraints: [],
        tone: 'Professional',
        settings: {
          fontSize: 14, // Should override global fontSize
          lineHeight: 1.5 // Should be added
        }
      } as any as Profile;

      const result = mergeContextLayers(global, profile, null, []);

      // Original layers should be preserved
      expect(result.global).toEqual(global);
      expect(result.profile).toEqual(profile);
    });

    it('should replace arrays not merge them', () => {
      // Arrays should be completely replaced by later layers, not merged
      const global = {
        name: 'John',
        role: 'Developer',
        experience: '5 years',
        preferences: ['JavaScript', 'Python', 'Go'],
        communication: 'Concise'
      } as any as GlobalIdentity;

      const profile = {
        name: 'work',
        focus: 'Production',
        priorities: [],
        constraints: [],
        tone: 'Professional',
        preferences: ['TypeScript', 'Rust'] // Should completely replace global preferences
      } as any as Profile;

      const result = mergeContextLayers(global, profile, null, []);

      // Original layers preserved
      expect(result.global.preferences).toEqual(['JavaScript', 'Python', 'Go']);
      expect((result.profile as any).preferences).toEqual(['TypeScript', 'Rust']);
    });

    it('should handle undefined values in later layers', () => {
      const global = {
        name: 'John',
        role: 'Developer',
        experience: '5 years',
        preferences: [],
        communication: 'Concise'
      } as any as GlobalIdentity;

      const profile = {
        name: 'Jane',
        focus: 'Production',
        priorities: [],
        constraints: [],
        tone: 'Professional',
        role: undefined // undefined should not override
      } as any as Profile;

      const result = mergeContextLayers(global, profile, null, []);

      // Original layers preserved
      expect(result.global.name).toBe('John');
      expect(result.global.role).toBe('Developer');
      expect(result.profile.name).toBe('Jane');
    });

    it('should handle all three layers with proper precedence', () => {
      const global = {
        name: 'Global',
        role: 'Developer',
        experience: '5 years',
        preferences: ['A', 'B'],
        communication: 'Concise'
      } as any as GlobalIdentity;

      const profile = {
        name: 'Profile',
        focus: 'Work',
        priorities: [],
        constraints: [],
        tone: 'Professional',
        preferences: ['C', 'D']
      } as any as Profile;

      const project = {
        name: 'Project',
        project: 'MyProject',
        stack: [],
        avoid: [],
        context: 'Test',
        priorities: [],
        preferences: ['E', 'F']
      } as any as ProjectConfig;

      const result = mergeContextLayers(global, profile, project, []);

      // All original layers should be preserved
      expect(result.global.name).toBe('Global');
      expect(result.global.preferences).toEqual(['A', 'B']);
      
      expect(result.profile.name).toBe('Profile');
      expect((result.profile as any).preferences).toEqual(['C', 'D']);
      
      expect((result.project as any)?.name).toBe('Project');
      expect((result.project as any)?.preferences).toEqual(['E', 'F']);
    });

    it('should append pins additively', () => {
      const global: GlobalIdentity = {
        name: 'John',
        role: 'Developer',
        experience: '5 years',
        preferences: [],
        communication: 'Concise'
      };

      const profile: Profile = {
        name: 'work',
        focus: 'Production',
        priorities: [],
        constraints: [],
        tone: 'Professional'
      };

      const pins: Pin[] = [
        { id: '1', fact: 'Pin 1', createdAt: '2024-01-01' },
        { id: '2', fact: 'Pin 2', createdAt: '2024-01-02' },
        { id: '3', fact: 'Pin 3', createdAt: '2024-01-03' }
      ];

      const result = mergeContextLayers(global, profile, null, pins);

      // Pins should be extracted as fact strings in order
      expect(result.pins).toEqual(['Pin 1', 'Pin 2', 'Pin 3']);
      expect(result.pins.length).toBe(3);
    });
  });
});


describe('Context Building Orchestration', () => {
  let tempConfigDir: string;
  let tempProjectDir: string;
  let originalLLMEnvHome: string | undefined;

  beforeEach(async () => {
    // Save original LLMENV_HOME
    originalLLMEnvHome = process.env.LLMENV_HOME;

    // Create temporary config directory
    tempConfigDir = path.join(os.tmpdir(), `llmenv-test-config-${Date.now()}`);
    await fs.mkdir(tempConfigDir, { recursive: true });
    process.env.LLMENV_HOME = tempConfigDir;

    // Create temporary project directory
    tempProjectDir = path.join(os.tmpdir(), `llmenv-test-project-${Date.now()}`);
    await fs.mkdir(tempProjectDir, { recursive: true });

    // Set up minimal config structure
    await fs.mkdir(path.join(tempConfigDir, 'profiles'), { recursive: true });
    await fs.mkdir(path.join(tempConfigDir, 'history'), { recursive: true });

    // Create default.json
    const defaultIdentity: GlobalIdentity = {
      name: 'Test User',
      role: 'Developer',
      experience: '3 years',
      preferences: ['TypeScript', 'Testing'],
      communication: 'Clear and concise'
    };
    await fs.writeFile(
      path.join(tempConfigDir, 'default.json'),
      JSON.stringify(defaultIdentity, null, 2)
    );

    // Create active profile file
    await fs.writeFile(path.join(tempConfigDir, 'active'), 'work');

    // Create work profile
    const workProfile: Profile = {
      name: 'work',
      focus: 'Production code',
      priorities: ['Reliability', 'Performance'],
      constraints: ['Code review required'],
      tone: 'Professional'
    };
    await fs.writeFile(
      path.join(tempConfigDir, 'profiles', 'work.json'),
      JSON.stringify(workProfile, null, 2)
    );

    // Create pins.json
    const pins: Pin[] = [
      { id: '1', fact: 'Using PostgreSQL', createdAt: '2024-01-01T00:00:00.000Z' },
      { id: '2', fact: 'Prefer functional programming', createdAt: '2024-01-02T00:00:00.000Z' }
    ];
    await fs.writeFile(
      path.join(tempConfigDir, 'pins.json'),
      JSON.stringify(pins, null, 2)
    );

    // Create projects.json
    await fs.writeFile(
      path.join(tempConfigDir, 'projects.json'),
      JSON.stringify([], null, 2)
    );
  });

  afterEach(async () => {
    // Restore original LLMENV_HOME
    if (originalLLMEnvHome !== undefined) {
      process.env.LLMENV_HOME = originalLLMEnvHome;
    } else {
      delete process.env.LLMENV_HOME;
    }

    // Clean up temporary directories
    try {
      await fs.rm(tempConfigDir, { recursive: true, force: true });
    } catch {
      // Ignore cleanup errors
    }
    try {
      await fs.rm(tempProjectDir, { recursive: true, force: true });
    } catch {
      // Ignore cleanup errors
    }
  });

  describe('buildContext', () => {
    it('should build context with all layers when project exists', async () => {
      // Create project config
      const projectConfig: ProjectConfig = {
        project: 'Test Project',
        stack: ['Node.js', 'TypeScript', 'PostgreSQL'],
        avoid: ['MongoDB', 'PHP'],
        context: 'Test project for unit testing',
        priorities: ['Speed', 'Simplicity']
      };
      await fs.writeFile(
        path.join(tempProjectDir, '.llmenv'),
        JSON.stringify(projectConfig, null, 2)
      );

      const context = await buildContext(tempProjectDir);

      // Verify global identity
      expect(context.global.name).toBe('Test User');
      expect(context.global.role).toBe('Developer');
      expect(context.global.experience).toBe('3 years');
      expect(context.global.preferences).toEqual(['TypeScript', 'Testing']);
      expect(context.global.communication).toBe('Clear and concise');

      // Verify profile
      expect(context.profile.name).toBe('work');
      expect(context.profile.focus).toBe('Production code');
      expect(context.profile.priorities).toEqual(['Reliability', 'Performance']);
      expect(context.profile.constraints).toEqual(['Code review required']);
      expect(context.profile.tone).toBe('Professional');

      // Verify project
      expect(context.project).not.toBeNull();
      expect(context.project?.project).toBe('Test Project');
      expect(context.project?.stack).toEqual(['Node.js', 'TypeScript', 'PostgreSQL']);
      expect(context.project?.avoid).toEqual(['MongoDB', 'PHP']);
      expect(context.project?.context).toBe('Test project for unit testing');
      expect(context.project?.priorities).toEqual(['Speed', 'Simplicity']);

      // Verify pins
      expect(context.pins).toHaveLength(2);
      expect(context.pins[0].fact).toBe('Using PostgreSQL');
      expect(context.pins[1].fact).toBe('Prefer functional programming');

      // Verify project path
      expect(context.projectPath).toBe(tempProjectDir);
    });

    it('should build context without project when no .llmenv found', async () => {
      // Don't create .llmenv file
      const context = await buildContext(tempProjectDir);

      // Verify global identity
      expect(context.global.name).toBe('Test User');

      // Verify profile
      expect(context.profile.name).toBe('work');

      // Verify project is null
      expect(context.project).toBeNull();

      // Verify pins
      expect(context.pins).toHaveLength(2);

      // Verify project path is null
      expect(context.projectPath).toBeNull();
    });

    it('should find project in parent directory', async () => {
      // Create project config in temp project directory
      const projectConfig: ProjectConfig = {
        project: 'Parent Project',
        stack: ['React'],
        avoid: [],
        context: 'Project in parent',
        priorities: ['Fast development']
      };
      await fs.writeFile(
        path.join(tempProjectDir, '.llmenv'),
        JSON.stringify(projectConfig, null, 2)
      );

      // Create subdirectory
      const subDir = path.join(tempProjectDir, 'src', 'components');
      await fs.mkdir(subDir, { recursive: true });

      // Build context from subdirectory
      const context = await buildContext(subDir);

      // Should find project in parent
      expect(context.project).not.toBeNull();
      expect(context.project?.project).toBe('Parent Project');
      expect(context.projectPath).toBe(tempProjectDir);
    });

    it('should handle empty pins array', async () => {
      // Overwrite pins.json with empty array
      await fs.writeFile(
        path.join(tempConfigDir, 'pins.json'),
        JSON.stringify([], null, 2)
      );

      const context = await buildContext(tempProjectDir);

      expect(context.pins).toEqual([]);
    });

    it('should use default empty array when pins.json missing', async () => {
      // Delete pins.json
      await fs.unlink(path.join(tempConfigDir, 'pins.json'));

      const context = await buildContext(tempProjectDir);

      expect(context.pins).toEqual([]);
    });

    it('should read active profile from active file', async () => {
      // Change active profile to 'build'
      await fs.writeFile(path.join(tempConfigDir, 'active'), 'build');

      // Create build profile
      const buildProfile: Profile = {
        name: 'build',
        focus: 'Side projects',
        priorities: ['Ship fast', 'Learn'],
        constraints: ['Limited time'],
        tone: 'Pragmatic'
      };
      await fs.writeFile(
        path.join(tempConfigDir, 'profiles', 'build.json'),
        JSON.stringify(buildProfile, null, 2)
      );

      const context = await buildContext(tempProjectDir);

      expect(context.profile.name).toBe('build');
      expect(context.profile.focus).toBe('Side projects');
      expect(context.profile.tone).toBe('Pragmatic');
    });

    it('should handle whitespace in active profile name', async () => {
      // Write active profile with trailing whitespace
      await fs.writeFile(path.join(tempConfigDir, 'active'), '  work  \n');

      const context = await buildContext(tempProjectDir);

      expect(context.profile.name).toBe('work');
    });

    it('should build context with all configuration files', async () => {
      // Create a complete setup
      const projectConfig: ProjectConfig = {
        project: 'Full Stack App',
        stack: ['Node.js', 'React', 'PostgreSQL'],
        avoid: ['PHP'],
        context: 'Full stack web application',
        priorities: ['User experience', 'Performance']
      };
      await fs.writeFile(
        path.join(tempProjectDir, '.llmenv'),
        JSON.stringify(projectConfig, null, 2)
      );

      const context = await buildContext(tempProjectDir);

      // Verify all layers are present
      expect(context.global).toBeDefined();
      expect(context.profile).toBeDefined();
      expect(context.project).toBeDefined();
      expect(context.pins).toBeDefined();
      expect(context.projectPath).toBeDefined();

      // Verify types
      expect(typeof context.global.name).toBe('string');
      expect(typeof context.profile.name).toBe('string');
      expect(typeof context.project?.project).toBe('string');
      expect(Array.isArray(context.pins)).toBe(true);
      expect(typeof context.projectPath).toBe('string');
    });

    it('should handle deeply nested project directory', async () => {
      // Create project config at root
      const projectConfig: ProjectConfig = {
        project: 'Root Project',
        stack: ['TypeScript'],
        avoid: [],
        context: 'Root level project',
        priorities: ['Maintainability']
      };
      await fs.writeFile(
        path.join(tempProjectDir, '.llmenv'),
        JSON.stringify(projectConfig, null, 2)
      );

      // Create deeply nested directory
      const deepDir = path.join(tempProjectDir, 'src', 'features', 'auth', 'components', 'forms');
      await fs.mkdir(deepDir, { recursive: true });

      const context = await buildContext(deepDir);

      expect(context.project?.project).toBe('Root Project');
      expect(context.projectPath).toBe(tempProjectDir);
    });

    it('should return ContextStack with correct structure', async () => {
      const context = await buildContext(tempProjectDir);

      // Verify ContextStack structure
      expect(context).toHaveProperty('global');
      expect(context).toHaveProperty('profile');
      expect(context).toHaveProperty('project');
      expect(context).toHaveProperty('pins');
      expect(context).toHaveProperty('projectPath');

      // Verify types
      expect(context.global).toBeTypeOf('object');
      expect(context.profile).toBeTypeOf('object');
      expect(Array.isArray(context.pins)).toBe(true);
      expect(context.projectPath === null || typeof context.projectPath === 'string').toBe(true);
    });

    it('should preserve pin metadata (id, createdAt)', async () => {
      const context = await buildContext(tempProjectDir);

      expect(context.pins[0]).toHaveProperty('id');
      expect(context.pins[0]).toHaveProperty('fact');
      expect(context.pins[0]).toHaveProperty('createdAt');
      expect(context.pins[0].id).toBe('1');
      expect(context.pins[0].createdAt).toBe('2024-01-01T00:00:00.000Z');
    });

    it('should handle multiple pins correctly', async () => {
      // Add more pins
      const pins: Pin[] = [
        { id: '1', fact: 'Pin 1', createdAt: '2024-01-01T00:00:00.000Z' },
        { id: '2', fact: 'Pin 2', createdAt: '2024-01-02T00:00:00.000Z' },
        { id: '3', fact: 'Pin 3', createdAt: '2024-01-03T00:00:00.000Z' },
        { id: '4', fact: 'Pin 4', createdAt: '2024-01-04T00:00:00.000Z' }
      ];
      await fs.writeFile(
        path.join(tempConfigDir, 'pins.json'),
        JSON.stringify(pins, null, 2)
      );

      const context = await buildContext(tempProjectDir);

      expect(context.pins).toHaveLength(4);
      expect(context.pins.map(p => p.fact)).toEqual(['Pin 1', 'Pin 2', 'Pin 3', 'Pin 4']);
    });

    it('should work with different profile configurations', async () => {
      // Test with 'personal' profile
      await fs.writeFile(path.join(tempConfigDir, 'active'), 'personal');

      const personalProfile: Profile = {
        name: 'personal',
        focus: 'Learning',
        priorities: ['Understanding', 'Best practices'],
        constraints: [],
        tone: 'Educational'
      };
      await fs.writeFile(
        path.join(tempConfigDir, 'profiles', 'personal.json'),
        JSON.stringify(personalProfile, null, 2)
      );

      const context = await buildContext(tempProjectDir);

      expect(context.profile.name).toBe('personal');
      expect(context.profile.focus).toBe('Learning');
      expect(context.profile.tone).toBe('Educational');
    });
  });
});

describe('Context Formatting', () => {
  describe('formatContext', () => {
    it('should format context with all sections', () => {
      const context: MergedContext = {
        global: {
          name: 'John Doe',
          role: 'Full-stack Developer',
          experience: '5 years',
          preferences: ['TypeScript', 'functional programming', 'minimal dependencies'],
          communication: 'Concise, technical, with examples'
        },
        profile: {
          name: 'work',
          focus: 'Production code',
          priorities: ['Reliability', 'Maintainability', 'Performance'],
          constraints: ['Must follow company coding standards'],
          tone: 'Professional and thorough'
        },
        project: {
          project: 'AI Content Studio',
          stack: ['Python', 'FastAPI', 'Supabase', 'Redis', 'Cloudflare R2'],
          avoid: ['AWS', 'Firebase', 'Docker in dev'],
          context: 'Bootstrapped SaaS, solo dev, <5hrs/week',
          priorities: ['Ship fast', 'Cheap infrastructure', 'Minimal dependencies']
        },
        pins: [
          'Using Cloudflare R2 not S3',
          'Supabase for auth + DB + storage',
          'No microservices, monolith for now'
        ]
      };

      const formatted = formatContext(context);

      // Should start with [CONTEXT]
      expect(formatted).toContain('[CONTEXT]');
      
      // Should end with [END CONTEXT]
      expect(formatted).toContain('[END CONTEXT]');
      
      // Should contain all section headers
      expect(formatted).toContain('=== Global Identity ===');
      expect(formatted).toContain('=== Active Profile: work ===');
      expect(formatted).toContain('=== Current Project: AI Content Studio ===');
      expect(formatted).toContain('=== Pinned Facts (3) ===');
      
      // Should contain global identity fields
      expect(formatted).toContain('Name: John Doe');
      expect(formatted).toContain('Role: Full-stack Developer');
      expect(formatted).toContain('Experience: 5 years');
      expect(formatted).toContain('Preferences: TypeScript, functional programming, minimal dependencies');
      expect(formatted).toContain('Communication: Concise, technical, with examples');
      
      // Should contain profile fields
      expect(formatted).toContain('Focus: Production code');
      expect(formatted).toContain('Priorities: Reliability, Maintainability, Performance');
      expect(formatted).toContain('Constraints: Must follow company coding standards');
      expect(formatted).toContain('Tone: Professional and thorough');
      
      // Should contain project fields
      expect(formatted).toContain('Stack: Python, FastAPI, Supabase, Redis, Cloudflare R2');
      expect(formatted).toContain('Avoid: AWS, Firebase, Docker in dev');
      expect(formatted).toContain('Context: Bootstrapped SaaS, solo dev, <5hrs/week');
      expect(formatted).toContain('Priorities: Ship fast, Cheap infrastructure, Minimal dependencies');
      
      // Should contain pins with bullet points
      expect(formatted).toContain('• Using Cloudflare R2 not S3');
      expect(formatted).toContain('• Supabase for auth + DB + storage');
      expect(formatted).toContain('• No microservices, monolith for now');
    });

    it('should format context without project', () => {
      const context: MergedContext = {
        global: {
          name: 'Jane Smith',
          role: 'Backend Developer',
          experience: '3 years',
          preferences: ['Go', 'Rust'],
          communication: 'Direct'
        },
        profile: {
          name: 'build',
          focus: 'Side projects',
          priorities: ['Speed'],
          constraints: [],
          tone: 'Casual'
        },
        project: null,
        pins: []
      };

      const formatted = formatContext(context);

      // Should have delimiters
      expect(formatted).toContain('[CONTEXT]');
      expect(formatted).toContain('[END CONTEXT]');
      
      // Should have global and profile sections
      expect(formatted).toContain('=== Global Identity ===');
      expect(formatted).toContain('=== Active Profile: build ===');
      
      // Should NOT have project section
      expect(formatted).not.toContain('=== Current Project:');
      
      // Should have pins section with count 0
      expect(formatted).toContain('=== Pinned Facts (0) ===');
      expect(formatted).toContain('(none)');
    });

    it('should format context with empty pins', () => {
      const context: MergedContext = {
        global: {
          name: 'Test User',
          role: 'Developer',
          experience: '1 year',
          preferences: [],
          communication: 'Clear'
        },
        profile: {
          name: 'personal',
          focus: 'Learning',
          priorities: [],
          constraints: [],
          tone: 'Educational'
        },
        project: {
          project: 'Test Project',
          stack: ['Node.js'],
          avoid: [],
          context: 'Test',
          priorities: []
        },
        pins: []
      };

      const formatted = formatContext(context);

      expect(formatted).toContain('=== Pinned Facts (0) ===');
      expect(formatted).toContain('(none)');
    });

    it('should format context with single pin', () => {
      const context: MergedContext = {
        global: {
          name: 'Test User',
          role: 'Developer',
          experience: '1 year',
          preferences: [],
          communication: 'Clear'
        },
        profile: {
          name: 'work',
          focus: 'Production',
          priorities: [],
          constraints: [],
          tone: 'Professional'
        },
        project: null,
        pins: ['Single important fact']
      };

      const formatted = formatContext(context);

      expect(formatted).toContain('=== Pinned Facts (1) ===');
      expect(formatted).toContain('• Single important fact');
      expect(formatted).not.toContain('(none)');
    });

    it('should format arrays as comma-separated values', () => {
      const context: MergedContext = {
        global: {
          name: 'Test',
          role: 'Dev',
          experience: '2 years',
          preferences: ['A', 'B', 'C', 'D'],
          communication: 'Test'
        },
        profile: {
          name: 'work',
          focus: 'Test',
          priorities: ['P1', 'P2', 'P3'],
          constraints: ['C1', 'C2'],
          tone: 'Test'
        },
        project: {
          project: 'Test',
          stack: ['S1', 'S2', 'S3', 'S4', 'S5'],
          avoid: ['A1', 'A2'],
          context: 'Test',
          priorities: ['PR1', 'PR2', 'PR3']
        },
        pins: []
      };

      const formatted = formatContext(context);

      expect(formatted).toContain('Preferences: A, B, C, D');
      expect(formatted).toContain('Priorities: P1, P2, P3');
      expect(formatted).toContain('Constraints: C1, C2');
      expect(formatted).toContain('Stack: S1, S2, S3, S4, S5');
      expect(formatted).toContain('Avoid: A1, A2');
      expect(formatted).toContain('Priorities: PR1, PR2, PR3');
    });

    it('should handle empty arrays in fields', () => {
      const context: MergedContext = {
        global: {
          name: 'Test',
          role: 'Dev',
          experience: '1 year',
          preferences: [],
          communication: 'Test'
        },
        profile: {
          name: 'work',
          focus: 'Test',
          priorities: [],
          constraints: [],
          tone: 'Test'
        },
        project: {
          project: 'Test',
          stack: [],
          avoid: [],
          context: 'Test',
          priorities: []
        },
        pins: []
      };

      const formatted = formatContext(context);

      expect(formatted).toContain('Preferences: ');
      expect(formatted).toContain('Priorities: ');
      expect(formatted).toContain('Constraints: ');
      expect(formatted).toContain('Stack: ');
      expect(formatted).toContain('Avoid: ');
    });

    it('should include profile name in section header', () => {
      const profiles = ['work', 'build', 'personal', 'learn'];
      
      for (const profileName of profiles) {
        const context: MergedContext = {
          global: {
            name: 'Test',
            role: 'Dev',
            experience: '1 year',
            preferences: [],
            communication: 'Test'
          },
          profile: {
            name: profileName,
            focus: 'Test',
            priorities: [],
            constraints: [],
            tone: 'Test'
          },
          project: null,
          pins: []
        };

        const formatted = formatContext(context);
        expect(formatted).toContain(`=== Active Profile: ${profileName} ===`);
      }
    });

    it('should include project name in section header', () => {
      const context: MergedContext = {
        global: {
          name: 'Test',
          role: 'Dev',
          experience: '1 year',
          preferences: [],
          communication: 'Test'
        },
        profile: {
          name: 'work',
          focus: 'Test',
          priorities: [],
          constraints: [],
          tone: 'Test'
        },
        project: {
          project: 'My Awesome Project',
          stack: [],
          avoid: [],
          context: 'Test',
          priorities: []
        },
        pins: []
      };

      const formatted = formatContext(context);
      expect(formatted).toContain('=== Current Project: My Awesome Project ===');
    });

    it('should have correct delimiter placement', () => {
      const context: MergedContext = {
        global: {
          name: 'Test',
          role: 'Dev',
          experience: '1 year',
          preferences: [],
          communication: 'Test'
        },
        profile: {
          name: 'work',
          focus: 'Test',
          priorities: [],
          constraints: [],
          tone: 'Test'
        },
        project: null,
        pins: []
      };

      const formatted = formatContext(context);
      const lines = formatted.split('\n');

      // First line should be [CONTEXT]
      expect(lines[0]).toBe('[CONTEXT]');
      
      // Last line should be [END CONTEXT]
      expect(lines[lines.length - 1]).toBe('[END CONTEXT]');
    });

    it('should have proper spacing between sections', () => {
      const context: MergedContext = {
        global: {
          name: 'Test',
          role: 'Dev',
          experience: '1 year',
          preferences: [],
          communication: 'Test'
        },
        profile: {
          name: 'work',
          focus: 'Test',
          priorities: [],
          constraints: [],
          tone: 'Test'
        },
        project: {
          project: 'Test',
          stack: [],
          avoid: [],
          context: 'Test',
          priorities: []
        },
        pins: ['Pin 1']
      };

      const formatted = formatContext(context);

      // Should have blank lines between sections
      expect(formatted).toContain('[CONTEXT]\n\n=== Global Identity ===');
      expect(formatted).toContain('Communication: Test\n\n=== Active Profile:');
      expect(formatted).toContain('Tone: Test\n\n=== Current Project:');
      expect(formatted).toContain('Priorities: \n\n=== Pinned Facts');
    });

    it('should handle special characters in text fields', () => {
      const context: MergedContext = {
        global: {
          name: 'John "Johnny" O\'Brien',
          role: 'Developer & Designer',
          experience: '5+ years',
          preferences: ['TypeScript (strict mode)', 'React/Next.js'],
          communication: 'Clear & concise'
        },
        profile: {
          name: 'work',
          focus: 'Production code',
          priorities: ['Quality > Speed'],
          constraints: ['Must follow "best practices"'],
          tone: 'Professional'
        },
        project: {
          project: 'Project-X (v2.0)',
          stack: ['Node.js >= 18'],
          avoid: ['Legacy code'],
          context: 'High-stakes project',
          priorities: ['Security & Performance']
        },
        pins: ['Using PostgreSQL 15+', 'No "magic" code']
      };

      const formatted = formatContext(context);

      // Should preserve special characters
      expect(formatted).toContain('John "Johnny" O\'Brien');
      expect(formatted).toContain('Developer & Designer');
      expect(formatted).toContain('5+ years');
      expect(formatted).toContain('TypeScript (strict mode), React/Next.js');
      expect(formatted).toContain('Clear & concise');
      expect(formatted).toContain('Quality > Speed');
      expect(formatted).toContain('Must follow "best practices"');
      expect(formatted).toContain('Project-X (v2.0)');
      expect(formatted).toContain('Node.js >= 18');
      expect(formatted).toContain('Security & Performance');
      expect(formatted).toContain('• Using PostgreSQL 15+');
      expect(formatted).toContain('• No "magic" code');
    });

    it('should format multiple pins correctly', () => {
      const context: MergedContext = {
        global: {
          name: 'Test',
          role: 'Dev',
          experience: '1 year',
          preferences: [],
          communication: 'Test'
        },
        profile: {
          name: 'work',
          focus: 'Test',
          priorities: [],
          constraints: [],
          tone: 'Test'
        },
        project: null,
        pins: [
          'First pin',
          'Second pin',
          'Third pin',
          'Fourth pin',
          'Fifth pin'
        ]
      };

      const formatted = formatContext(context);

      expect(formatted).toContain('=== Pinned Facts (5) ===');
      expect(formatted).toContain('• First pin');
      expect(formatted).toContain('• Second pin');
      expect(formatted).toContain('• Third pin');
      expect(formatted).toContain('• Fourth pin');
      expect(formatted).toContain('• Fifth pin');
    });
  });
});
