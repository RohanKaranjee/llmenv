import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { projectsCommand } from '../../src/commands/projects.js';
import * as projectsCore from '../../src/core/projects.js';
import * as formatters from '../../src/utils/formatters.js';
import type { ProjectEntry } from '../../src/types/index.js';

// Mock the dependencies
vi.mock('../../src/core/projects.js');
vi.mock('../../src/utils/formatters.js');

describe('projectsCommand', () => {
  let consoleLogSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should call listProjects to get all projects', async () => {
    const mockProjects: ProjectEntry[] = [];
    vi.mocked(projectsCore.listProjects).mockResolvedValue(mockProjects);
    vi.mocked(formatters.formatProjectList).mockReturnValue('No projects registered yet');

    await projectsCommand();

    expect(projectsCore.listProjects).toHaveBeenCalledOnce();
  });

  it('should format projects using formatProjectList', async () => {
    const mockProjects: ProjectEntry[] = [
      {
        name: 'Test Project',
        path: '/test/path',
        lastActive: '2024-03-15T14:30:00.000Z',
        config: {
          project: 'Test Project',
          stack: ['TypeScript'],
          avoid: [],
          context: 'Test context',
          priorities: ['Testing']
        }
      }
    ];
    vi.mocked(projectsCore.listProjects).mockResolvedValue(mockProjects);
    vi.mocked(formatters.formatProjectList).mockReturnValue('Formatted output');

    await projectsCommand();

    expect(formatters.formatProjectList).toHaveBeenCalledWith(mockProjects);
  });

  it('should display formatted output to console', async () => {
    const mockProjects: ProjectEntry[] = [];
    const formattedOutput = 'No projects registered yet';
    vi.mocked(projectsCore.listProjects).mockResolvedValue(mockProjects);
    vi.mocked(formatters.formatProjectList).mockReturnValue(formattedOutput);

    await projectsCommand();

    expect(consoleLogSpy).toHaveBeenCalledWith(formattedOutput);
    expect(consoleLogSpy).toHaveBeenCalledWith(); // Empty line for spacing
  });

  it('should display "No projects registered yet" when empty', async () => {
    const mockProjects: ProjectEntry[] = [];
    const emptyMessage = 'No projects registered yet';
    vi.mocked(projectsCore.listProjects).mockResolvedValue(mockProjects);
    vi.mocked(formatters.formatProjectList).mockReturnValue(emptyMessage);

    await projectsCommand();

    expect(consoleLogSpy).toHaveBeenCalledWith(emptyMessage);
  });

  it('should display multiple projects in sorted order', async () => {
    const mockProjects: ProjectEntry[] = [
      {
        name: 'Recent Project',
        path: '/recent',
        lastActive: '2024-03-15T14:30:00.000Z',
        config: {
          project: 'Recent Project',
          stack: [],
          avoid: [],
          context: '',
          priorities: []
        }
      },
      {
        name: 'Old Project',
        path: '/old',
        lastActive: '2024-03-10T10:00:00.000Z',
        config: {
          project: 'Old Project',
          stack: [],
          avoid: [],
          context: '',
          priorities: []
        }
      }
    ];
    const formattedOutput = 'Name  Path  Last Active\nRecent Project  /recent  5 days ago\nOld Project  /old  10 days ago';
    vi.mocked(projectsCore.listProjects).mockResolvedValue(mockProjects);
    vi.mocked(formatters.formatProjectList).mockReturnValue(formattedOutput);

    await projectsCommand();

    expect(formatters.formatProjectList).toHaveBeenCalledWith(mockProjects);
    expect(consoleLogSpy).toHaveBeenCalledWith(formattedOutput);
  });
});
