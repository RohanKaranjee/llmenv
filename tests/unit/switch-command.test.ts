import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { switchCommand } from '../../src/commands/switch.js';
import * as projectsModule from '../../src/core/projects.js';
import * as contextModule from '../../src/core/context.js';
import inquirer from 'inquirer';
import type { ProjectEntry } from '../../src/types/index.js';

// Mock modules
vi.mock('../../src/core/projects.js');
vi.mock('../../src/core/context.js');
vi.mock('inquirer');

describe('switch command', () => {
  let consoleLogSpy: any;
  let processChdirSpy: any;
  
  beforeEach(() => {
    consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    processChdirSpy = vi.spyOn(process, 'chdir').mockImplementation(() => {});
  });
  
  afterEach(() => {
    vi.restoreAllMocks();
  });
  
  it('should display "No projects registered yet" when no projects exist', async () => {
    // Mock empty project list
    vi.mocked(projectsModule.listProjects).mockResolvedValue([]);
    
    await switchCommand();
    
    expect(consoleLogSpy).toHaveBeenCalledWith(
      expect.stringContaining('No projects registered yet')
    );
  });
  
  it('should display interactive list of projects', async () => {
    const mockProjects: ProjectEntry[] = [
      {
        name: 'project-1',
        path: '/path/to/project-1',
        lastActive: new Date().toISOString(),
        config: {
          project: 'project-1',
          stack: ['TypeScript'],
          avoid: [],
          context: 'Test project 1',
          priorities: ['Speed']
        }
      },
      {
        name: 'project-2',
        path: '/path/to/project-2',
        lastActive: new Date(Date.now() - 86400000).toISOString(),
        config: {
          project: 'project-2',
          stack: ['Python'],
          avoid: [],
          context: 'Test project 2',
          priorities: ['Quality']
        }
      }
    ];
    
    vi.mocked(projectsModule.listProjects).mockResolvedValue(mockProjects);
    vi.mocked(contextModule.findProjectRoot).mockResolvedValue(null);
    vi.mocked(inquirer.prompt).mockResolvedValue({ projectPath: '/path/to/project-1' });
    
    await switchCommand();
    
    // Verify inquirer was called with correct choices
    expect(inquirer.prompt).toHaveBeenCalledWith([
      expect.objectContaining({
        type: 'list',
        name: 'projectPath',
        message: 'Select a project:',
        choices: expect.arrayContaining([
          expect.objectContaining({
            value: '/path/to/project-1',
            short: 'project-1'
          }),
          expect.objectContaining({
            value: '/path/to/project-2',
            short: 'project-2'
          })
        ])
      })
    ]);
  });
  
  it('should highlight currently detected project', async () => {
    const mockProjects: ProjectEntry[] = [
      {
        name: 'current-project',
        path: '/path/to/current',
        lastActive: new Date().toISOString(),
        config: {
          project: 'current-project',
          stack: ['TypeScript'],
          avoid: [],
          context: 'Current project',
          priorities: ['Speed']
        }
      },
      {
        name: 'other-project',
        path: '/path/to/other',
        lastActive: new Date(Date.now() - 86400000).toISOString(),
        config: {
          project: 'other-project',
          stack: ['Python'],
          avoid: [],
          context: 'Other project',
          priorities: ['Quality']
        }
      }
    ];
    
    vi.mocked(projectsModule.listProjects).mockResolvedValue(mockProjects);
    vi.mocked(contextModule.findProjectRoot).mockResolvedValue('/path/to/current');
    vi.mocked(inquirer.prompt).mockResolvedValue({ projectPath: '/path/to/other' });
    
    await switchCommand();
    
    // Verify inquirer was called with choices that include current marker
    const promptCall = vi.mocked(inquirer.prompt).mock.calls[0][0] as any;
    const choices = promptCall[0].choices;
    
    // Current project should have "← current" marker
    const currentChoice = choices.find((c: any) => c.value === '/path/to/current');
    expect(currentChoice.name).toContain('← current');
    
    // Other project should not have the marker
    const otherChoice = choices.find((c: any) => c.value === '/path/to/other');
    expect(otherChoice.name).not.toContain('← current');
  });
  
  it('should change working directory to selected project', async () => {
    const mockProjects: ProjectEntry[] = [
      {
        name: 'selected-project',
        path: '/path/to/selected',
        lastActive: new Date().toISOString(),
        config: {
          project: 'selected-project',
          stack: ['TypeScript'],
          avoid: [],
          context: 'Selected project',
          priorities: ['Speed']
        }
      }
    ];
    
    vi.mocked(projectsModule.listProjects).mockResolvedValue(mockProjects);
    vi.mocked(contextModule.findProjectRoot).mockResolvedValue(null);
    vi.mocked(inquirer.prompt).mockResolvedValue({ projectPath: '/path/to/selected' });
    
    await switchCommand();
    
    // Verify process.chdir was called with selected path
    expect(processChdirSpy).toHaveBeenCalledWith('/path/to/selected');
    
    // Verify confirmation message
    expect(consoleLogSpy).toHaveBeenCalledWith(
      expect.stringContaining('✓ Switched to project: selected-project')
    );
    expect(consoleLogSpy).toHaveBeenCalledWith(
      expect.stringContaining('Path: /path/to/selected')
    );
  });
  
  it('should handle directory change errors gracefully', async () => {
    const mockProjects: ProjectEntry[] = [
      {
        name: 'invalid-project',
        path: '/invalid/path',
        lastActive: new Date().toISOString(),
        config: {
          project: 'invalid-project',
          stack: ['TypeScript'],
          avoid: [],
          context: 'Invalid project',
          priorities: ['Speed']
        }
      }
    ];
    
    vi.mocked(projectsModule.listProjects).mockResolvedValue(mockProjects);
    vi.mocked(contextModule.findProjectRoot).mockResolvedValue(null);
    vi.mocked(inquirer.prompt).mockResolvedValue({ projectPath: '/invalid/path' });
    processChdirSpy.mockImplementation(() => {
      throw new Error('Directory does not exist');
    });
    
    await switchCommand();
    
    // Verify error message is displayed
    expect(consoleLogSpy).toHaveBeenCalledWith(
      expect.stringContaining('❌ Error: Failed to change directory')
    );
  });
});
