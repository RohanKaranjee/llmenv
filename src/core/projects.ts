import path from 'path';
import type { ProjectEntry, ProjectConfig } from '../types/index.js';
import { getProjectsPath, readJSON, writeJSON } from './config.js';

/**
 * Register a project in the global project registry.
 * 
 * Adds a new project to ~/.llmenv/projects.json or updates an existing one
 * with the current timestamp. Creates the projects.json file if it doesn't exist.
 * Projects are identified by their absolute path.
 * 
 * @param projectPath - Absolute path to the project directory (will be resolved if relative)
 * @param config - Project configuration from .llmenv file
 * @throws {ConfigError} If registry file operations fail
 * 
 * @example
 * ```typescript
 * const config = {
 *   project: 'my-app',
 *   stack: ['Node.js', 'TypeScript'],
 *   avoid: [],
 *   context: 'A CLI tool for developers',
 *   priorities: ['Performance', 'Maintainability']
 * };
 * await registerProject('/home/user/projects/my-app', config);
 * ```
 */
export async function registerProject(
  projectPath: string,
  config: ProjectConfig
): Promise<void> {
  // Ensure we have an absolute path
  const absolutePath = path.resolve(projectPath);
  
  // Read existing projects or start with empty array
  const projectsPath = getProjectsPath();
  const projects = await readJSON<ProjectEntry[]>(projectsPath, []);
  
  // Check if project already exists
  const existingIndex = projects.findIndex(p => p.path === absolutePath);
  
  // Create project entry with current timestamp
  const entry: ProjectEntry = {
    name: config.project,
    path: absolutePath,
    lastActive: new Date().toISOString(),
    config
  };
  
  if (existingIndex >= 0) {
    // Update existing project
    projects[existingIndex] = entry;
  } else {
    // Add new project
    projects.push(entry);
  }
  
  // Write back to registry
  await writeJSON(projectsPath, projects);
}

/**
 * List all registered projects sorted by last active timestamp.
 * 
 * Reads all projects from ~/.llmenv/projects.json and returns them sorted
 * by lastActive timestamp in descending order (most recent first). Returns
 * an empty array if no projects are registered.
 * 
 * @returns Promise resolving to array of project entries sorted by lastActive descending
 * @throws {ConfigError} If registry file operations fail or JSON is invalid
 * 
 * @example
 * ```typescript
 * const projects = await listProjects();
 * console.log(`Found ${projects.length} registered projects`);
 * projects.forEach(project => {
 *   console.log(`${project.name}: ${project.path}`);
 *   console.log(`Last active: ${project.lastActive}`);
 * });
 * ```
 */
export async function listProjects(): Promise<ProjectEntry[]> {
  const projectsPath = getProjectsPath();
  const projects = await readJSON<ProjectEntry[]>(projectsPath, []);
  
  // Sort by lastActive descending (most recent first)
  return projects.sort((a, b) => {
    const timeA = new Date(a.lastActive).getTime();
    const timeB = new Date(b.lastActive).getTime();
    return timeB - timeA;
  });
}

/**
 * Retrieve a project entry by its absolute path.
 * 
 * Searches the project registry for a project with the specified path.
 * Returns null if no project is found at that path.
 * 
 * @param projectPath - Absolute path to the project directory (will be resolved if relative)
 * @returns Promise resolving to project entry if found, null otherwise
 * @throws {ConfigError} If registry file operations fail or JSON is invalid
 * 
 * @example
 * ```typescript
 * const project = await getProject('/home/user/projects/my-app');
 * if (project) {
 *   console.log(`Found project: ${project.name}`);
 *   console.log(`Stack: ${project.config.stack.join(', ')}`);
 * }
 * ```
 */
export async function getProject(projectPath: string): Promise<ProjectEntry | null> {
  const absolutePath = path.resolve(projectPath);
  const projectsPath = getProjectsPath();
  const projects = await readJSON<ProjectEntry[]>(projectsPath, []);
  
  const project = projects.find(p => p.path === absolutePath);
  return project || null;
}

/**
 * Update the lastActive timestamp for a project.
 * 
 * Sets the lastActive timestamp to the current time for the specified project.
 * Throws an error if the project is not found in the registry.
 * 
 * @param projectPath - Absolute path to the project directory (will be resolved if relative)
 * @throws {ConfigError} If registry file operations fail
 * @throws {Error} If project is not found in the registry
 * 
 * @example
 * ```typescript
 * await updateLastActive('/home/user/projects/my-app');
 * console.log('Project timestamp updated');
 * ```
 */
export async function updateLastActive(projectPath: string): Promise<void> {
  const absolutePath = path.resolve(projectPath);
  const projectsPath = getProjectsPath();
  const projects = await readJSON<ProjectEntry[]>(projectsPath, []);
  
  const projectIndex = projects.findIndex(p => p.path === absolutePath);
  
  if (projectIndex === -1) {
    throw new Error(`Project not found: ${absolutePath}`);
  }
  
  // Update timestamp
  projects[projectIndex].lastActive = new Date().toISOString();
  
  // Write back to registry
  await writeJSON(projectsPath, projects);
}

/**
 * Remove a project from the registry.
 * 
 * Removes the project with the specified path from ~/.llmenv/projects.json.
 * Does nothing if the project is not found (no error is thrown).
 * 
 * @param projectPath - Absolute path to the project directory (will be resolved if relative)
 * @throws {ConfigError} If registry file operations fail
 * 
 * @example
 * ```typescript
 * await removeProject('/home/user/projects/old-app');
 * console.log('Project removed from registry');
 * ```
 */
export async function removeProject(projectPath: string): Promise<void> {
  const absolutePath = path.resolve(projectPath);
  const projectsPath = getProjectsPath();
  const projects = await readJSON<ProjectEntry[]>(projectsPath, []);
  
  // Filter out the project to remove
  const filteredProjects = projects.filter(p => p.path !== absolutePath);
  
  // Write back to registry
  await writeJSON(projectsPath, filteredProjects);
}
