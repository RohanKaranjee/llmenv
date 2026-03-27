import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import fs from 'fs/promises';
import path from 'path';
import os from 'os';
import { 
  registerProject, 
  listProjects, 
  getProject, 
  updateLastActive, 
  removeProject 
} from '../../src/core/projects.js';
import type { ProjectConfig } from '../../src/types/index.js';

describe('Project Registry Manager', () => {
  let testDir: string;
  let originalEnv: string | undefined;

  beforeEach(async () => {
    // Create temporary test directory with unique name (timestamp + random)
    testDir = path.join(os.tmpdir(), `llmenv-test-${Date.now()}-${Math.random().toString(36).substring(7)}`);
    await fs.mkdir(testDir, { recursive: true });
    
    // Override LLMENV_HOME to use test directory
    originalEnv = process.env.LLMENV_HOME;
    process.env.LLMENV_HOME = testDir;
  });

  afterEach(async () => {
    // Restore original environment
    if (originalEnv !== undefined) {
      process.env.LLMENV_HOME = originalEnv;
    } else {
      delete process.env.LLMENV_HOME;
    }
    
    // Clean up test directory
    await fs.rm(testDir, { recursive: true, force: true });
  });

  describe('registerProject', () => {
    it('should create projects.json if it does not exist', async () => {
      const projectPath = '/test/project/path';
      const config: ProjectConfig = {
        project: 'Test Project',
        stack: ['TypeScript', 'Node.js'],
        avoid: ['PHP'],
        context: 'Test project context',
        priorities: ['Speed', 'Quality']
      };

      await registerProject(projectPath, config);

      const projectsPath = path.join(testDir, 'projects.json');
      const exists = await fs.access(projectsPath).then(() => true).catch(() => false);
      expect(exists).toBe(true);
    });

    it('should add a new project to the registry', async () => {
      const projectPath = '/test/project/path';
      const config: ProjectConfig = {
        project: 'Test Project',
        stack: ['TypeScript', 'Node.js'],
        avoid: ['PHP'],
        context: 'Test project context',
        priorities: ['Speed', 'Quality']
      };

      await registerProject(projectPath, config);

      const projectsPath = path.join(testDir, 'projects.json');
      const content = await fs.readFile(projectsPath, 'utf-8');
      const projects = JSON.parse(content);

      expect(projects).toHaveLength(1);
      expect(projects[0].name).toBe('Test Project');
      expect(projects[0].path).toBe(path.resolve(projectPath));
      expect(projects[0].config).toEqual(config);
      expect(projects[0].lastActive).toBeDefined();
    });

    it('should store absolute path for the project', async () => {
      const relativePath = 'relative/project/path';
      const config: ProjectConfig = {
        project: 'Relative Project',
        stack: ['Python'],
        avoid: [],
        context: 'Test',
        priorities: []
      };

      await registerProject(relativePath, config);

      const projectsPath = path.join(testDir, 'projects.json');
      const content = await fs.readFile(projectsPath, 'utf-8');
      const projects = JSON.parse(content);

      expect(projects[0].path).toBe(path.resolve(relativePath));
      expect(path.isAbsolute(projects[0].path)).toBe(true);
    });

    it('should update existing project with new timestamp', async () => {
      const projectPath = '/test/project/path';
      const config1: ProjectConfig = {
        project: 'Test Project',
        stack: ['TypeScript'],
        avoid: [],
        context: 'Original context',
        priorities: ['Speed']
      };

      // Register first time
      await registerProject(projectPath, config1);

      const projectsPath = path.join(testDir, 'projects.json');
      const content1 = await fs.readFile(projectsPath, 'utf-8');
      const projects1 = JSON.parse(content1);
      const firstTimestamp = projects1[0].lastActive;

      // Wait a bit to ensure timestamp changes
      await new Promise(resolve => setTimeout(resolve, 10));

      // Register again with updated config
      const config2: ProjectConfig = {
        project: 'Test Project Updated',
        stack: ['TypeScript', 'React'],
        avoid: ['Vue'],
        context: 'Updated context',
        priorities: ['Speed', 'Quality']
      };

      await registerProject(projectPath, config2);

      const content2 = await fs.readFile(projectsPath, 'utf-8');
      const projects2 = JSON.parse(content2);

      // Should still have only one project
      expect(projects2).toHaveLength(1);
      
      // Should have updated config
      expect(projects2[0].name).toBe('Test Project Updated');
      expect(projects2[0].config).toEqual(config2);
      
      // Should have updated timestamp
      expect(projects2[0].lastActive).not.toBe(firstTimestamp);
      expect(new Date(projects2[0].lastActive).getTime()).toBeGreaterThan(
        new Date(firstTimestamp).getTime()
      );
    });

    it('should handle multiple projects in registry', async () => {
      const project1Path = '/test/project1';
      const config1: ProjectConfig = {
        project: 'Project 1',
        stack: ['TypeScript'],
        avoid: [],
        context: 'First project',
        priorities: []
      };

      const project2Path = '/test/project2';
      const config2: ProjectConfig = {
        project: 'Project 2',
        stack: ['Python'],
        avoid: [],
        context: 'Second project',
        priorities: []
      };

      await registerProject(project1Path, config1);
      await registerProject(project2Path, config2);

      const projectsPath = path.join(testDir, 'projects.json');
      const content = await fs.readFile(projectsPath, 'utf-8');
      const projects = JSON.parse(content);

      expect(projects).toHaveLength(2);
      expect(projects[0].name).toBe('Project 1');
      expect(projects[1].name).toBe('Project 2');
    });

    it('should store current timestamp in ISO 8601 format', async () => {
      const projectPath = '/test/project/path';
      const config: ProjectConfig = {
        project: 'Test Project',
        stack: ['TypeScript'],
        avoid: [],
        context: 'Test',
        priorities: []
      };

      const beforeTime = new Date();
      await registerProject(projectPath, config);
      const afterTime = new Date();

      const projectsPath = path.join(testDir, 'projects.json');
      const content = await fs.readFile(projectsPath, 'utf-8');
      const projects = JSON.parse(content);

      const timestamp = new Date(projects[0].lastActive);
      
      // Verify it's a valid ISO 8601 timestamp
      expect(projects[0].lastActive).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/);
      
      // Verify timestamp is between before and after
      expect(timestamp.getTime()).toBeGreaterThanOrEqual(beforeTime.getTime());
      expect(timestamp.getTime()).toBeLessThanOrEqual(afterTime.getTime());
    });
  });

  describe('listProjects', () => {
    it('should return empty array when no projects registered', async () => {
      const projects = await listProjects();
      expect(projects).toEqual([]);
    });

    it('should return all registered projects', async () => {
      const project1Path = '/test/project1';
      const config1: ProjectConfig = {
        project: 'Project 1',
        stack: ['TypeScript'],
        avoid: [],
        context: 'First project',
        priorities: []
      };

      const project2Path = '/test/project2';
      const config2: ProjectConfig = {
        project: 'Project 2',
        stack: ['Python'],
        avoid: [],
        context: 'Second project',
        priorities: []
      };

      await registerProject(project1Path, config1);
      await registerProject(project2Path, config2);

      const projects = await listProjects();
      expect(projects).toHaveLength(2);
    });

    it('should sort projects by lastActive descending (most recent first)', async () => {
      const project1Path = '/test/project1';
      const config1: ProjectConfig = {
        project: 'Project 1',
        stack: ['TypeScript'],
        avoid: [],
        context: 'First project',
        priorities: []
      };

      const project2Path = '/test/project2';
      const config2: ProjectConfig = {
        project: 'Project 2',
        stack: ['Python'],
        avoid: [],
        context: 'Second project',
        priorities: []
      };

      // Register project1 first
      await registerProject(project1Path, config1);
      
      // Wait to ensure different timestamps
      await new Promise(resolve => setTimeout(resolve, 10));
      
      // Register project2 second (should be more recent)
      await registerProject(project2Path, config2);

      const projects = await listProjects();
      
      // Project 2 should be first (most recent)
      expect(projects[0].name).toBe('Project 2');
      expect(projects[1].name).toBe('Project 1');
      
      // Verify timestamps are in descending order
      const time1 = new Date(projects[0].lastActive).getTime();
      const time2 = new Date(projects[1].lastActive).getTime();
      expect(time1).toBeGreaterThan(time2);
    });
  });

  describe('getProject', () => {
    it('should return null when project not found', async () => {
      const project = await getProject('/nonexistent/project');
      expect(project).toBeNull();
    });

    it('should retrieve project by absolute path', async () => {
      const projectPath = '/test/project/path';
      const config: ProjectConfig = {
        project: 'Test Project',
        stack: ['TypeScript', 'Node.js'],
        avoid: ['PHP'],
        context: 'Test project context',
        priorities: ['Speed', 'Quality']
      };

      await registerProject(projectPath, config);

      const project = await getProject(projectPath);
      
      expect(project).not.toBeNull();
      expect(project?.name).toBe('Test Project');
      expect(project?.path).toBe(path.resolve(projectPath));
      expect(project?.config).toEqual(config);
    });

    it('should resolve relative paths to absolute before searching', async () => {
      const relativePath = 'relative/project/path';
      const config: ProjectConfig = {
        project: 'Relative Project',
        stack: ['Python'],
        avoid: [],
        context: 'Test',
        priorities: []
      };

      await registerProject(relativePath, config);

      // Search using the same relative path
      const project = await getProject(relativePath);
      
      expect(project).not.toBeNull();
      expect(project?.name).toBe('Relative Project');
      expect(project?.path).toBe(path.resolve(relativePath));
    });

    it('should return null for different path to same project', async () => {
      const projectPath = '/test/project';
      const config: ProjectConfig = {
        project: 'Test Project',
        stack: ['TypeScript'],
        avoid: [],
        context: 'Test',
        priorities: []
      };

      await registerProject(projectPath, config);

      // Try to get with a different path
      const project = await getProject('/test/different');
      expect(project).toBeNull();
    });
  });

  describe('updateLastActive', () => {
    it('should update timestamp for existing project', async () => {
      const projectPath = '/test/project/path';
      const config: ProjectConfig = {
        project: 'Test Project',
        stack: ['TypeScript'],
        avoid: [],
        context: 'Test',
        priorities: []
      };

      await registerProject(projectPath, config);

      const projectBefore = await getProject(projectPath);
      const timestampBefore = projectBefore?.lastActive;

      // Wait to ensure timestamp changes
      await new Promise(resolve => setTimeout(resolve, 10));

      await updateLastActive(projectPath);

      const projectAfter = await getProject(projectPath);
      const timestampAfter = projectAfter?.lastActive;

      expect(timestampAfter).not.toBe(timestampBefore);
      expect(new Date(timestampAfter!).getTime()).toBeGreaterThan(
        new Date(timestampBefore!).getTime()
      );
    });

    it('should throw error when project not found', async () => {
      await expect(updateLastActive('/nonexistent/project')).rejects.toThrow(
        'Project not found'
      );
    });

    it('should update timestamp to current time', async () => {
      const projectPath = '/test/project/path';
      const config: ProjectConfig = {
        project: 'Test Project',
        stack: ['TypeScript'],
        avoid: [],
        context: 'Test',
        priorities: []
      };

      await registerProject(projectPath, config);

      const beforeTime = new Date();
      await updateLastActive(projectPath);
      const afterTime = new Date();

      const project = await getProject(projectPath);
      const timestamp = new Date(project!.lastActive);

      expect(timestamp.getTime()).toBeGreaterThanOrEqual(beforeTime.getTime());
      expect(timestamp.getTime()).toBeLessThanOrEqual(afterTime.getTime());
    });
  });

  describe('removeProject', () => {
    it('should remove project from registry', async () => {
      const projectPath = '/test/project/path';
      const config: ProjectConfig = {
        project: 'Test Project',
        stack: ['TypeScript'],
        avoid: [],
        context: 'Test',
        priorities: []
      };

      await registerProject(projectPath, config);

      // Verify project exists
      let project = await getProject(projectPath);
      expect(project).not.toBeNull();

      // Remove project
      await removeProject(projectPath);

      // Verify project no longer exists
      project = await getProject(projectPath);
      expect(project).toBeNull();
    });

    it('should not affect other projects when removing one', async () => {
      const project1Path = '/test/project1';
      const config1: ProjectConfig = {
        project: 'Project 1',
        stack: ['TypeScript'],
        avoid: [],
        context: 'First project',
        priorities: []
      };

      const project2Path = '/test/project2';
      const config2: ProjectConfig = {
        project: 'Project 2',
        stack: ['Python'],
        avoid: [],
        context: 'Second project',
        priorities: []
      };

      await registerProject(project1Path, config1);
      await registerProject(project2Path, config2);

      // Remove project1
      await removeProject(project1Path);

      // Verify project1 is gone
      const project1 = await getProject(project1Path);
      expect(project1).toBeNull();

      // Verify project2 still exists
      const project2 = await getProject(project2Path);
      expect(project2).not.toBeNull();
      expect(project2?.name).toBe('Project 2');
    });

    it('should handle removing non-existent project gracefully', async () => {
      // Should not throw error
      await expect(removeProject('/nonexistent/project')).resolves.not.toThrow();
      
      // Verify projects list is still empty
      const projects = await listProjects();
      expect(projects).toEqual([]);
    });

    it('should resolve relative paths before removing', async () => {
      const relativePath = 'relative/project/path';
      const config: ProjectConfig = {
        project: 'Relative Project',
        stack: ['Python'],
        avoid: [],
        context: 'Test',
        priorities: []
      };

      await registerProject(relativePath, config);

      // Remove using relative path
      await removeProject(relativePath);

      // Verify project is removed
      const project = await getProject(relativePath);
      expect(project).toBeNull();
    });
  });
});
